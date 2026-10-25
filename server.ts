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
  'https://grsai.dakka.com.cn/v1',
  'https://grsaiapi.com/v1',
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
  modelId: string;
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

  const textAttachments = (attachments || []).filter(
    (a) => a.kind === 'text' && a.textContent
  );
  const imageAttachments = (attachments || []).filter(
    (a) => a.kind === 'image' && a.dataUrl
  );

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
  const timer = setTimeout(() => controller.abort(), 32000);

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

// Known image/video model names that cannot be used directly for /chat/completions text JSON reasoning
const NON_TEXT_MODEL_NAMES = new Set([
  'nano-banana-2.1',
  'nano-banana-2',
  'nano-banana-pro',
  'nano-banana-fast',
  'nano-banana-2-lite',
  'nano-banana-pro-cl',
  'nano-banana-2-cl',
  'nano-banana-2-2k-cl',
  'nano-banana-2-4k-cl',
  'nano-banana-pro-vip',
  'nano-banana-pro-4k-vip',
  'gpt-image-2.5',
  'gpt-image-2.5-sunburst',
  'gpt-image-2.5-flare',
  'gpt-image-2',
  'gpt-image-2-vip',
  'minimax-h3',
  'agnes-video-2.5',
]);

async function callSelectedLLM(opts: UnifiedLLMCallOptions): Promise<{
  text: string;
  usedProvider: string;
  usedModel: string;
}> {
  const partsSplit = (opts.modelId || 'deepseek:deepseek-chat').split(':');
  const provider = partsSplit[0] || 'deepseek';
  let rawModelName =
    provider === 'custom'
      ? partsSplit.slice(2).join(':') || partsSplit[1] || 'gpt-4o-mini'
      : partsSplit.slice(1).join(':') || 'deepseek-chat';

  // If user selected an image/video model in the global selector while asking for text/prompt synthesis,
  // route the text reasoning to gemini-2.5-flash on GRSAI or deepseek-chat so text generation succeeds cleanly.
  if (NON_TEXT_MODEL_NAMES.has(rawModelName)) {
    rawModelName = 'gemini-2.5-flash';
  }

  // 0. Custom User-Configured AI Provider
  if (
    provider === 'custom' &&
    opts.customProvider?.baseUrl &&
    opts.customProvider?.apiKey
  ) {
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

  // 1. DeepSeek Official API
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
      } catch {
        // Try next GRSAI node
      }
    }
    // Real fallback to DeepSeek Official API if specific GRSAI model node is busy
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
      usedProvider: 'DeepSeek Official (Failover)',
      usedModel: 'deepseek-chat',
    };
  }

  // 3. Google Gemini Official SDK (with real DeepSeek API failover if GEMINI_API_KEY is not configured)
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
 * Live connectivity & latency test for DeepSeek, GRSAI (Text/Image/Video), Gemini, or Custom Provider models.
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
 * POST /api/media/generate-image
 * Real Image Generation for Character 4-View Sheets (@Image1), Scene/Vehicle Anchors (@Image2),
 * and Storyboard First/Last Keyframes using GRSAI Image Models (nano-banana-fast, nano-banana-2.1, nano-banana-pro, gpt-image-2.5, etc.)
 */
