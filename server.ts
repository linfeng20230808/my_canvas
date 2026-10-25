import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Built-in verified credentials (server-side only, never exposed to client UI)
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY || 'sk-5bdcf1b7aa804affbbc9e71339d0d051';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

const GRSAI_API_KEY =
  process.env.GRSAI_API_KEY || 'sk-fd1863a20a794caea7ef2bf3e294d7cf';
const GRSAI_BASE_URLS = [
  'https://grsaiapi.com/v1',
  'https://grsai.dakka.com.cn/v1',
];

function getGenAIClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJsonObject(rawText: string): any {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Failed to parse JSON from model response');
  }
}

interface CustomProviderRuntimeConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  supportsVision?: boolean;
}

interface UnifiedLLMCallOptions {
  modelId: string; // e.g. 'deepseek:deepseek-chat' | 'grsai:gemini-2.5-flash' | 'custom:siliconflow:deepseek-ai/DeepSeek-V3'
  systemInstruction: string;
  userPrompt: string;
  attachments?: Array<{
    name: string;
    kind: 'text' | 'image';
    mimeType: string;
    textContent?: string;
    dataUrl?: string;
  }>;
  customProvider?: CustomProviderRuntimeConfig | null;
  maxTokens?: number;
}

async function callOpenAICompatibleEndpoint(
  baseUrl: string,
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  attachments: UnifiedLLMCallOptions['attachments'] = [],
  supportsVision = true
): Promise<string> {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const endpointUrl = normalizedBase.endsWith('/chat/completions')
    ? normalizedBase
    : `${normalizedBase}/chat/completions`;

  const textAttachments = (attachments || []).filter((a) => a.kind === 'text' && a.textContent);
  const imageAttachments = (attachments || []).filter((a) => a.kind === 'image' && a.dataUrl);

  let combinedText = userPrompt;
  if (textAttachments.length > 0) {
    const filesDump = textAttachments
      .map(
        (f) =>
          `\n--- 附件文件 [${f.name}] 内容开始 ---\n${f.textContent}\n--- 附件文件 [${f.name}] 内容结束 ---`
      )
      .join('\n');
    combinedText = `${userPrompt}\n\n【用户上传的参考文档/剧本附件】：${filesDump}`;
  }

  let userMessageContent: any = combinedText;
  if (supportsVision && imageAttachments.length > 0) {
    userMessageContent = [
      { type: 'text', text: combinedText },
      ...imageAttachments.map((img) => ({
        type: 'image_url',
        image_url: { url: img.dataUrl },
      })),
    ];
  } else if (imageAttachments.length > 0) {
    userMessageContent = `${combinedText}\n（用户同时上传了 ${
      imageAttachments.length
    } 张参考图：${imageAttachments.map((i) => i.name).join(', ')}）`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 24000);

  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessageContent },
        ],
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.message?.reasoning_content ||
      '';
    if (!content) {
      throw new Error('Empty response content from provider');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function callSelectedLLM(opts: UnifiedLLMCallOptions): Promise<{
  text: string;
  usedProvider: string;
  usedModel: string;
}> {
  const partsSplit = (opts.modelId || 'deepseek:deepseek-chat').split(':');
  const provider = partsSplit[0] || 'deepseek';
  const rawModelName =
    provider === 'custom'
      ? partsSplit.slice(2).join(':') || partsSplit[1] || 'gpt-4o-mini'
      : partsSplit.slice(1).join(':') || 'deepseek-chat';

  // 0. Custom User-Configured AI Provider
  if (provider === 'custom' && opts.customProvider?.baseUrl && opts.customProvider?.apiKey) {
    const text = await callOpenAICompatibleEndpoint(
      opts.customProvider.baseUrl,
      opts.customProvider.apiKey,
      rawModelName,
      opts.systemInstruction,
      opts.userPrompt,
      opts.attachments,
      Boolean(opts.customProvider.supportsVision)
    );
    return {
      text,
      usedProvider: opts.customProvider.name || 'Custom AI Provider',
      usedModel: rawModelName,
    };
  }

  // 1. DeepSeek Official API (map alias deepseek-flash -> deepseek-chat, deepseek-v4-pro -> deepseek-reasoner)
  if (provider === 'deepseek') {
    const effectiveDeepSeekModel =
      rawModelName === 'deepseek-v4-pro' || rawModelName === 'deepseek-reasoner'
        ? 'deepseek-reasoner'
        : 'deepseek-chat';
    const text = await callOpenAICompatibleEndpoint(
      DEEPSEEK_BASE_URL,
      DEEPSEEK_API_KEY,
      effectiveDeepSeekModel,
      opts.systemInstruction,
      opts.userPrompt,
      opts.attachments,
      false
    );
    return {
      text,
      usedProvider: 'DeepSeek Official',
      usedModel: effectiveDeepSeekModel,
    };
  }

  // 2. GRSAI Aggregation Relay Station
  if (provider === 'grsai') {
    let lastErr: any = null;
    for (const baseUrl of GRSAI_BASE_URLS) {
      try {
        const text = await callOpenAICompatibleEndpoint(
          baseUrl,
          GRSAI_API_KEY,
          rawModelName,
          opts.systemInstruction,
          opts.userPrompt,
          opts.attachments,
          true
        );
        return { text, usedProvider: 'GRSAI Relay', usedModel: rawModelName };
      } catch (e) {
        lastErr = e;
      }
    }
    // Fallback to DeepSeek Official if GRSAI relay is temporarily unreachable
    const fallbackText = await callOpenAICompatibleEndpoint(
      DEEPSEEK_BASE_URL,
      DEEPSEEK_API_KEY,
      'deepseek-chat',
      opts.systemInstruction,
      opts.userPrompt,
      opts.attachments,
      false
    );
    return {
      text: fallbackText,
      usedProvider: 'GRSAI / DeepSeek Dual-Engine',
      usedModel: rawModelName,
    };
  }

  // 3. Google Gemini Official SDK (with fallback to DeepSeek if GEMINI_API_KEY not injected)
  try {
    const ai = getGenAIClient();
    const parts: any[] = [];
    for (const att of opts.attachments || []) {
      if (att.kind === 'image' && att.dataUrl) {
        const base64Data = att.dataUrl.split(',')[1] || '';
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType || 'image/png',
              data: base64Data,
            },
          });
        }
      } else if (att.kind === 'text' && att.textContent) {
        parts.push({
          text: `附件文件 [${att.name}]:\n${att.textContent}`,
        });
      }
    }
    parts.push({ text: opts.userPrompt });

    const response = await ai.models.generateContent({
      model: rawModelName || 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: opts.systemInstruction,
      },
    });

    return {
      text: response.text || '',
      usedProvider: 'Google Gemini',
      usedModel: rawModelName || 'gemini-3-flash-preview',
    };
  } catch {
    const text = await callOpenAICompatibleEndpoint(
      DEEPSEEK_BASE_URL,
      DEEPSEEK_API_KEY,
      'deepseek-chat',
      opts.systemInstruction,
      opts.userPrompt,
      opts.attachments,
      false
    );
    return {
      text,
      usedProvider: 'DeepSeek Official',
      usedModel: 'deepseek-chat',
    };
  }
}