app.post('/api/media/generate-image', async (req, res) => {
  const {
    prompt,
    model,
    modelId,
    aspectRatio = '9:16',
    referenceImages = [],
    referenceUrls = [],
    customProvider = null,
  } = req.body;

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: '生成图像需要提供有效的提示词 (Prompt)',
    });
  }

  const rawModel = model || modelId || 'nano-banana-fast';
  const cleanModel =
    String(rawModel).replace(/^grsai:/, '').trim() || 'nano-banana-fast';
  const validRatios = new Set([
    '1:1',
    '2:3',
    '3:2',
    '3:4',
    '4:3',
    '4:5',
    '5:4',
    '9:16',
    '16:9',
    '21:9',
  ]);
  const normalizedRatio = validRatios.has(aspectRatio) ? aspectRatio : '9:16';

  const refs = (
    Array.isArray(referenceUrls) && referenceUrls.length > 0
      ? referenceUrls
      : Array.isArray(referenceImages)
      ? referenceImages
      : []
  ).filter((u: any) => typeof u === 'string' && u.startsWith('http'));

  const candidateBases =
    customProvider?.baseUrl && customProvider?.apiKey
      ? [
          {
            url: customProvider.baseUrl.replace(/\/+$/, ''),
            key: customProvider.apiKey,
            label: customProvider.name,
          },
        ]
      : GRSAI_BASE_URLS.map((u) => ({
          url: u,
          key: GRSAI_API_KEY,
          label: 'GRSAI Image Engine',
        }));

  // Try requested model first, then fast fallback if model-specific failure occurs
  const modelsToTry = Array.from(
    new Set([cleanModel, 'nano-banana-fast', 'nano-banana-2.1'])
  );

  let lastError = '图片生成接口调用失败';

  for (const tryModel of modelsToTry) {
    for (const base of candidateBases) {
      const endpoint = base.url.endsWith('/images/generations')
        ? base.url
        : `${base.url}/images/generations`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55000);

      try {
        const payload: Record<string, any> = {
          model: tryModel,
          prompt: String(prompt).trim(),
          size: normalizedRatio,
        };
        if (refs.length > 0) {
          payload.urls = refs;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${base.key}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const errText = await response.text();
          lastError = `HTTP ${response.status}: ${errText.slice(0, 240)}`;
          continue;
        }

        const data: any = await response.json();
        const imageUrl =
          data?.data?.[0]?.url ||
          (data?.data?.[0]?.b64_json
            ? `data:image/png;base64,${data.data[0].b64_json}`
            : null) ||
          data?.results?.[0]?.url ||
          data?.url;

        if (imageUrl) {
          return res.json({
            ok: true,
            success: true,
            imageUrl,
            modelUsed: `${base.label} · ${tryModel}`,
            aspectRatio: normalizedRatio,
          });
        }
        lastError = '接口未返回有效的图片 URL';
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err?.message || '图片生成请求超时';
      }
    }
  }

  return res.status(500).json({
    ok: false,
    success: false,
    error: lastError,
  });
});

/**
 * POST /api/media/generate-video
 * Real Video Generation task submission via GRSAI (/v1/api/generate) supporting MiniMax H3 (minimax-h3) and Agnes Video 2.5 (agnes-video-2.5),
 * including Image-to-Video (I2V) reference images and audio sync.
 */
app.post('/api/media/generate-video', async (req, res) => {
  const {
    prompt,
    model,
    videoModel,
    aspectRatio = '9:16',
    resolution,
    duration = 4,
    firstFrameUrl,
    referenceImages = [],
    referenceAudios = [],
  } = req.body;

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: '生成视频需要提供有效的视频提示词 (Prompt)',
    });
  }

  const rawModel = videoModel || model || 'minimax-h3';
  const cleanModel = String(rawModel).replace(/^grsai:/, '').trim() || 'minimax-h3';
  const effectiveModel =
    cleanModel === 'minimax-h3' || cleanModel === 'agnes-video-2.5'
      ? cleanModel
      : 'minimax-h3';

  // Model-specific aspectRatio & resolution rules verified against GRSAI API:
  // - minimax-h3 requires aspectRatio: "portrait" | "landscape", resolution: "480p" | "768p" | "1080p"
  // - agnes-video-2.5 requires aspectRatio: "9:16" | "16:9", resolution: "720p" | "1080p"
  const isAgnes = effectiveModel === 'agnes-video-2.5';
  const grsaiAspectRatio = isAgnes
    ? aspectRatio === '16:9'
      ? '16:9'
      : '9:16'
    : aspectRatio === '16:9'
    ? 'landscape'
    : 'portrait';

  const grsaiResolution = isAgnes
    ? resolution === '1080p'
      ? '1080p'
      : '720p'
    : resolution || '480p';

  let lastError = '视频生成任务提交失败';

  const combinedImages = [
    ...(firstFrameUrl ? [firstFrameUrl] : []),
    ...(Array.isArray(referenceImages) ? referenceImages : []),
  ].filter((u: any) => typeof u === 'string' && u.startsWith('http'));

  for (const baseUrl of GRSAI_BASE_URLS) {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/generate`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const payload: Record<string, any> = {
        model: effectiveModel,
        prompt: String(prompt).trim(),
        aspectRatio: grsaiAspectRatio,
        resolution: grsaiResolution,
        duration: Math.min(10, Math.max(2, Math.round(Number(duration) || 4))),
        replyType: 'async',
      };

      if (combinedImages.length > 0) {
        payload.images = combinedImages;
      }

      const validAudios = (referenceAudios || []).filter(
        (u: any) => typeof u === 'string' && u.startsWith('http')
      );
      if (validAudios.length > 0) {
        payload.audios = validAudios;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GRSAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        lastError = `HTTP ${response.status}: ${errText.slice(0, 220)}`;
        continue;
      }

      const data: any = await response.json();
      const taskId = data?.id || data?.data?.id || data?.task_id;
      const status = data?.status || data?.data?.status || 'running';
      const immediateVideoUrl =
        data?.results?.[0]?.url ||
        data?.results?.[0]?.video_url ||
        data?.data?.results?.[0]?.url ||
        data?.data?.results?.[0]?.video_url ||
        data?.video_url ||
        data?.url;

      if (status === 'failed') {
        lastError = data?.error || data?.failure_reason || '视频任务创建失败';
        continue;
      }

      if (taskId || immediateVideoUrl) {
        return res.json({
          ok: true,
          success: true,
          taskId,
          status: immediateVideoUrl ? 'succeeded' : status,
          videoUrl: immediateVideoUrl || undefined,
          modelUsed: `GRSAI Video · ${effectiveModel}`,
        });
      }
      lastError = '视频接口未返回有效的任务 ID';
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err?.message || '视频生成请求异常';
    }
  }

  return res.status(500).json({
    ok: false,
    success: false,
    error: lastError,
  });
});

/**
 * POST /api/media/video-status
 * Polls GRSAI (/v1/draw/result & /v1/api/result) for async video generation progress and final MP4 URL.
 */
app.post('/api/media/video-status', async (req, res) => {
  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: '缺少视频任务 ID (taskId)',
    });
  }

  for (const baseUrl of GRSAI_BASE_URLS) {
    for (const route of ['/draw/result', '/api/result']) {
      const endpoint = `${baseUrl.replace(/\/+$/, '')}${route}`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GRSAI_API_KEY}`,
          },
          body: JSON.stringify({ id: taskId }),
        });

        if (!response.ok) continue;
        const raw: any = await response.json();
        const body = raw?.data || raw;
        const status = body?.status || 'running';
        const progress = typeof body?.progress === 'number' ? body.progress : 15;
        const results = body?.results || [];
        const videoUrl =
          results?.[0]?.video_url ||
          results?.[0]?.url ||
          body?.video_url ||
          body?.url ||
          null;
        const errorMsg = body?.failure_reason || body?.error || '';

        return res.json({
          ok: true,
          success: true,
          taskId,
          status,
          progress,
          videoUrl,
          error: errorMsg,
        });
      } catch {
        // Try next endpoint
      }
    }
  }

  return res.status(500).json({
    ok: false,
    success: false,
    error: '无法查询视频任务状态，请稍后重试',
  });
});