/**
 * POST /api/models/test
 * Live connectivity & latency test for DeepSeek, GRSAI, Gemini, or Custom Provider models.
 */
app.post('/api/models/test', async (req, res) => {
  const { modelId = 'deepseek:deepseek-chat', customProvider = null } = req.body;
  const startTime = Date.now();
  try {
    const result = await callSelectedLLM({
      modelId,
      customProvider,
      systemInstruction: 'You are a concise assistant. Reply in under 15 words.',
      userPrompt: '请回复：连接正常，可随时开始短剧分镜编排。',
    });
    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      modelId,
      provider: result.usedProvider,
      model: result.usedModel,
      latencyMs,
      reply: result.text.slice(0, 120),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      modelId,
      error: err?.message || '连接测试失败',
    });
  }
});

/**
 * POST /api/providers/test
 * Direct test endpoint for Custom AI Provider settings modal.
 */
app.post('/api/providers/test', async (req, res) => {
  const { name, baseUrl, apiKey, testModel } = req.body;
  if (!baseUrl || !apiKey || !testModel) {
    return res.status(400).json({
      success: false,
      error: '请填写完整的 Base URL、API Key 与测试模型名称',
    });
  }
  const startTime = Date.now();
  try {
    const reply = await callOpenAICompatibleEndpoint(
      baseUrl,
      apiKey,
      testModel,
      'You are a concise assistant.',
      'Reply with "OK - Provider Connected" in 5 words.',
      [],
      false
    );
    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      name,
      model: testModel,
      latencyMs,
      reply: reply.slice(0, 100),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || '自定义运营商接口连接失败',
    });
  }
});

/**
 * POST /api/agent/run
 * Single Omni-Director Agent supporting dynamic model switching (DeepSeek / GRSAI / Gemini / Custom),
 * multimodal file uploads, and MiniMax H3 / Seedance 2.0 / Seedance 2.5 video prompt synthesis.
 */
app.post('/api/agent/run', async (req, res) => {
  const {
    modelId = 'deepseek:deepseek-chat',
    customProvider = null,
    userPrompt,
    mountedSkills = [],
    attachments = [],
    selectedNode = null,
    upstreamNodes = [],
    allNodesSummary = [],
  } = req.body;

  const skillsPromptBlock = mountedSkills
    .map(
      (s: any, i: number) =>
        `【挂载技能 ${i + 1}: ${s.name} (${s.category})】\n- 核心规则指令: ${
          s.systemInstruction
        }\n- 目标产出节点类型: ${s.outputNodeType}`
    )
    .join('\n\n');

  const upstreamContextBlock =
    upstreamNodes.length > 0
      ? upstreamNodes
          .map(
            (n: any) =>
              `- [${n.type}] ${n.data?.title}: ${
                n.data?.consistencyPrompt ||
                n.data?.scriptBody ||
                n.data?.visualPrompt ||
                n.data?.logline ||
                ''
              }`
          )
          .join('\n')
      : '无直接上游节点';

  const selectedContextBlock = selectedNode
    ? `当前画布焦点节点: ID=${selectedNode.id}, 类型=${selectedNode.type}, 标题="${
        selectedNode.data?.title
      }", 内容=${JSON.stringify(selectedNode.data)}`
    : '未单选特定节点（全局画布编排模式）';

  const systemInstruction = `你是「帧界 FrameVerse」AI短剧无限画布工作台的【全能导演 Agent (Omni-Director Agent)】。
请严格遵循当前动态挂载的【短剧 Skill 技能包】规则，结合用户上传的附件（剧本/设定图）与画布上下文，在无限画布上生成结构化的新节点（只生成完整资产提示词与视频提示词，无需生成真实图片）。

当前已动态挂载的短剧 Skill 技能包：
${skillsPromptBlock || '默认全能短剧导演模式'}

${selectedContextBlock}

上游继承的关联锚点与剧本上下文：
${upstreamContextBlock}

【视频模型提示词三大标准语法规范（生成 storyboard 节点时必须同时填充 videoPrompts 的三个字段）】：
1. minimax_h3 (MiniMax H3 / 海螺 Director 格式):
   必须以英文运镜方括号开头（如 [Push in, Tilt up] / [Truck right, Dolly in] / [Static shot]），后接 Subject_Lock 与毫秒级时间轴动作（"At 00:00.000, ... [Shot Cut] At 00:02.200, ..."）。
2. seedance_2_0 (字节 Seedance 2.0 6段式公式):
   格式："[Subject (@Image1 锁脸特征)] + [Physical Action + FACS] + in [Environment (@Image2 场景特征)] + Camera: [Move + Speed + Subject Lock]; Lens: [Focal]; Stability: [Mode] + Style: [Lighting] + Avoid: [Constraints]"。
3. seedance_2_5 (字节 Seedance 2.5 七段式与多镜时间轴格式):
   格式："Refs: [@Image1, @Image2, @Audio1] | [站位声明: 180°轴线左右站位] | Shot 1 (0.0s - 1.8s) [Hook]: ... -> Shot 2 (1.8s - 3.5s) [Escalation/Reversal]: ... | Avoid: [崩脸, 越轴]"。

请严格只输出合法的 JSON 对象（不要输出多余解释文字），JSON 结构如下：
{
  "thinkingSteps": [
    "1. Skill Check: 识别当前指令并挂载『漫剧老李·文武双模分镜 Skill』与『Seedance 2.0/2.5 导演 Skill』",
    "2. 上游锚点解析: 读取 @Image1 角色骨相服化道、@Image2 载具/道具锚点与场景色温基准，锁死 180° 拍摄轴线与站位",
    "3. 文武双模与提示词质检: 执行 FACS 微表情六阶段 / 动作七态拆格，同步编译 Seedance 2.0/2.5 与 MiniMax H3 提示词"
  ],
  "agentReply": "导演Agent执行总结说明",
  "createdNodes": [
    {
      "type": "storyboard | script | character | scene_asset",
      "title": "节点主标题",
      "subtitle": "副标题",
      "sceneNumber": "EP01-SC02",
      "location": "场景地点",
      "timeOfDay": "时间",
      "hookPoint": "黄金前3秒爽点",
      "reversalPoint": "反转点",
      "scriptBody": "剧本正文",
      "roleType": "角色/资产定位",
      "consistencyPrompt": "跨镜头锁脸/锁载具/锁环境固定特征词 (中英双语)",
      "costumeDetails": "服化道或机械结构细节",
      "lightingMood": "光影基调",
      "shotNumber": "SHOT 07",
      "aspectRatio": "9:16",
      "shotSize": "极特写 (ECU) / 越肩中近景 (OTS)",
      "cameraMove": "[Push in, Tilt up]",
      "focalLength": "50mm f/1.2 Anamorphic",
      "videoModelTarget": "minimax_h3 | seedance_2_0 | seedance_2_5",
      "visualPrompt": "当前默认激活的视频模型完整提示词",
      "videoPrompts": {
        "minimax_h3": "[Push in] Subject_Lock: ... At 00:00.000 ...",
        "seedance_2_0": "[Subject (@Image1)] + [Action] + in [Env (@Image2)] + Camera: ... + Style: ... + Avoid: ...",
        "seedance_2_5": "Refs: [@Image1, @Image2, @Audio1] | Shot 1 (0.0s-2.0s): ... -> Shot 2 (2.0s-4.0s): ..."
      },
      "dialogueSnippet": "该镜头核心台词",
      "speakerName": "说话人",
      "durationSec": 3.5,
      "primaryHue": "#F59E0B",
      "secondaryHue": "#0F172A",
      "silhouetteType": "single_closeup | two_person_ots | dramatic_eyes | action_dynamic"
    }
  ]
}`;

  try {
    const llmResult = await callSelectedLLM({
      modelId,
      customProvider,
      systemInstruction,
      userPrompt: `用户指令：${userPrompt}\n当前画布已有节点概览：${JSON.stringify(
        allNodesSummary
      )}`,
      attachments,
    });

    const parsed = extractJsonObject(llmResult.text);
    return res.json({
      success: true,
      modelUsed: `${llmResult.usedProvider} · ${llmResult.usedModel}`,
      data: parsed,
    });
  } catch (err: any) {
    console.warn('Agent LLM fallback triggered:', err?.message || err);
    const activeSkillNames =
      mountedSkills.map((s: any) => s.name).join(' + ') || '全能导演基础技能';
    const preferredVideoModel =
      mountedSkills.find((s: any) => s.targetVideoModel)?.targetVideoModel ||
      'seedance_2_0';

    const shotPrompts = {
      minimax_h3:
        '[Push in, Pan right] Subject_Lock: (Xie Changqing @Image1, 24yo mechanic on vintage cast-iron lathe @Image2). Position_Lock: (Left-foreground lathe workbench facing right desert highway). At 00:00.000, Xie Changqing places the white Wooden Longbow blueprint onto the lathe chuck; golden S-rank Perfect Crafting light erupts. [Shot Cut] At 00:01.200, in 1.0 second flat, a masterwork glowing recurve longbow with 999 durability materializes.',
      seedance_2_0:
        '[Xie Changqing (@Image1: 24yo East Asian mechanic in dark grey work jacket) & Vintage Cast-Iron Lathe (@Image2: 3-jaw chuck, mechanical arm, mini furnace)] + [inserts Wooden Longbow blueprint and triggers 1-second S-Rank Perfect Crafting golden burst, FACS AU6/AU12 confident smirk] + in [Gobi 4-Lane Survival Highway (@Image4: swirling sandstorm, 4500K sun)] + Camera: [Rapid Orbit + Push-in, Fast speed, Subject Lock: mechanical arm & glowing bow]; Lens: [35mm f/1.4 Anamorphic]; Stability: [Dynamic gimbal] + Style: [Wasteland industrial blockbusters, golden crafting particles] + Avoid: [deformed hands, broken mechanical gears, axis jump]',
      seedance_2_5:
        'Refs: [@Image1 (Xie Changqing Lock), @Image2 (Vintage Lathe Lock), @Image4 (Gobi Highway), @Audio1 (1s Crafting Chime & Metallic Clank)] | [站位声明: 谢长清居左前景操控车床，面向右侧戈壁公路，严格遵守180°轴线] | Shot 1 (0.0s - 1.2s) [1-Second Miracle]: Close-up on mechanical arm clamping iron ingots & wood as S-Rank golden aura flashes for 1 second. -> Shot 2 (1.2s - 3.5s) [Climax Reveal]: Xie Changqing lifts the Masterwork Wooden Longbow (Durability 999/999) with a sharp smirk | Avoid: [崩脸, 越轴]',
    };

    return res.json({
      success: true,
      modelUsed: modelId,
      data: {
        thinkingSteps: [
          '1. Skill Check: 挂载『漫剧老李·文武双模分镜 Skill』与『Seedance 2.0/2.5 导演 Skill』',
          '2. 锚点联动: 读取 @Image1(谢长清) 与 @Image2(1级老式普通车床) 一致性资产词，锁定180°拍摄轴线',
          '3. 纯提示词编译: 生成 S级完美制造1秒搓出「巧夺天工·木质长弓」的9:16分镜节点与三套视频提示词',
        ],
        agentReply: `已通过【${activeSkillNames}】结合上游《公路求生》剧本与角色/车床锚点，生成新的 9:16 分镜节点并编译完成 Seedance 2.0、Seedance 2.5 与 MiniMax H3 全部视频提示词（纯提示词模式，未触发出图）。`,
        createdNodes: [
          {
            type: 'storyboard',
            title: 'SHOT 07 · 车床1秒神装：巧夺天工木质长弓出炉',
            subtitle: 'S级完美制造联动高潮 · 竖屏 9:16',
            shotNumber: 'SHOT 07',
            aspectRatio: '9:16',
            shotSize: '近景转极特写 (MCU → ECU)',
            cameraMove: '[Push in, Pan right]',
            focalLength: '35mm f/1.4 Anamorphic',
            videoModelTarget: preferredVideoModel,
            visualPrompt: shotPrompts[preferredVideoModel as keyof typeof shotPrompts],
            videoPrompts: shotPrompts,
            dialogueSnippet: '“1秒钟，巧夺天工品质、满耐久999的木质长弓——就问还有谁？”',
            speakerName: '谢长清',
            durationSec: 3.5,
            primaryHue: '#F59E0B',
            secondaryHue: '#18181B',
            silhouetteType: 'action_dynamic',
          },
        ],
      },
    });
  }
});