/**
 * POST /api/agent/run
 * Single Omni-Director Agent — 100% Real LLM Execution (Zero Mock Fallbacks).
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
请严格遵循当前动态挂载的【短剧 Skill 技能包】规则，结合用户上传的附件（剧本/设定图）与画布上下文，在无限画布上生成结构化的新节点。

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
    "1. Skill Check: 识别用户指令与挂载的短剧 Skill 规则",
    "2. 资产与轴线解析: 提取角色(@Image1)、场景(@Image2)特征并锁死 180° 拍摄轴线",
    "3. 节点与提示词编译: 生成对应画布节点并编译 Seedance 2.0/2.5 与 MiniMax H3 提示词"
  ],
  "agentReply": "导演Agent执行总结说明",
  "createdNodes": [
    {
      "type": "storyboard | script | character | scene_asset",
      "title": "节点主标题",
      "subtitle": "副标题",
      "sceneNumber": "EP01-SC01",
      "location": "场景地点",
      "timeOfDay": "时间",
      "hookPoint": "黄金前3秒爽点",
      "reversalPoint": "反转点",
      "scriptBody": "剧本正文",
      "roleType": "角色/资产定位",
      "consistencyPrompt": "跨镜头锁脸/锁载具/锁环境固定特征词 (中英双语)",
      "costumeDetails": "服化道或机械结构细节",
      "lightingMood": "光影基调",
      "shotNumber": "SHOT 01",
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
      ok: true,
      success: true,
      modelUsed: `${llmResult.usedProvider} · ${llmResult.usedModel}`,
      data: parsed,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      success: false,
      error: `Agent 模型调用失败：${err?.message || '请检查模型或网络连接'}`,
    });
  }
});

/**
 * POST /api/storyboard/render
 * Real LLM synthesis of upstream Character Consistency Anchors + Scene Anchors + Style/Director Presets
 * into MiniMax H3, Seedance 2.0, and Seedance 2.5 prompts (Zero Mock Fallbacks).
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
      systemInstruction: `你是专业 AI 视频导演与分镜提示词编译器（漫剧老李 + Seedance 2.0/2.5 + MiniMax H3）。请结合上游角色锁脸锚点与场景/载具锚点，为当前节点同时合成 MiniMax H3、Seedance 2.0、Seedance 2.5 三套标准视频提示词及一致性资产提示词。严格只返回合法的 JSON 对象。`,
      userPrompt: `节点标题：${node?.data?.title}
节点类型：${node?.type}
画幅比例：${node?.data?.aspectRatio || '9:16'}
景别：${node?.data?.shotSize || '特写 (CU)'}
运镜：${node?.data?.cameraMove || '[Push in]'}
焦段：${node?.data?.focalLength || '35mm f/1.4'}
视觉风格：${node?.data?.stylePresetName || '高对比电影感短剧'}
导演预设：${node?.data?.directorPresetName || '180°轴线与FACS微表情'}
当前提示词或内容：${
        node?.data?.visualPrompt ||
        node?.data?.consistencyPrompt ||
        node?.data?.scriptBody ||
        ''
      }
台词：${node?.data?.dialogueSnippet || ''}
上游角色/载具锚点：${combinedCharacterPrompt || '无'}
上游场景空间锚点：${combinedScenePrompt || '无'}

请返回如下 JSON 格式：
{
  "synthesizedPrompt": "融合角色、场景与风格的完整主提示词",
  "videoPrompts": {
    "minimax_h3": "[Push in, ...] Subject_Lock: (...) Position_Lock: (...) At 00:00.000 ... [Shot Cut] At 00:02.000 ...",
    "seedance_2_0": "[Subject (@Image1)] + [Action + FACS] + in [Environment (@Image2)] + Camera: [Move + Speed + Lock]; Lens: [Focal]; Stability: [Mode] + Style: [Lighting] + Avoid: [Constraints]",
    "seedance_2_5": "Refs: [@Image1, @Image2, @Audio1] | [站位声明: 180°轴线] | Shot 1 (0.0s-1.8s) [Hook]: ... -> Shot 2 (1.8s-3.5s) [Climax]: ... | Avoid: [崩脸, 越轴]"
  },
  "primaryHue": "#F59E0B",
  "secondaryHue": "#0F172A",
  "keyLightAngle": "主光源色温与角度描述",
  "silhouetteType": "single_closeup | two_person_ots | dramatic_eyes | action_dynamic",
  "cameraVectorLabel": "[Push in] · 35mm",
  "focalCaption": "已通过大模型实跑合成三套视频提示词与资产锁"
}`,
    });

    const parsed = extractJsonObject(llmResult.text);
    return res.json({
      ok: true,
      success: true,
      modelUsed: `${llmResult.usedProvider} · ${llmResult.usedModel}`,
      data: parsed,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      success: false,
      error: `提示词合成失败：${err?.message || '请稍后重试'}`,
    });
  }
});

/**
 * POST /api/skill/test
 * Real LLM sandbox endpoint for testing custom or video-model Drama Skills (Zero Mock Fallbacks).
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
      userPrompt: `测试输入上下文：\n${sampleInput}\n\n请严格按照你的 Skill 系统规则与视频提示词格式输出结构化短剧创作结果。`,
    });
    return res.json({
      ok: true,
      success: true,
      modelUsed: `${result.usedProvider} · ${result.usedModel}`,
      output: result.text || 'Skill 执行完成。',
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      success: false,
      error: `Skill 沙盒实跑失败：${err?.message || '请检查模型或输入内容'}`,
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