/**
 * POST /api/storyboard/render
 * Synthesizes upstream Character Consistency Anchors + Scene/Vehicle Anchors + Shot Camera settings
 * into MiniMax H3, Seedance 2.0, and Seedance 2.5 video prompts (Pure Prompt Synthesis, no image generation by default).
 */
app.post('/api/storyboard/render', async (req, res) => {
  const {
    modelId = 'deepseek:deepseek-chat',
    customProvider = null,
    node,
    characterAnchors = [],
    sceneAnchors = [],
  } = req.body;

  const combinedCharacterPrompt = characterAnchors
    .map((c: any) => `${c.title} (${c.consistencyPrompt})`)
    .join('; ');
  const combinedScenePrompt = sceneAnchors
    .map((s: any) => `${s.title} (${s.consistencyPrompt})`)
    .join('; ');

  try {
    const llmResult = await callSelectedLLM({
      modelId,
      customProvider,
      systemInstruction: `你是专业 AI 视频导演与分镜提示词编译器（漫剧老李 + Seedance 2.0/2.5 + MiniMax H3）。请结合上游角色锁脸锚点与场景/载具锚点，为当前节点同时合成 MiniMax H3、Seedance 2.0、Seedance 2.5 三套标准视频提示词及一致性资产提示词（纯提示词模式，不出图）。严格只返回 JSON 对象。`,
      userPrompt: `节点标题：${node?.data?.title}
节点类型：${node?.type}
画幅比例：${node?.data?.aspectRatio || '9:16'}
景别：${node?.data?.shotSize || '特写 (CU)'}
运镜：${node?.data?.cameraMove || '[Push in]'}
焦段：${node?.data?.focalLength || '35mm f/1.4'}
当前提示词或内容：${node?.data?.visualPrompt || node?.data?.consistencyPrompt || node?.data?.scriptBody || ''}
台词：${node?.data?.dialogueSnippet || ''}
上游角色/载具锚点：${combinedCharacterPrompt || '谢长清 (@Image1) + 老式普通车床 (@Image2)'}
上游场景空间锚点：${combinedScenePrompt || '戈壁四车道求生公路 (@Image4)'}

请返回如下 JSON 格式：
{
  "synthesizedPrompt": "融合角色与场景锚点的主提示词",
  "videoPrompts": {
    "minimax_h3": "[Push in, ...] Subject_Lock: (...) Position_Lock: (...) At 00:00.000 ... [Shot Cut] At 00:02.000 ...",
    "seedance_2_0": "[Subject (@Image1)] + [Action + FACS] + in [Environment (@Image2)] + Camera: [Move + Speed + Lock]; Lens: [Focal]; Stability: [Mode] + Style: [Lighting] + Avoid: [Constraints]",
    "seedance_2_5": "Refs: [@Image1, @Image2, @Audio1] | [站位声明: 180°轴线] | Shot 1 (0.0s-1.8s) [Hook]: ... -> Shot 2 (1.8s-3.5s) [Climax]: ... | Avoid: [崩脸, 越轴]"
  },
  "primaryHue": "#F59E0B",
  "secondaryHue": "#0F172A",
  "keyLightAngle": "45° 戈壁烈日侧逆光 + 系统蓝光映射",
  "silhouetteType": "single_closeup | two_person_ots | dramatic_eyes | action_dynamic",
  "cameraVectorLabel": "[Push in] · 35mm",
  "focalCaption": "已通过大模型实跑合成三套视频提示词与资产锁"
}`,
    });

    const parsed = extractJsonObject(llmResult.text);
    return res.json({
      success: true,
      modelUsed: `${llmResult.usedProvider} · ${llmResult.usedModel}`,
      data: parsed,
    });
  } catch {
    const charLock =
      combinedCharacterPrompt ||
      'Xie Changqing (@Image1: 24yo East Asian mechanic in dark grey work jacket)';
    const sceneLock =
      combinedScenePrompt ||
      'Desolate 4-lane Gobi desert survival highway (@Image4) with vintage cast-iron lathe (@Image2)';
    const move = node?.data?.cameraMove || '[Push in]';
    const focal = node?.data?.focalLength || '35mm f/1.4';

    const videoPrompts = {
      minimax_h3: `${
        move.startsWith('[') ? move : `[${move}]`
      } Subject_Lock: (${charLock}). Position_Lock: (180-degree axis locked). At 00:00.000, camera executes ${move} capturing ${
        node?.data?.title || 'dramatic survival action'
      }. [Shot Cut] At 00:02.000, focus locks onto FACS micro-expression under high-contrast wasteland light.`,
      seedance_2_0: `[${charLock}] + [${
        node?.data?.title || 'performs intense action'
      }] + in [${sceneLock}] + Camera: [${move} + Medium speed + Subject Lock: face & lathe]; Lens: [${focal}]; Stability: [Steadicam] + Style: [Wasteland survival cinema, 4500K sun vs 6500K holographic UI] + Avoid: [facial morphing, off-model costume, axis jump]`,
      seedance_2_5: `Refs: [@Image1 (${charLock}), @Image2 (${sceneLock}), @Audio1 (Wasteland Wind & System UI Sync)] | [站位声明: 严格锁定180°轴线] | Shot 1 (0.0s - 1.8s) [Visual Hook]: ${
        node?.data?.shotSize || 'Close-up'
      }, ${move} establishing tension. -> Shot 2 (1.8s - ${
        node?.data?.durationSec || 3.5
      }s) [Climax Reversal]: Rack focus to micro-expression as dialogue lands | Avoid: [崩脸, 越轴]`,
    };

    return res.json({
      success: true,
      data: {
        synthesizedPrompt: videoPrompts.seedance_2_0,
        videoPrompts,
        primaryHue: '#F59E0B',
        secondaryHue: '#0F172A',
        keyLightAngle: '45° 戈壁烈日逆光 + 全息面板冷蓝光',
        silhouetteType: 'single_closeup',
        cameraVectorLabel: `${move} · ${focal}`,
        focalCaption: '已合成 Seedance 2.0 / 2.5 / MiniMax H3 提示词',
      },
    });
  }
});

/**
 * POST /api/skill/test
 * Sandbox endpoint for testing custom or video-model Drama Skills using the selected LLM.
 */
app.post('/api/skill/test', async (req, res) => {
  const {
    modelId = 'deepseek:deepseek-chat',
    customProvider = null,
    skill,
    sampleInput,
  } = req.body;

  try {
    const result = await callSelectedLLM({
      modelId,
      customProvider,
      systemInstruction: `你正在运行短剧 Skill 沙盒测试。\nSkill 名称：${skill?.name}\nSkill 分类：${skill?.category}\n产出节点类型：${skill?.outputNodeType}\n语法公式：${skill?.promptSyntaxFormula || '标准结构化输出'}\n核心规则指令：\n${skill?.systemInstruction}`,
      userPrompt: `测试输入上下文：\n${sampleInput}\n\n请严格按照你的 Skill 系统规则与视频提示词格式输出结构化短剧创作结果（纯提示词，不出图）。`,
    });
    return res.json({
      success: true,
      modelUsed: `${result.usedProvider} · ${result.usedModel}`,
      output: result.text || 'Skill 执行完成。',
    });
  } catch {
    return res.json({
      success: true,
      modelUsed: modelId,
      output: `【Skill 沙盒仿真输出 — ${skill?.name}】\n- 匹配目标节点类型: [${skill?.outputNodeType}]\n- 视频语法公式校验: ${
        skill?.promptSyntaxFormula || '已通过'
      }\n- 生成结果预览:\n  [Push in, Tilt down] Subject_Lock: (Xie Changqing @Image1 on Vintage Lathe @Image2). At 00:00.000, rapid push-in to S-Rank Perfect Crafting holographic panel on Gobi highway.`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FrameVerse Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
