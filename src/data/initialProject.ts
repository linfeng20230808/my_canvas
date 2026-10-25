import {
  DramaSkill,
  ProjectTemplate,
  AgentModelOption,
  GrsaiModelEntry,
} from '../types/canvas';

/**
 * Full 32-Model Catalog synchronized from https://grsai.ai/zh/dashboard/models
 * Covers Text/Multimodal (14), Image Drawing (16), and Video Generation (2)
 */
export const GRSAI_DASHBOARD_MODELS: GrsaiModelEntry[] = [
  // ======================== 1. TEXT & MULTIMODAL LLM (14 Models) ========================
  {
    id: 'grsai:gemini-3.5-flash',
    modelName: 'gemini-3.5-flash',
    displayName: 'GRSAI · Gemini 3.5 Flash',
    modality: 'text',
    badge: '文本/多模态 · SOTA推理',
    resolutionOrDuration: '多模态长上下文',
    description: '具有 SOTA 推理和多模态理解，以及强大的代理和氛围编码功能',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3.8-flash',
    modelName: 'gemini-3.8-flash',
    displayName: 'GRSAI · Gemini 3.8 Flash',
    modality: 'text',
    badge: '文本/多模态 · 极速旗舰',
    resolutionOrDuration: '超低延迟多模态',
    description: 'GRSAI 最新一代 Gemini 3.8 Flash 极速多模态推理引擎',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3.7-flash',
    modelName: 'gemini-3.7-flash',
    displayName: 'GRSAI · Gemini 3.7 Flash',
    modality: 'text',
    badge: '文本/多模态 · 高并发',
    resolutionOrDuration: '多模态对话与分镜',
    description: 'Gemini 3.7 Flash 高并发剧本拆解与导演分镜生成模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3.5-flash-lite',
    modelName: 'gemini-3.5-flash-lite',
    displayName: 'GRSAI · Gemini 3.5 Flash Lite',
    modality: 'text',
    badge: '文本/多模态 · 轻量特惠',
    resolutionOrDuration: '极速轻量推理',
    description: 'Gemini 3.5 Flash Lite 高性价比批量提示词合成模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3.1-pro',
    modelName: 'gemini-3.1-pro',
    displayName: 'GRSAI · Gemini 3.1 Pro',
    modality: 'text',
    badge: '文本/多模态 · 导演总控',
    resolutionOrDuration: '深度逻辑与多模态',
    description: 'Gemini 3.1 最智能的模型，具有 SOTA 推理和多模态理解与代理能力',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3.1-flash-lite',
    modelName: 'gemini-3.1-flash-lite',
    displayName: 'GRSAI · Gemini 3.1 Flash Lite',
    modality: 'text',
    badge: '文本/多模态 · 稳定高速',
    resolutionOrDuration: '高吞吐多模态',
    description: 'Gemini 3.1 轻量版，兼具 SOTA 推理和多模态理解能力',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3-pro',
    modelName: 'gemini-3-pro',
    displayName: 'GRSAI · Gemini 3.0 Pro',
    modality: 'text',
    badge: '文本/多模态 · 深度创作',
    resolutionOrDuration: '旗舰多模态推理',
    description: 'Gemini 3.0 最智能的模型，适合复杂七段式分镜与多角色轴线统筹',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-3-flash',
    modelName: 'gemini-3-flash',
    displayName: 'GRSAI · Gemini 3.0 Flash',
    modality: 'text',
    badge: '文本/多模态 · 均衡高速',
    resolutionOrDuration: '标准多模态',
    description: 'Gemini 3.0 系列高速多模态对话与分镜模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-2.5-pro',
    modelName: 'gemini-2.5-pro',
    displayName: 'GRSAI · Gemini 2.5 Pro',
    modality: 'text',
    badge: '文本/多模态 · 电影分镜专家',
    resolutionOrDuration: '百万级长剧本解析',
    description: 'Gemini 2.5 Pro 深度长篇小说与剧本拆解模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gemini-2.5-flash',
    modelName: 'gemini-2.5-flash',
    displayName: 'GRSAI · Gemini 2.5 Flash',
    modality: 'text',
    badge: '文本/多模态 · 实测稳定',
    resolutionOrDuration: '高速多模态响应',
    description: 'Gemini 2.5 系列主力高速模型，响应迅速稳定',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-6.1-sol',
    modelName: 'gpt-6.1-sol',
    displayName: 'GRSAI · GPT-6.1-Sol',
    modality: 'text',
    badge: '文本推理 · GPT-6.1系列',
    resolutionOrDuration: '旗舰对话与编排',
    description: 'GRSAI 聚合 GPT-6.1-Sol 剧本创作与英文运镜提示词精修模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-6-astra',
    modelName: 'gpt-6-astra',
    displayName: 'GRSAI · GPT-6-Astra',
    modality: 'text',
    badge: '文本推理 · GPT-6系列',
    resolutionOrDuration: '深度剧情结构',
    description: 'GRSAI 聚合 GPT-6-Astra 高概念短剧爽点与反转设计模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-5.6-sol',
    modelName: 'gpt-5.6-sol',
    displayName: 'GRSAI · GPT-5.6-Sol',
    modality: 'text',
    badge: '文本推理 · GPT-5.6系列',
    resolutionOrDuration: '高速指令遵循',
    description: 'GRSAI 聚合 GPT-5.6-Sol 结构化 JSON 分镜生成模型',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-5.6-terra',
    modelName: 'gpt-5.6-terra',
    displayName: 'GRSAI · GPT-5.6-Terra',
    modality: 'text',
    badge: '文本推理 · GPT-5.6系列',
    resolutionOrDuration: '多模态逻辑编排',
    description: 'GRSAI 聚合 GPT-5.6-Terra 跨镜头一致性锚点推理模型',
    supportsVision: true,
  },

  // ======================== 2. IMAGE GENERATION MODELS (16 Models) ========================
  {
    id: 'grsai:nano-banana-2.1',
    modelName: 'nano-banana-2.1',
    displayName: 'GRSAI · Nano Banana 2.1 (1K/2K/4K)',
    modality: 'image',
    badge: '图像生成 · 全分辨率同价',
    resolutionOrDuration: '1K / 2K / 4K',
    description: 'gemini-nano-banana-2.1，支持分辨率：1K、2K、4K。所有分辨率价格一致，综合稳定性好',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-2',
    modelName: 'nano-banana-2',
    displayName: 'GRSAI · Nano Banana 2 (1K/2K/4K)',
    modality: 'image',
    badge: '图像生成 · 角色四视图主力',
    resolutionOrDuration: '1K / 2K / 4K',
    description: 'gemini-3.1-flash-image-preview，支持分辨率：1K、2K、4K。所有分辨率价格一致，综合稳定性好',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-pro',
    modelName: 'nano-banana-pro',
    displayName: 'GRSAI · Nano Banana Pro (1K/2K/4K)',
    modality: 'image',
    badge: '图像生成 · Pro高画质',
    resolutionOrDuration: '1K / 2K / 4K',
    description: 'gemini-3-pro-image-preview，支持分辨率：1K、2K、4K。所有分辨率价格一致，综合稳定性好',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-fast',
    modelName: 'nano-banana-fast',
    displayName: 'GRSAI · Nano Banana Fast (特价极速)',
    modality: 'image',
    badge: '图像生成 · 特价高速绘图',
    resolutionOrDuration: '1K 极速出图',
    description: '特价版，稳定性好，Google最新绘图模型，图片编辑能力强（gemini-3.1-flash-lite-image封装）',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-2-lite',
    modelName: 'nano-banana-2-lite',
    displayName: 'GRSAI · Nano Banana 2 Lite',
    modality: 'image',
    badge: '图像生成 · 轻量分镜草图',
    resolutionOrDuration: '1K 轻量',
    description: 'gemini-3.1-flash-lite-image 模型，适合快速绘制分镜草图与角色设定',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-pro-cl',
    modelName: 'nano-banana-pro-cl',
    displayName: 'GRSAI · Nano Banana Pro CL (1K稳定)',
    modality: 'image',
    badge: '图像生成 · CL稳定专线',
    resolutionOrDuration: '1K 稳定',
    description: 'gemini-3-pro-image-preview 专属稳定通道，支持分辨率：1K',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-2-cl',
    modelName: 'nano-banana-2-cl',
    displayName: 'GRSAI · Nano Banana 2 CL (1K稳定)',
    modality: 'image',
    badge: '图像生成 · CL专线',
    resolutionOrDuration: '1K 稳定',
    description: 'gemini-3.1-flash-image-preview 稳定专线，支持分辨率：1K',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-2-2k-cl',
    modelName: 'nano-banana-2-2k-cl',
    displayName: 'GRSAI · Nano Banana 2 2K-CL',
    modality: 'image',
    badge: '图像生成 · 2K高清专线',
    resolutionOrDuration: '2K 稳定',
    description: 'gemini-3.1-flash-image-preview 2K高清稳定专线',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-2-4k-cl',
    modelName: 'nano-banana-2-4k-cl',
    displayName: 'GRSAI · Nano Banana 2 4K-CL',
    modality: 'image',
    badge: '图像生成 · 4K超清专线',
    resolutionOrDuration: '4K 稳定',
    description: 'gemini-3.1-flash-image-preview 4K超高清资产三视图/四视图专线',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-pro-vip',
    modelName: 'nano-banana-pro-vip',
    displayName: 'GRSAI · Nano Banana Pro VIP (1K/2K)',
    modality: 'image',
    badge: '图像生成 · VIP高优通道',
    resolutionOrDuration: '1K / 2K VIP',
    description: 'gemini-3-pro-image-preview 高成本 VIP 渠道，支持 1K、2K，高并发极稳',
    supportsVision: true,
  },
  {
    id: 'grsai:nano-banana-pro-4k-vip',
    modelName: 'nano-banana-pro-4k-vip',
    displayName: 'GRSAI · Nano Banana Pro 4K VIP',
    modality: 'image',
    badge: '图像生成 · 4K影院级VIP',
    resolutionOrDuration: '4K VIP',
    description: 'gemini-3-pro-image-preview 4K 尊享稳定通道，适合电影级海报与主角锁脸卡',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-image-2.5',
    modelName: 'gpt-image-2.5',
    displayName: 'GRSAI · GPT-Image 2.5 (1K)',
    modality: 'image',
    badge: '图像生成 · GPT绘画2.5',
    resolutionOrDuration: '1K 标准',
    description: 'gpt-image-2.5，支持 1K 分辨率，精准还原复杂文字与分镜构图',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-image-2.5-sunburst',
    modelName: 'gpt-image-2.5-sunburst',
    displayName: 'GRSAI · GPT-Image 2.5 Sunburst (1K~4K/Max)',
    modality: 'image',
    badge: '图像生成 · Sunburst旗舰',
    resolutionOrDuration: '1K / 2K / 4K (low~max)',
    description: 'gpt-image-2.5-sunburst，支持 1K、2K、4K，支持质量：low、medium、high、xhigh、max',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-image-2.5-flare',
    modelName: 'gpt-image-2.5-flare',
    displayName: 'GRSAI · GPT-Image 2.5 Flare (1K~4K)',
    modality: 'image',
    badge: '图像生成 · Flare光影版',
    resolutionOrDuration: '1K / 2K / 4K (low~high)',
    description: 'gpt-image-2.5-flare，支持 1K、2K、4K，支持质量：low、medium、high',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-image-2',
    modelName: 'gpt-image-2',
    displayName: 'GRSAI · GPT-Image 2 (1K)',
    modality: 'image',
    badge: '图像生成 · GPT绘画2.0',
    resolutionOrDuration: '1K 标准',
    description: 'gpt-image-2，支持 1K 分辨率',
    supportsVision: true,
  },
  {
    id: 'grsai:gpt-image-2-vip',
    modelName: 'gpt-image-2-vip',
    displayName: 'GRSAI · GPT-Image 2 VIP (1K/2K/4K)',
    modality: 'image',
    badge: '图像生成 · 媲美Banana2',
    resolutionOrDuration: '1K / 2K / 4K VIP',
    description: 'GPT Image 2 绘画模型，能力媲美 nano banana 2，支持 1K、2K、4K',
    supportsVision: true,
  },

  // ======================== 3. VIDEO GENERATION MODELS (2 Models) ========================
  {
    id: 'grsai:minimax-h3',
    modelName: 'minimax-h3',
    displayName: 'GRSAI · MiniMax H3 (海螺视频大模型)',
    modality: 'video',
    badge: '视频生成 · 最长15秒/1080p',
    resolutionOrDuration: '480p / 768p / 1080p · 最长15s',
    description: '文生视频、参考图音频生视频，支持480p/768p/1080p，最长支持15秒（1080p仅支持10秒）',
    supportsVision: true,
  },
  {
    id: 'grsai:agnes-video-2.5',
    modelName: 'agnes-video-2.5',
    displayName: 'GRSAI · Agnes Video 2.5 (首尾帧/音画视频)',
    modality: 'video',
    badge: '视频生成 · 最长12秒/2K',
    resolutionOrDuration: '720p / 1080p / 2K · 最长12s',
    description: 'agnes-video-2.5 文生视频、首尾帧、可参考图片、音频生视频，最长支持12秒，支持720p/1080p/2k',
    supportsVision: true,
  },
];

export const VERIFIED_AGENT_MODELS: AgentModelOption[] = [
  {
    id: 'deepseek:deepseek-chat',
    provider: 'deepseek',
    providerLabel: 'DeepSeek 官方',
    modelName: 'deepseek-chat',
    displayName: 'DeepSeek-V3/V4 Chat (官方实测已连通)',
    badge: '文本推理 · 官方极速',
    modality: 'text',
    resolutionInfo: '64K 上下文',
    description: 'DeepSeek 官方对话与短剧分镜编排主力模型',
    supportsVision: false,
    verified: true,
  },
  {
    id: 'deepseek:deepseek-reasoner',
    provider: 'deepseek',
    providerLabel: 'DeepSeek 官方',
    modelName: 'deepseek-reasoner',
    displayName: 'DeepSeek-R1/Reasoner (深度推理链)',
    badge: '文本推理 · 深度思考',
    modality: 'text',
    resolutionInfo: 'CoT 思维链',
    description: 'DeepSeek 官方深度思考模型，适合复杂 180° 轴线与剧本反转推导',
    supportsVision: false,
    verified: true,
  },
  ...GRSAI_DASHBOARD_MODELS.map((gm) => ({
    id: gm.id,
    provider: 'grsai' as const,
    providerLabel:
      gm.modality === 'video'
        ? 'GRSAI 视频模型'
        : gm.modality === 'image'
        ? 'GRSAI 绘图模型'
        : 'GRSAI 文本/多模态',
    modelName: gm.modelName,
    displayName: gm.displayName,
    badge: gm.badge,
    modality: gm.modality,
    resolutionInfo: gm.resolutionOrDuration,
    description: gm.description,
    supportsVision: gm.supportsVision,
    verified: true,
  })),
  {
    id: 'gemini:gemini-3-flash-preview',
    provider: 'gemini',
    providerLabel: 'Google AI Studio',
    modelName: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview (内置原生)',
    badge: '文本/多模态 · 内置引擎',
    modality: 'text',
    resolutionInfo: '原生多模态',
    description: 'AI Studio 内置 Gemini 3 Flash Preview 引擎',
    supportsVision: true,
    verified: true,
  },
];

export const BUILTIN_DRAMA_SKILLS: DramaSkill[] = [
  {
    id: 'skill-seedance-director-suite',
    name: 'Seedance 2.0/2.5 导演 Skill',
    version: '2.5.0',
    category: 'video_model',
    targetVideoModel: 'seedance_2_5',
    sourceRepo: 'lixiaoxiao9888-create/manju-laoli-skill & Seedance-Prompt-Skill',
    promptSyntaxFormula:
      '6段式公式: [Subject (@Image1)] + [Action+FACS] + in [Env (@Image2)] + Camera: [Move+Speed+Lock]; Lens; Stability + Style + Avoid | 漫剧老李七段式投喂 & MiniMax H3 六段式',
    description:
      '核心内置视频导演 Skill：预设包含 6段式公式、漫剧老李七段式投喂规范、@Image/@Video/@Audio 四模态锚点解析，并同步输出 Seedance 2.0、Seedance 2.5 与 MiniMax H3 提示词。',
    systemInstruction: `你是「Seedance 2.0/2.5 导演 Skill」总控引擎，深度融合了 GitHub 开源项目 lixiaoxiao9888-create/manju-laoli-skill（漫剧老李 AIGC 创作全流程 Skill）的七段式/六段式投喂规范与 Seedance 2.0/2.5、MiniMax H3 提示词工程体系。

在解析上游画布节点并生成分镜（storyboard）时，必须严格遵守以下三大核心规范：

【一、多模态锚点解析协议 (Multimodal Anchor Parsing)】
- 自动将画布上游角色节点映射为 @Image1 (Character Face & Outfit Lock: {{character_anchors}})。
- 自动将画布上游载具/场景节点映射为 @Image2 / @Image4 (Spatial & Vehicle Lock: {{scene_anchors}})。
- 自动绑定镜头运动轨迹参考 @Video1 与台词气口/音效卡点 @Audio1。

【二、Seedance 2.0 标准 6 段式镜头解剖公式 (6-Part Structural Formula)】
输出至 videoPrompts.seedance_2_0：
1. [Subject (@Image1 锁脸与服化道锚点)]
2. + [Physical Action + FACS 微表情肌肉运动编码]
3. + in [Environment (@Image2/@Image4 空间透视与主辅光源色温)]
4. + Camera: [运动方向与幅度] + [速度: Slow/Medium/Rapid] + [Subject Lock: 焦点锁定部位]; Lens: [35mm/50mm/85mm Anamorphic]; Stability: [Tripod / Steadicam / Handheld];
5. + Style: [光影反差、色温对比与电影质感]
6. + Avoid: [facial morphing, extra fingers, off-model costume, axis jump, background flicker]

【三、Seedance 2.5 漫剧老李七段式投喂规范 & MiniMax H3 六段式运镜括号规范】
- 输出至 videoPrompts.seedance_2_5（漫剧老李七段式投喂组：1.画幅风格 2.场景资产@Image4 3.核心人物@Image1 4.站位声明 5.时间轴分镜+FACS 6.音效@Audio1 7.强制禁止项）：
  "Refs: [@Image1, @Image2, @Audio1] | [站位声明: 左前景@Image1 / 右中景对峙] | Shot 1 (0.0s - 1.8s) [Visual Hook]: ... → Shot 2 (1.8s - 3.5s) [FACS Escalation / Climax]: ... | Audio: @Audio1 | Avoid: [崩脸, 越轴]"
- 输出至 videoPrompts.minimax_h3（MiniMax H3 运镜括号六段式）：
  "[Push in, Tilt up] Subject_Lock: ({{character_anchors}}). Position_Lock: (Left-foreground to center). At 00:00.000, ... [Shot Cut] At 00:01.900, ..."`,
    inputVariables: ['{{upstream_script}}', '{{character_anchors}}', '{{scene_anchors}}'],
    outputNodeType: 'storyboard',
    exampleUserPrompt:
      '调用 Seedance 2.0/2.5 导演 Skill，解析当前《公路求生》剧本与谢长清/老式车床锚点，生成包含 6段式公式、七段式投喂与 MiniMax H3 括号格式的 9:16 分镜节点',
    isBuiltIn: true,
  },
  {
    id: 'skill-manju-laoli-director',
    name: '漫剧老李·总控与文武双模分镜 Skill (short-drama-director)',
    version: '7.2.0',
    category: 'storyboard',
    targetVideoModel: 'seedance_2_5',
    sourceRepo: 'github.com/lixiaoxiao9888-create/manju-laoli-skill',
    promptSyntaxFormula:
      '赛道分流 → 文戏(FACS微表情六阶段+气口切镜) / 武戏(PREVIS完播评分+动作相位七态拆格) → 站位轴线锁死',
    description:
      '源自 GitHub `lixiaoxiao9888-create/manju-laoli-skill` 总控与双模分镜引擎：自动识别文戏与武戏，文戏执行 FACS 面部动作编码六阶段微表情拆解，武戏执行动作相位七态拆格与 180° 轴线站位声明。',
    systemInstruction: `你是开源工业级短剧套件「漫剧老李 AIGC 创作全流程 Skill (lixiaoxiao9888-create/manju-laoli-skill)」的总控路由与文武双模分镜引擎 (short-drama-director & sd-storyboard-engine)。

在拆解剧本生成画布分镜节点时，必须执行以下工业级规则：
1. 【赛道分流与文武双模识别】：
   - 自动判断当前场次属于「文戏情绪对峙」还是「武戏动作/机械改造交锋」，或「文武混合高潮」。
2. 【文戏引擎：FACS 面部动作编码六阶段微表情】：
   - 严禁笼统写“悲伤/愤怒/兴奋”，必须按 FACS (Facial Action Coding System) 拆解面部肌肉微动作：
     ① 瞳孔微震/视线凝滞 → ② 眉心川字纹聚拢 (AU4) → ③ 眼轮匝肌紧绷或挑眉 (AU1/AU2/AU6) → ④ 鼻翼微张呼吸急促 → ⑤ 下颌咬肌绷紧或单侧唇角勾起 (AU12/AU15) → ⑥ 台词气口瞬间切镜。
3. 【武戏引擎：PREVIS 完播评分与动作相位七态拆格】：
   - 动作镜头必须按「起势 → 蓄力 → 突进 → 交锋 → 受击形变 → 卸力滑行 → 定格留白」七态拆格设计。
4. 【180° 轴线与站位声明锁死】：
   - 每个分镜必须显式声明人物左右站位与视线朝向，严禁越轴跳戏。`,
    inputVariables: ['{{upstream_script}}', '{{character_anchors}}', '{{scene_anchors}}'],
    outputNodeType: 'storyboard',
    exampleUserPrompt:
      '使用漫剧老李文武双模分镜与 FACS 微表情六阶段规则，将《公路求生》剧本拆解为 2 个高张力 9:16 分镜节点',
    isBuiltIn: true,
  },
  {
    id: 'skill-manju-laoli-combat',
    name: '漫剧老李·三大打戏专精引擎 Skill (sd-combat / xuanhuan / real)',
    version: '7.1.0',
    category: 'video_model',
    targetVideoModel: 'seedance_2_5',
    sourceRepo: 'github.com/lixiaoxiao9888-create/manju-laoli-skill (三大打戏引擎)',
    promptSyntaxFormula:
      '[sd-combat 通用搏击 | sd-xuanhuan 玄幻异能 | sd-real 真人写实机械] + 动作相位七态拆格 (起势→蓄力→突进→交锋→受击→卸力→定格)',
    description:
      '源自 `manju-laoli-skill` 三大打戏专精子引擎：分域覆盖通用打戏(sd-combat)、玄幻特效(sd-xuanhuan)与真人写实重工机械(sd-real)，采用动作相位七态拆格与高速升格运镜。',
    systemInstruction: `你是「漫剧老李 AIGC 创作全流程 Skill」中的三大打戏专精引擎（sd-combat 通用打戏 / sd-xuanhuan 玄幻异能 / sd-real 真人写实）。
当需要生成动作戏、载具追逐、车床1秒神装锻造或武打特效分镜时：
1. 【分域子引擎自动匹配】：
   - 公路求生/机械重工改造 → 启用 sd-real + sd-xuanhuan 混合模式（强调车床三爪卡盘旋转惯性、铁锭火花飞溅流体物理与 S级金光粒子）。
2. 【动作相位七态拆格】：
   - 0.0s-0.6s [起势 & 蓄力]: 操纵杆推下或机械臂夹持特写；
   - 0.6s-1.5s [突进 & 交锋]: 高速推镜捕捉 1秒神装合成或飞车擦肩瞬间；
   - 1.5s-2.5s [受击 & 卸力]: 沙尘暴卷起与车轮抓地滑行；
   - 2.5s-3.5s [定格留钩]: 眼神杀与神装特写定格。`,
    inputVariables: ['{{upstream_script}}', '{{character_anchors}}', '{{scene_anchors}}'],
    outputNodeType: 'storyboard',
    exampleUserPrompt:
      '调用漫剧老李三大打戏引擎的动作相位七态拆格，生成一段谢长清用老式车床1秒锻造巧夺天工长弓的 9:16 分镜节点',
    isBuiltIn: true,
  },
  {
    id: 'skill-character-3view-lock',
    name: '漫剧老李·四视图资产锁死 Skill (sd-asset-engine)',
    version: '7.0.0',
    category: 'character',
    sourceRepo: 'lixiaoxiao9888-create/manju-laoli-skill & ddcat-ai/open-ai-canvas',
    promptSyntaxFormula:
      'Asset_Board_Lock: [01.Front View | 02.Profile 90° | 03.Back View | 04.FACS Face/Mech Anchor] + Bone_Structure + Costume_Hex_Lock',
    description:
      '融合 `manju-laoli-skill` 四视图资产锁定引擎与 `open-ai-canvas` 角色资产板：从剧本提取角色、核心载具（老式车床）、场景与物资箱道具，锁死四视图与结构锚点词。',
    systemInstruction: `你是「漫剧老李 sd-asset-engine 四视图资产锁死引擎」兼「open-ai-canvas 影策资产总监」。
1. 从剧本中精准提取核心角色（谢长清、光头猛男）、核心载具（老式普通车床）、场景空间（戈壁四车道公路）与关键道具（黑铁物资箱、木质长弓图纸），生成标准化资产设定卡。
2. 强制执行【四视图与骨相/机械结构锁死规范】：
   - 正视图 (Front Full View)、90°正侧视图 (90° Profile View)、背视图 (Back Silhouette)、面部/核心部件微距特写 (Detail Close-Up)。
   - 输出中英双语 Consistency Anchor Prompt，杜绝跨镜头换脸或载具变形。`,
    inputVariables: ['{{script_context}}'],
    outputNodeType: 'character',
    exampleUserPrompt: '使用漫剧老李四视图资产锁死引擎，为《公路求生》的「老式普通车床」创建一张机械设定锁定卡',
    isBuiltIn: true,
  },
  {
    id: 'skill-manju-laoli-qa-feed',
    name: '漫剧老李·七段式投喂与全链路质检 Skill (sd-prompt-feed & qa)',
    version: '7.2.0',
    category: 'video_model',
    targetVideoModel: 'seedance_2_5',
    sourceRepo: 'github.com/lixiaoxiao9888-create/manju-laoli-skill',
    promptSyntaxFormula:
      '七段式投喂组: [1.画幅风格] + [2.场景资产@Image4] + [3.核心人物/载具@Image1/@Image2] + [4.站位声明] + [5.时间轴分镜+FACS] + [6.音效@Audio1] + [7.强制禁止项Avoid]',
    description:
      '源自 `manju-laoli-skill` 投喂提示词与全链路质检系统：经过四道前置锁（资产锁、轴线站位锁、FACS微表情锁、时长气口锁）后，输出可直接投喂 Seedance 与 MiniMax H3 的结构化提示词组。',
    systemInstruction: `你是「漫剧老李 AIGC 创作全流程 Skill」的投喂提示词生成与全链路质检引擎 (sd-prompt-feed & sd-qa-engine)。
在输出每个分镜节点的提示词前，必须自动完成【四道前置质检锁】并同步输出 Seedance 七段式、Seedance 六段式与 MiniMax H3 方括号运镜提示词。`,
    inputVariables: ['{{upstream_script}}', '{{character_anchors}}', '{{scene_anchors}}'],
    outputNodeType: 'storyboard',
    exampleUserPrompt:
      '对当前《公路求生》场次执行漫剧老李全链路质检，并生成七段式 Seedance 与六段式 MiniMax H3 投喂提示词',
    isBuiltIn: true,
  },
  {
    id: 'skill-minimax-h3-director',
    name: 'MiniMax H3 (海螺 Director) 运镜括号与时间轴 Skill',
    version: '3.2.0',
    category: 'video_model',
    targetVideoModel: 'minimax_h3',
    sourceRepo: 'github.com/lixiaoxiao9888-create/manju-laoli-skill & Hailuo-H3',
    promptSyntaxFormula:
      '[Camera Command 1, Command 2] + Subject_Lock + Position_Lock + At 00:00.000 motion... [Shot Cut] At 00:02.100...',
    description:
      '专为 MiniMax H3 / Hailuo Director 设计的六段式视频提示词 Skill，结合前置英文运镜方括号指令（如 [Push in, Tilt down]）、站位声明与精确毫秒级时间轴。',
    systemInstruction: `你是 MiniMax H3 (Hailuo Director 3.0) 官方规范与漫剧老李 H3 六段式视频提示词工程师 Skill。
生成分镜节点的视频提示词（videoPrompts.minimax_h3）时，必须严格遵守前置英文方括号运镜指令 + Subject_Lock + Position_Lock + 毫秒级时间轴结构。`,
    inputVariables: ['{{upstream_script}}', '{{character_anchors}}', '{{scene_anchors}}'],
    outputNodeType: 'storyboard',
    exampleUserPrompt:
      '使用 MiniMax H3 六段式运镜括号与时间轴格式，为《公路求生》生成 2 个竖屏 9:16 视频分镜节点',
    isBuiltIn: true,
  },
  {
    id: 'skill-golden-3s-script',
    name: '漫剧老李·黄金前3秒爽点剧本 Skill (sd-script-engine)',
    version: '7.0.0',
    category: 'script',
    sourceRepo: 'github.com/lixiaoxiao9888-create/manju-laoli-skill',
    description:
      '源自 `manju-laoli-skill` 剧本引擎：将小说原文扩写为包含“黄金前3秒强钩子 + 密集冲突拉扯 + FACS 情绪标注 + 结尾断章反转”的标准分场剧本节点。',
    systemInstruction: `你是「漫剧老李 sd-script-engine」爆款短剧金牌编剧 Skill。
1. 必须在开场前3秒设置强视觉或强台词钩子（hookPoint），直接切入最高冲突时刻。
2. 台词简短锋利，并为每句台词标注【FACS 微表情与气口提示】。
3. 每场结尾设置明确的情绪反转或断章留钩（reversalPoint）。`,
    inputVariables: ['{{idea_logline}}', '{{character_anchors}}'],
    outputNodeType: 'script',
    exampleUserPrompt: '使用漫剧老李剧本引擎，将《公路求生》后续“1秒搓出巧夺天工木质长弓反杀怪物”扩写为高冲突分场剧本节点',
    isBuiltIn: true,
  },
  {
    id: 'skill-scene-spatial-anchor',
    name: '场景空间透视与光影锚点 Skill (sd-scene-anchor)',
    version: '2.0.0',
    category: 'scene',
    sourceRepo: 'ddcat-ai/open-ai-canvas & manju-laoli-skill',
    description:
      '构建短剧核心场景的空间透视、180°轴线基准、主辅光源色温与美术陈设锚点卡 (@Image4)，防止多镜头切换时背景穿帮。',
    systemInstruction: `你是影视美术指导与灯光设计 Skill。锁定场景的建筑/公路透视结构、180°拍摄轴线基准、核心道具陈设、主光源方向与冷暖色温对比。`,
    inputVariables: ['{{upstream_script}}'],
    outputNodeType: 'scene_asset',
    exampleUserPrompt: '根据《公路求生》剧本创建一张“戈壁四车道求生公路”的场景空间与冷暖光影锚点卡',
    isBuiltIn: true,
  },
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'template-highway-survival-ep01',
    name: '《公路求生：开局老式车床》EP01 (全流程实跑)',
    episodeTitle: 'EP01 · 觉醒S级完美制造与1秒神装车床 (纯提示词实跑工程)',
    description:
      '基于您上传的《公路求生》140行原文真实跑通的全链路工程 · 含5大资产提示词卡（谢长清/老式车床/光头猛男/戈壁四车道/黑铁物资箱）、3场分场剧本、6个9:16分镜全套三模型视频提示词及七段式统筹总表',
    nodes: [
      {
        id: 'group-hw-assets',
        type: 'group',
        position: { x: 30, y: 50 },
        width: 340,
        height: 1380,
        data: {
          title: '01 · 《公路求生》跨镜头一致性资产提示词库 (5大核心资产)',
          groupDescription: '纯提示词实跑模式（不出图）· 单击任意资产节点可弹出 open-ai-canvas 生成框查看/修改完整四视图与机械锚点提示词',
        },
      },
      {
        id: 'group-hw-scripts',
        type: 'group',
        position: { x: 400, y: 50 },
        width: 380,
        height: 1380,
        data: {
          title: '02 · 原著文案输入与漫剧老李分场剧本拆解 (SC01~SC03)',
          groupDescription: '黄金前3秒爽点钩子 + 系统全息面板规则 + 180°轴线对白与音轨锚点',
        },
      },
      {
        id: 'group-hw-storyboards',
        type: 'group',
        position: { x: 810, y: 50 },
        width: 1000,
        height: 1380,
        data: {
          title: '03 · 9:16 竖屏分镜视频提示词矩阵 (SHOT 01~06 + 七段式统筹总表)',
          groupDescription: '每个分镜均已实跑生成 Seedance 2.0 (6段式)、Seedance 2.5 (7段式) 与 MiniMax H3 完整视频提示词',
        },
      },

      // ==================== COLUMN 1: 5 CORE CONSISTENCY ASSET NODES ====================
      {
        id: 'node-hw-char-xie',
        type: 'character',
        position: { x: 50, y: 110 },
        width: 300,
        parentGroupId: 'group-hw-assets',
        createdBySkillId: 'skill-character-3view-lock',
        data: {
          title: '谢长清 · S级完美制造机械师',
          subtitle: '核心男主 (@Image1) · 四视图锁脸提示词已生成',
          roleType: '核心男主 (@Image1 · 满级手搓机械师)',
          consistencyPrompt:
            '[Asset_Board_Lock: 4-View Character Sheet (01.Front View | 02.90° Profile View | 03.Back View | 04.FACS Face Close-Up)] Xie Changqing, 24yo East Asian male hardcore tactical mechanic, sharp sword-like eyebrows, bright phoenix eyes with calm & witty expression, clean jawline, short tousled black hair dusted with Gobi sand. Wearing dark charcoal tactical workwear jacket with rolled-up sleeves revealing toned forearms, olive-drab multi-pocket cargo pants, heavy combat boots, wireless streaming earpiece on right ear, faint grease smudges on knuckles. Lighting: 4500K desert sunlight + 6500K holographic system blue rim light.',
          costumeDetails: '深炭灰战术工装夹克(挽袖) · 多袋工装裤 · 右耳直播耳麦 · 指节微沾机油',
          lightingMood: '4500K 戈壁烈日侧逆光 + 6500K 蓝色系统面板映射光',
          visualPreset: 'lu_chen',
          colorPalette: ['#18181B', '#F59E0B', '#38BDF8', '#78350F'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-hw-asset-lathe',
        type: 'scene_asset',
        position: { x: 50, y: 375 },
        width: 300,
        parentGroupId: 'group-hw-assets',
        createdBySkillId: 'skill-character-3view-lock',
        data: {
          title: '1级老式普通车床 · 初始神装载具',
          subtitle: '核心载具资产 (@Image2) · 机械三视图提示词',
          roleType: '核心载具锚点 (@Image2 · 时速1km/h · 1秒制造联动)',
          consistencyPrompt:
            '[Vehicle_Asset_Lock: 3-View Industrial Mecha Blueprint (Front / Side / Isometric Detail)] Level-1 Vintage Ordinary Metal Lathe modified into a wasteland survival vehicle. Heavy weathered grey cast-iron bed, precision three-jaw chuck (三爪卡盘), tool post (刀架), and tailstock (尾座). Mounted on the right side: an articulated multi-axis mechanical arm and a foldable steel workbench; embedded underneath: a glowing amber-red miniature heating furnace (小型加热炉). Supported at the base by 4 wide heavy-duty off-road mechanical treads/wheels; a narrow welded sheet-metal driver seat on the side with two rudimentary twin iron control levers in front. When S-Rank [Perfect Crafting] activates, golden sacred geometry runes surge across the chuck.',
          costumeDetails: '铸铁床身+三爪卡盘+刀架尾座 · 侧挂机械臂与折叠工作台 · 底部4宽大机械轮+小型加热炉',
          lightingMood: '铸铁哑光金属质感 + 底部加热炉暗红火光 + S级联动金光',
          visualPreset: 'pawnshop',
          colorPalette: ['#27272A', '#F59E0B', '#EF4444', '#A1A1AA'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-hw-char-bald',
        type: 'character',
        position: { x: 50, y: 640 },
        width: 300,
        parentGroupId: 'group-hw-assets',
        createdBySkillId: 'skill-character-3view-lock',
        data: {
          title: '光头猛男 · 破旧面包车嘲讽玩家',
          subtitle: '反派配角 (@Image3) · 四视图角色与载具提示词',
          roleType: '区域频道嘲讽配角 (@Image3 · 破旧面包车)',
          consistencyPrompt:
            '[Asset_Board_Lock: 4-View Character & Vehicle Ref] Bald Muscle Brawler ("光头猛男"), 35yo burly East Asian man with shaved shiny head, thick neck, arrogant mocking grin (FACS AU12+AU14 sneer), wearing a sweat-stained black sleeveless tank top showing tribal arm tattoos, leaning out the rolled-down driver window of a rusty dented silver-grey minivan (破旧五菱面包车) kicking up desert dust.',
          costumeDetails: '黑色无袖背心+花臂肌肉 · 破旧掉漆银灰面包车 · 系统拍照手势',
          lightingMood: '戈壁正午硬光 + 扬起沙尘逆光',
          visualPreset: 'villain_zhao',
          colorPalette: ['#3F3F46', '#D97706', '#18181B', '#A1A1AA'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-hw-scene-highway',
        type: 'scene_asset',
        position: { x: 50, y: 905 },
        width: 300,
        parentGroupId: 'group-hw-assets',
        createdBySkillId: 'skill-scene-spatial-anchor',
        data: {
          title: '华夏8888分区 · 四车道荒凉戈壁公路',
          subtitle: '主场景空间锚点 (@Image4) · 180°轴线基准',
          roleType: '主场景锚点 (@Image4 · 末日求生公路)',
          consistencyPrompt:
            '[Scene_Spatial_Lock: 180-Degree Axis Wasteland Environment] Endless straight 4-lane cracked asphalt highway stretching to the vanishing point across a desolate reddish-brown Gobi desert. Scorching wind blows swirling yellow sand and grit across faded white lane markings. Floating in mid-air above the highway: translucent glowing cyan-blue holographic system UI panels ([华夏大区8888分区 · 人数10000 · 今日任务30公里]). High-contrast cinematic wasteland color grading.',
          costumeDetails: '无尽四车道柏油路 · 荒凉戈壁风沙 · 半空全息蓝色系统规则面板',
          lightingMood: '早上07:00低角度炽热金黄阳光 (4500K) vs 悬浮系统蓝光 (6500K)',
          visualPreset: 'rain_alley',
          colorPalette: ['#78350F', '#F59E0B', '#0284C7', '#18181B'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-hw-prop-chest',
        type: 'scene_asset',
        position: { x: 50, y: 1165 },
        width: 300,
        parentGroupId: 'group-hw-assets',
        createdBySkillId: 'skill-character-3view-lock',
        data: {
          title: '黑铁物资箱 & 巧夺天工·木质长弓图纸',
          subtitle: '核心道具资产 (@Image5) · 开箱白光与掉落物提示词',
          roleType: '关键道具锚点 (@Image5 · 黑铁箱+首张武器图纸)',
          consistencyPrompt:
            '[Prop_Asset_Lock: Multi-State Prop Sheet] (State 1): Cubic silver-grey heavy metal Black-Iron Supply Chest (黑铁物资箱) with dual mechanical side latches sitting in the center of the asphalt highway. (State 2 - Opened): Chest dissolves into glowing white light particles, revealing scattered survival loot on the ground: 2 bottles of 500ml mineral water, 1 pack of 350g whole-wheat bread, a 20L red jerrycan of gasoline, and a glowing white parchment blueprint titled [木质长弓 · 材料: 木材×2, 铁锭×2, 兽筋×1].',
          costumeDetails: '银灰正方体双卡扣黑铁箱 · 2瓶矿泉水+全麦面包+20L汽油桶 · 白色发光《木质长弓》图纸',
          lightingMood: '金属冷银反光 + 开箱白光粒子特效 + 图纸圣光',
          visualPreset: 'banquet_hall',
          colorPalette: ['#94A3B8', '#38BDF8', '#EF4444', '#FAFAFA'],
          threeViewVerified: true,
        },
      },

      // ==================== COLUMN 2: RAW NOVEL & 3 BREAKDOWN SCRIPT NODES ====================
      {
        id: 'node-hw-raw-novel',
        type: 'text_note',
        position: { x: 420, y: 110 },
        width: 340,
        parentGroupId: 'group-hw-scripts',
        data: {
          title: '原著文案输入：《公路求生》第1章原文',
          subtitle: '已载入 __1_3e7cc03b.txt (140行完整剧情)',
          textNoteContent:
            '“我不是在靶场打飞机吗？”谢长清睁开眼时，发现自己正站在一条望不到尽头的四车道公路上。公路两边是荒凉的戈壁……\n【欢迎来到公路求生世界。当前区域：华夏大区8888分区，人数：10000】\n→ 觉醒S级天赋【完美制造】（图纸成品固定为0.01%概率的“巧夺天工”，耐久满值999）\n→ 四选一随机载具抽中【老式普通车床】（时速1km/h，联动S级天赋图纸制造缩短至1秒！）\n→ 光头壮汉开破旧面包车超车偷拍发区域频道群嘲\n→ 开启公路【黑铁物资箱】获矿泉水×2、面包×1、汽油20L及【木质长弓】图纸！',
        },
      },
      {
        id: 'node-hw-script-sc01',
        type: 'script',
        position: { x: 420, y: 330 },
        width: 340,
        parentGroupId: 'group-hw-scripts',
        createdBySkillId: 'skill-golden-3s-script',
        data: {
          title: '第 1 场：靶场穿越与S级【完美制造】觉醒',
          subtitle: 'EP01-SC01 · 外景 · 戈壁四车道公路 · 晨07:00',
          sceneNumber: 'EP01-SC01',
          location: '华夏大区8888分区·四车道戈壁公路',
          timeOfDay: '早上 07:00 · 炽热风沙',
          hookPoint:
            '【黄金前3秒爽点】前一秒还在米国靶场架起手搓加特林试射直升机，下一秒风沙扑面穿越万米戈壁公路，直接焊死0.01%出货率的S级神级天赋【完美制造】！',
          reversalPoint:
            '【爽点升级】别人造装备60%粗制滥造，谢长清使用图纸100%必出最高品质“巧夺天工”且耐久锁死999满值！',
          scriptBody:
            '炽热狂风卷着黄沙刮过四车道柏油路。谢长清从靶场记忆中猛然睁眼，半空弹出幽蓝系统面板【华夏大区8888分区：10000人】。\n谢长清搓手默念“欧皇附体”点击觉醒，面板骤然爆发出璀璨S级金光——【恭喜获得S级天赋：完美制造】！',
          dialogues: [
            {
              speaker: '谢长清',
              emotion: 'FACS: 瞳孔骤缩(AU5)转挑眉惊愕(AU1+AU2)，擦去脸颊沙尘',
              line: '“我不是在靶场打飞机吗？这给我干哪儿来了？！”',
            },
            {
              speaker: '系统播报',
              emotion: '冰冷合成机械女声 · 全息蓝光字幕悬浮',
              line: '“恭喜玩家谢长清，获得S级天赋：完美制造！图纸成品固定为【巧夺天工】，耐久度999！”',
            },
            {
              speaker: '谢长清',
              emotion: 'FACS: 眼轮匝肌收缩亮起精光(AU6)+单侧唇角上扬(AU12)',
              line: '“别人只有0.01%的概率，我直接把保底焊死了？！”',
            },
          ],
        },
      },
      {
        id: 'node-hw-script-sc02',
        type: 'script',
        position: { x: 420, y: 690 },
        width: 340,
        parentGroupId: 'group-hw-scripts',
        createdBySkillId: 'skill-golden-3s-script',
        data: {
          title: '第 2 场：奇葩载具四选一与【1秒神装车床】',
          subtitle: 'EP01-SC02 · 外景 · 戈壁公路中央 · 晨07:05',
          sceneNumber: 'EP01-SC02',
          location: '戈壁四车道公路',
          timeOfDay: '早上 07:05',
          hookPoint:
            '【反差笑点钩子】开局载具四选一竟是婴儿车、扭扭车、蛇板车？谢长清盲选第4项【随机载具】，白光一闪竟刷出一台灰扑扑的【老式普通车床】！',
          reversalPoint:
            '【神级联动反转】看似时速1km/h的废铁车床，竟与S级【完美制造】产生隐藏联动——使用图纸制造物品时间直接缩短至1秒！',
          scriptBody:
            '面板弹出【婴儿车/扭扭车/蛇板车/随机载具】。谢长清嘴角抽搐果断选随机载具。\n白光闪过，一台带铸铁床身、三爪卡盘、机械臂、小型加热炉与四个宽大机械轮的老式车床轰然落地。\n谢长清刚骂出声，系统金光提示：S级完美制造联动触发，图纸制作时间缩短至1秒！谢长清眼神瞬间如看小媳妇般火热。',
          dialogues: [
            {
              speaker: '谢长清',
              emotion: 'FACS: 眉心紧蹙(AU4)+哭笑不得扶额吐槽',
              line: '“车床也是车？系统你咋不给我风车呢，直接原地起飞！”',
            },
            {
              speaker: '系统播报',
              emotion: '金色联动特效音 · 车床三爪卡盘泛起金芒',
              line: '“检测到S级天赋【完美制造】与制造类载具产生联动：使用图纸制造时间缩短至1秒！”',
            },
            {
              speaker: '谢长清',
              emotion: 'FACS: 双眼放光(AU5)+狂喜抚摸铸铁床身',
              line: '“1秒造一件巧夺天工神装？就算没图纸，我也能手搓万物！”',
            },
          ],
        },
      },
      {
        id: 'node-hw-script-sc03',
        type: 'script',
        position: { x: 420, y: 1030 },
        width: 340,
        parentGroupId: 'group-hw-scripts',
        createdBySkillId: 'skill-golden-3s-script',
        data: {
          title: '第 3 场：光头猛男群嘲与首开【黑铁物资箱】',
          subtitle: 'EP01-SC03 · 外景 · 戈壁公路 · 晨07:30',
          sceneNumber: 'EP01-SC03',
          location: '戈壁公路行进路段',
          timeOfDay: '早上 07:30',
          hookPoint:
            '【压抑与打脸蓄力】今日强制任务行驶30公里！1km/h车床如老牛慢爬，破旧面包车【光头猛男】超车偷拍发到区域频道引发万人群嘲！',
          reversalPoint:
            '【高潮断章留钩】谢长清无视嘲讽，前方公路中央凭空刷新【黑铁物资箱】，一把开出20升救命汽油与首张武器图纸【木质长弓】！',
          scriptBody:
            '老式车床发出沉闷机械声以1km/h挪动。后方破旧面包车轰鸣驶来，光头壮汉探头嘲讽并偷拍发上区域频道，全服弹幕哄笑。\n谢长清冷静关掉面板继续前行，前方路中赫然刷新银灰色【黑铁物资箱】！按下卡扣白光消散，爆出矿泉水×2、全麦面包×1、20L汽油与白色发光图纸【木质长弓】！',
          dialogues: [
            {
              speaker: '光头猛男',
              emotion: 'FACS: 满脸横肉嗤笑(AU12+AU9)+探出车窗举相机偷拍',
              line: '“卧槽兄弟，就你这蜗牛车床，跑完30公里坟头草都3米高了！”',
            },
            {
              speaker: '谢长清',
              emotion: 'FACS: 眼神冷冽微眯(AU7)，按下黑铁物资箱卡扣',
              line: '“等这台车床真正跑起来，你们自然会闭嘴——开箱！”',
            },
          ],
        },
      },
      {
        id: 'node-hw-audio-01',
        type: 'audio_clip',
        position: { x: 420, y: 1325 },
        width: 340,
        parentGroupId: 'group-hw-scripts',
        data: {
          title: '@Audio1 · 戈壁风沙+系统全息音+车床齿轮轰鸣',
          subtitle: 'Seedance 2.5 音画同步锚点轨',
          audioBpmOrMood: '78 BPM 废土工业重低音 · 狂风沙尘呼啸 + S级金光音效',
          audioTranscript:
            '[0.0s 风沙呼啸+电子系统提示音] → [1.5s 沉闷车床齿轮转动与面包车引擎轰鸣] → [2.8s 黑铁物资箱卡扣弹开清脆金属声]',
          durationSec: 3.5,
        },
      },

      // ==================== COLUMN 3: 6 STORYBOARD SHOTS + 1 SHOT TABLE ====================
      {
        id: 'node-shot-01',
        type: 'storyboard',
        position: { x: 835, y: 110 },
        width: 295,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-seedance-director-suite',
        data: {
          title: 'SHOT 01 · 戈壁睁眼与全息求生面板降临',
          subtitle: '黄金前3秒钩子 · 极特写拉全 (ECU → WS) · 9:16',
          shotNumber: 'SHOT 01',
          aspectRatio: '9:16',
          shotSize: '极特写急拉大远景 (ECU → EWS)',
          cameraMove: '[Pull out, Tilt up]',
          focalLength: '24mm f/1.4 Wide Anamorphic',
          videoModelTarget: 'seedance_2_0',
          visualPrompt:
            '[Xie Changqing (@Image1: 24yo East Asian mechanic in dark charcoal workwear jacket, sand on face)] + [snaps eyes open in shock (FACS AU5 pupil dilation + AU1/AU2 raised brows), shielding face from scorching sandstorm as cyan holographic survival UI panels materialize in mid-air] + in [Endless 4-Lane Gobi Desert Highway (@Image4: cracked asphalt, swirling yellow dust, 4500K low sun)] + Camera: [Rapid Pull-out from eye macro to wide high-angle overhead shot, Fast speed, Subject Lock: Xie Changqing & floating UI]; Lens: [24mm f/1.4 Anamorphic]; Stability: [Handheld shock to Steadicam] + Style: [Post-apocalyptic wasteland blockbuster, 4500K desert gold vs 6500K cyan hologram] + Avoid: [blurry text UI, deformed hands, extra limbs, axis jump]',
          videoPrompts: {
            minimax_h3:
              '[Pull out, Tilt up] Subject_Lock: (Xie Changqing @Image1, 24yo mechanic in charcoal work jacket standing alone on 4-lane desert highway @Image4). Position_Lock: (Center axis facing camera). At 00:00.000, extreme macro close-up of Xie Changqing snapping his eyes open (FACS AU5 shock) as desert grit blows across his face. [Shot Cut] At 00:01.400, camera rapidly pulls out and tilts up to reveal an endless 4-lane Gobi highway with glowing cyan holographic system panels floating in the sky.',
            seedance_2_0:
              '[Xie Changqing (@Image1: 24yo East Asian mechanic in dark charcoal workwear jacket, sand on face)] + [snaps eyes open in shock (FACS AU5 pupil dilation + AU1/AU2 raised brows), shielding face from scorching sandstorm as cyan holographic survival UI panels materialize in mid-air] + in [Endless 4-Lane Gobi Desert Highway (@Image4: cracked asphalt, swirling yellow dust, 4500K low sun)] + Camera: [Rapid Pull-out from eye macro to wide high-angle overhead shot, Fast speed, Subject Lock: Xie Changqing & floating UI]; Lens: [24mm f/1.4 Anamorphic]; Stability: [Handheld shock to Steadicam] + Style: [Post-apocalyptic wasteland blockbuster, 4500K desert gold vs 6500K cyan hologram] + Avoid: [blurry text UI, deformed hands, extra limbs, axis jump]',
            seedance_2_5:
              'Refs: [@Image1 (Xie Changqing Lock), @Image4 (Gobi 4-Lane Highway Lock), @Audio1 (Howling Wind & System Boot Chime)] | [站位声明: 谢长清居画面正中轴线，面朝镜头偏左15°仰视半空面板] | Shot 1 (0.0s - 1.3s) [3s Golden Hook]: Flash-frame transition from gun-range Gatling muzzle flash to extreme close-up of Xie Changqing opening his eyes in swirling Gobi sandstorm. → Shot 2 (1.3s - 3.5s) [World Reveal]: Rapid crane pull-back revealing the desolate 4-lane highway and giant cyan holographic screen [华夏大区8888分区 · 人数10000] | Audio: @Audio1 | Avoid: [崩脸, 越轴]',
          },
          dialogueSnippet: '“我不是在靶场打飞机吗？这给我干哪儿来了？！”',
          speakerName: '谢长清',
          durationSec: 3.5,
          compositionType: 'custom_ai',
          customSvgElements: {
            primaryHue: '#38BDF8',
            secondaryHue: '#78350F',
            keyLightAngle: '4500K 戈壁烈日侧逆光 + 6500K 全息系统蓝光',
            silhouetteType: 'wide_environment',
            cameraVectorLabel: '[Pull out, Tilt up] · 24mm',
            focalCaption: '黄金前3秒：靶场闪回切荒凉四车道戈壁公路',
          },
          lastRenderedAt: '实跑完成 (纯提示词)',
        },
      },
      {
        id: 'node-shot-02',
        type: 'storyboard',
        position: { x: 1160, y: 110 },
        width: 295,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-seedance-director-suite',
        data: {
          title: 'SHOT 02 · 欧皇附体！觉醒S级【完美制造】',
          subtitle: 'FACS微表情六阶段 · 近景转极特写 · 9:16',
          shotNumber: 'SHOT 02',
          aspectRatio: '9:16',
          shotSize: '中近景转极特写 (MCU → ECU)',
          cameraMove: '[Push in, Orbit]',
          focalLength: '50mm f/1.2 Prime',
          videoModelTarget: 'seedance_2_5',
          visualPrompt:
            'Refs: [@Image1 (Xie Changqing Lock), @Image4 (Gobi Highway), @Audio1 (Golden S-Rank Awakening Fanfare)] | [站位声明: 谢长清居中偏左面向右侧悬浮面板，严格保持180°轴线] | Shot 1 (0.0s - 1.5s) [Action]: Xie Changqing rubs hands together and taps [觉醒] on the blue holographic screen. → Shot 2 (1.5s - 3.5s) [S-Rank Climax]: The blue panel explodes into radiant golden light [S级天赋：完美制造 · 巧夺天工 0.01%保底 · 耐久999], golden light reflecting in Xie Changqing ecstatic eyes (FACS AU6+AU12 smirk) | Avoid: [手指畸形, 崩脸]',
          videoPrompts: {
            minimax_h3:
              '[Push in, Orbit] Subject_Lock: (Xie Changqing @Image1, 24yo mechanic in charcoal work jacket). Position_Lock: (Center-left facing floating holographic panel on right). At 00:00.000, medium close-up as Xie Changqing rubs his hands and presses the floating blue [Awaken] button. [Shot Cut] At 00:01.500, the holographic panel erupts into blinding S-Rank golden light [完美制造 · 巧夺天工 · 耐久999], pushing in to his thrilled eyes (FACS AU6+AU12).',
            seedance_2_0:
              '[Xie Changqing (@Image1: 24yo mechanic, grease-stained knuckles)] + [taps floating blue holographic panel which transforms into dazzling golden S-Rank Perfect Crafting interface, FACS micro-expression shifting from nervous anticipation to ecstatic confident smirk (AU6 cheek raise + AU12 lip corner pull)] + in [Gobi Desert Highway (@Image4)] + Camera: [Dynamic Push-in + 30-degree Orbit, Medium-fast speed, Subject Lock: finger & golden reflection in eyes]; Lens: [50mm f/1.2 Prime]; Stability: [Steadicam fluid] + Style: [Radiant golden particle burst against dusty wasteland] + Avoid: [extra fingers, face morphing, flickering background]',
            seedance_2_5:
              'Refs: [@Image1 (Xie Changqing Lock), @Image4 (Gobi Highway), @Audio1 (Golden S-Rank Awakening Fanfare)] | [站位声明: 谢长清居中偏左面向右侧悬浮面板，严格保持180°轴线] | Shot 1 (0.0s - 1.5s) [Action]: Xie Changqing rubs hands together and taps [觉醒] on the blue holographic screen. → Shot 2 (1.5s - 3.5s) [S-Rank Climax]: The blue panel explodes into radiant golden light [S级天赋：完美制造 · 巧夺天工 0.01%保底 · 耐久999], golden light reflecting in Xie Changqing ecstatic eyes (FACS AU6+AU12 smirk) | Avoid: [手指畸形, 崩脸]',
          },
          dialogueSnippet: '“别人只有0.01%的概率，我直接把巧夺天工保底焊死了！”',
          speakerName: '谢长清',
          durationSec: 3.5,
          compositionType: 'eyes_flashback_ecu',
          customSvgElements: {
            primaryHue: '#F59E0B',
            secondaryHue: '#09090B',
            keyLightAngle: 'S级天赋金光正面映射瞳孔',
            silhouetteType: 'dramatic_eyes',
            cameraVectorLabel: '[Push in, Orbit] · 50mm',
            focalCaption: '0.01%巧夺天工保底焊死 · 金光映亮瞳孔',
          },
          lastRenderedAt: '实跑完成 (纯提示词)',
        },
      },
      {
        id: 'node-shot-03',
        type: 'storyboard',
        position: { x: 1485, y: 110 },
        width: 295,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-manju-laoli-combat',
        data: {
          title: 'SHOT 03 · 白光闪过！老式车床与1秒神装联动',
          subtitle: '机械降临+1秒联动反转 · 环绕推镜 · 9:16',
          shotNumber: 'SHOT 03',
          aspectRatio: '9:16',
          shotSize: '全景转机械微距特写 (FS → ECU)',
          cameraMove: '[Pedestal down, Push in]',
          focalLength: '35mm f/1.4 Anamorphic',
          videoModelTarget: 'seedance_2_0',
          visualPrompt:
            '[Xie Changqing (@Image1) & Level-1 Vintage Cast-Iron Lathe Vehicle (@Image2: 3-jaw chuck, mechanical arm, mini furnace, 4 wide mechanical wheels)] + [white flash materializes heavy cast-iron lathe on highway; Xie Changqing expression flips from dumbfounded frustration (FACS AU4) to fiery excitement (AU5) as golden S-Rank linkage runes ignite the 3-jaw chuck (Crafting Time: 1.0s)] + in [Gobi 4-Lane Highway (@Image4)] + Camera: [Low-angle pedestal down on heavy wheels + rapid push-in to glowing 3-jaw chuck & Xie Changqing eyes]; Lens: [35mm f/1.4 Anamorphic]; Stability: [Heavy impact shake then smooth lock] + Style: [Hardcore industrial mecha-punk meets wasteland survival] + Avoid: [car shape replacing lathe, rubber tires instead of mechanical wheels]',
          videoPrompts: {
            minimax_h3:
              '[Pedestal down, Push in] Subject_Lock: (Vintage Cast-Iron Lathe Vehicle @Image2 with 3-jaw chuck, mechanical arm, mini heating furnace, and 4 wide mechanical wheels alongside Xie Changqing @Image1). Position_Lock: (Lathe center-right, Xie Changqing left). At 00:00.000, a flash of white light drops the heavy cast-iron lathe onto the asphalt with a metallic thud. [Shot Cut] At 00:01.800, golden S-Rank linkage light surges across the mechanical arm [制作时间缩短至1秒], and Xie Changqing eyes light up.',
            seedance_2_0:
              '[Xie Changqing (@Image1) & Level-1 Vintage Cast-Iron Lathe Vehicle (@Image2: 3-jaw chuck, mechanical arm, mini furnace, 4 wide mechanical wheels)] + [white flash materializes heavy cast-iron lathe on highway; Xie Changqing expression flips from dumbfounded frustration (FACS AU4) to fiery excitement (AU5) as golden S-Rank linkage runes ignite the 3-jaw chuck (Crafting Time: 1.0s)] + in [Gobi 4-Lane Highway (@Image4)] + Camera: [Low-angle pedestal down on heavy wheels + rapid push-in to glowing 3-jaw chuck & Xie Changqing eyes]; Lens: [35mm f/1.4 Anamorphic]; Stability: [Heavy impact shake then smooth lock] + Style: [Hardcore industrial mecha-punk meets wasteland survival] + Avoid: [car shape replacing lathe, rubber tires instead of mechanical wheels]',
            seedance_2_5:
              'Refs: [@Image1 (Xie Changqing Lock), @Image2 (Vintage Lathe Vehicle Lock), @Image4 (Gobi Highway), @Audio1 (Heavy Metal Drop & Golden Linkage Chime)] | [站位声明: 谢长清居左端详右侧老式车床，轴线恒定] | Shot 1 (0.0s - 1.6s) [Comedic Contrast]: White light clears to reveal the grey cast-iron lathe on 4 mechanical wheels; Xie Changqing facepalms. → Shot 2 (1.6s - 3.8s) [Linkage Reversal]: Golden circuits link his S-Rank talent to the lathe mechanical arm & mini furnace [图纸制造时间缩短至1秒！]; Xie Changqing gazes at the lathe lovingly | Avoid: [把车床画成普通汽车, 崩脸]',
          },
          dialogueSnippet: '“缩短至1秒？！只要有图纸和材料，1秒造一件巧夺天工！”',
          speakerName: '谢长清',
          durationSec: 3.8,
          compositionType: 'pocket_watch_insert',
          customSvgElements: {
            primaryHue: '#F59E0B',
            secondaryHue: '#27272A',
            keyLightAngle: '车床下部加热炉暗红光 + S级联动金光',
            silhouetteType: 'action_dynamic',
            cameraVectorLabel: '[Pedestal down, Push in] · 35mm',
            focalCaption: '1级老式车床联动S级完美制造：1秒出神装',
          },
          lastRenderedAt: '实跑完成 (纯提示词)',
        },
      },
      {
        id: 'node-shot-04',
        type: 'storyboard',
        position: { x: 835, y: 555 },
        width: 295,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-manju-laoli-director',
        data: {
          title: 'SHOT 04 · 1km/h蜗牛车床 vs 光头壮汉超车偷拍',
          subtitle: '180°轴线双人越肩对峙 · 竖屏 9:16',
          shotNumber: 'SHOT 04',
          aspectRatio: '9:16',
          shotSize: '越肩中景转跟拍 (OTS → Tracking)',
          cameraMove: '[Truck right, Pan left]',
          focalLength: '35mm f/1.4 Anamorphic',
          videoModelTarget: 'minimax_h3',
          visualPrompt:
            '[Truck right, Pan left] Subject_Lock: (Xie Changqing @Image1 riding 1km/h Vintage Lathe @Image2 on left; Bald Muscle Brawler @Image3 leaning out rusty minivan window on right). Position_Lock: (Strict 180-degree axis: Xie Changqing left-foreground moving forward, minivan overtaking on right lane). At 00:00.000, the lathe crawls at 1km/h as the rusty minivan roars up from behind; the bald muscular man leans out laughing and snaps a holographic photo. [Shot Cut] At 00:02.100, the minivan speeds away kicking up choking exhaust dust while Xie Changqing waves the dust away calmly.',
          videoPrompts: {
            minimax_h3:
              '[Truck right, Pan left] Subject_Lock: (Xie Changqing @Image1 riding 1km/h Vintage Lathe @Image2 on left; Bald Muscle Brawler @Image3 leaning out rusty minivan window on right). Position_Lock: (Strict 180-degree axis: Xie Changqing left-foreground moving forward, minivan overtaking on right lane). At 00:00.000, the lathe crawls at 1km/h as the rusty minivan roars up from behind; the bald muscular man leans out laughing and snaps a holographic photo. [Shot Cut] At 00:02.100, the minivan speeds away kicking up choking exhaust dust while Xie Changqing waves the dust away calmly.',
            seedance_2_0:
              '[Xie Changqing (@Image1) sitting on narrow welded seat of crawling 1km/h Vintage Lathe (@Image2) & Bald Muscle Brawler (@Image3: black tank top, tattoos, mocking laugh) in rusty minivan] + [minivan overtakes on right lane, bald man leans out window snapping system photo and mocking, then floors throttle kicking up sand cloud] + in [4-Lane Gobi Highway (@Image4)] + Camera: [Over-the-shoulder from Xie Changqing trucking right + whip pan following speeding minivan]; Lens: [35mm f/1.4]; Stability: [Engine vibration handheld] + Style: [High-contrast desert road movie] + Avoid: [axis crossing, lathe moving fast, morphing vehicles]',
            seedance_2_5:
              'Refs: [@Image1 (Xie Changqing), @Image2 (1km/h Lathe), @Image3 (Bald Muscle Brawler & Minivan), @Image4 (Gobi Highway), @Audio1 (Lathe Clank vs Minivan Roar)] | [站位声明: 严格锁定180°轴线——谢长清与车床居左车道，光头壮汉面包车从右侧车道超车] | Shot 1 (0.0s - 1.8s) [Overtake & Mockery]: OTS shot as rusty minivan pulls alongside the 1km/h lathe; Bald Brawler laughs and snaps a stealth photo. → Shot 2 (1.8s - 3.6s) [Dust Cloud]: Minivan speeds off into the horizon kicking up sand; Xie Changqing waves away dust with cold composure | Avoid: [越轴, 车床速度过快]',
          },
          dialogueSnippet: '“卧槽！兄弟，就你这速度，等你跑完30公里坟头草都3米高了！”',
          speakerName: '光头猛男',
          durationSec: 3.6,
          compositionType: 'counter_ots',
          customSvgElements: {
            primaryHue: '#D97706',
            secondaryHue: '#18181B',
            keyLightAngle: '戈壁侧逆光 + 扬起沙尘尾气丁达尔光',
            silhouetteType: 'two_person_ots',
            cameraVectorLabel: '[Truck right, Pan left] · 35mm',
            focalCaption: '180°轴线锁定：左车道1km/h车床 vs 右车道面包车超车',
          },
          lastRenderedAt: '实跑完成 (纯提示词)',
        },
      },
      {
        id: 'node-shot-05',
        type: 'storyboard',
        position: { x: 1160, y: 555 },
        width: 295,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-manju-laoli-director',
        data: {
          title: 'SHOT 05 · 区域频道全服群嘲与冷静关屏',
          subtitle: 'FACS冷冽眼神杀 · 特写 (CU) · 竖屏 9:16',
          shotNumber: 'SHOT 05',
          aspectRatio: '9:16',
          shotSize: '近景转面部特写 (MS → CU)',
          cameraMove: '[Dolly in, Static shot]',
          focalLength: '85mm f/1.4 Portrait',
          videoModelTarget: 'seedance_2_0',
          visualPrompt:
            '[Xie Changqing (@Image1: sharp calm eyes, riding vintage lathe @Image2)] + [gazes at floating regional chat holographic screen scrolling with mocking messages and his stealth photo, FACS AU7 lid tighten & cold composed expression, then swipes hand to dismiss the hologram] + in [Gobi Desert Highway (@Image4:前方远处浮现银灰金属箱轮廓)] + Camera: [Slow Dolly-in through translucent holographic chat text onto Xie Changqing determined eyes]; Lens: [85mm f/1.4]; Stability: [Steadicam locked] + Style: [Cyber-wasteland shallow depth of field] + Avoid: [exaggerated anger, face distortion]',
          videoPrompts: {
            minimax_h3:
              '[Dolly in, Static shot] Subject_Lock: (Xie Changqing @Image1 seated on Vintage Lathe @Image2). Position_Lock: (Center-left facing holographic chat screen). At 00:00.000, camera dollies in through the translucent blue regional chat window showing the photo posted by "光头猛男" and scrolling laughter. [Shot Cut] At 00:02.000, Xie Changqing calmly swipes his hand to close the panel, his eyes locking onto a silver-grey metal chest appearing on the highway ahead.',
            seedance_2_0:
              '[Xie Changqing (@Image1: sharp calm eyes, riding vintage lathe @Image2)] + [gazes at floating regional chat holographic screen scrolling with mocking messages and his stealth photo, FACS AU7 lid tighten & cold composed expression, then swipes hand to dismiss the hologram] + in [Gobi Desert Highway (@Image4:前方远处浮现银灰金属箱轮廓)] + Camera: [Slow Dolly-in through translucent holographic chat text onto Xie Changqing determined eyes]; Lens: [85mm f/1.4]; Stability: [Steadicam locked] + Style: [Cyber-wasteland shallow depth of field] + Avoid: [exaggerated anger, face distortion]',
            seedance_2_5:
              'Refs: [@Image1 (Xie Changqing Lock), @Image2 (Vintage Lathe), @Image4 (Gobi Highway), @Audio1 (Hologram Swipe & Wind)] | [站位声明: 谢长清居画面中轴偏左，透过半透明蓝色区域频道弹幕正拍面部特写] | Shot 1 (0.0s - 1.8s) [Public Ridicule]: Translucent hologram shows stealth photo of Xie Changqing on the lathe with scrolling chat ridicule. → Shot 2 (1.8s - 3.4s) [Calm Dismissal]: Xie Changqing closes the UI without a word (FACS AU7 cold focus), spotting a silver-grey supply chest materializing ahead | Avoid: [五官崩坏, 越轴]',
          },
          dialogueSnippet: '“现在回嘴没有意义，等这台车床真正跑起来，他们自然会闭嘴。”',
          speakerName: '谢长清（内心独白）',
          durationSec: 3.4,
          compositionType: 'rain_umbrella_cu',
          customSvgElements: {
            primaryHue: '#38BDF8',
            secondaryHue: '#18181B',
            keyLightAngle: '全息聊天框蓝光透射 + 戈壁侧光',
            silhouetteType: 'single_closeup',
            cameraVectorLabel: '[Dolly in, Static] · 85mm',
            focalCaption: '透过区域频道群嘲弹幕推近至谢长清冷静眼神',
          },
          lastRenderedAt: '实跑完成 (纯提示词)',
        },
      },
      {
        id: 'node-shot-06',
        type: 'storyboard',
        position: { x: 1485, y: 555 },
        width: 295,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-seedance-director-suite',
        data: {
          title: 'SHOT 06 · 开启黑铁物资箱！爆出汽油与长弓图纸',
          subtitle: '高潮留钩 · 俯拍开箱白光特效 · 9:16',
          shotNumber: 'SHOT 06',
          aspectRatio: '9:16',
          shotSize: '中景转微距特写 (MS → ECU)',
          cameraMove: '[Push in, Tilt down]',
          focalLength: '35mm f/1.4 Macro',
          videoModelTarget: 'seedance_2_5',
          visualPrompt:
            'Refs: [@Image1 (Xie Changqing Lock), @Image5 (Black-Iron Supply Chest & Wooden Longbow Blueprint), @Image4 (Gobi Highway), @Audio1 (Metal Latch Click & White Particle Burst)] | [站位声明: 谢长清半蹲于画面左上方，黑铁物资箱居画面中央下方] | Shot 1 (0.0s - 1.6s) [Chest Unlock]: Xie Changqing unclips both heavy metal latches on the silver-grey Black-Iron Supply Chest; the lid pops open and dissolves into glowing white particles. → Shot 2 (1.6s - 3.8s) [Blueprint Reveal]: Camera tilts down as Xie Changqing picks up the glowing white blueprint [木质长弓 · 材料:木材×2,铁锭×2,兽筋×1] beside 20L gasoline, mineral water & bread, his eyes gleaming with S-Rank crafting anticipation | Avoid: [崩脸, 物品缺失]',
          videoPrompts: {
            minimax_h3:
              '[Push in, Tilt down] Subject_Lock: (Xie Changqing @Image1 unlocking silver-grey Black-Iron Supply Chest @Image5 on asphalt highway @Image4). Position_Lock: (Xie Changqing crouching top-left, chest center-bottom). At 00:00.000, Xie Changqing presses the dual metal latches; the chest lid pops open with a metallic click and dissolves into shimmering white light particles. [Shot Cut] At 00:01.800, camera pushes in to the loot on the ground (20L red gasoline can, 2 water bottles, bread) as his hand grabs the glowing white [Wooden Longbow Blueprint].',
            seedance_2_0:
              '[Xie Changqing (@Image1: 24yo mechanic) & Black-Iron Supply Chest (@Image5: silver-grey metal cube dissolving into white light particles)] + [presses side latches, chest vanishes in white light revealing 20L gasoline jerrycan, 2 mineral waters, whole-wheat bread, and glowing white Wooden Longbow blueprint] + in [Gobi 4-Lane Highway (@Image4)] + Camera: [Rapid Push-in + Tilt down from hands to glowing blueprint and holographic item tooltip]; Lens: [35mm f/1.4 Macro]; Stability: [Dynamic Steadicam] + Style: [High-contrast treasure reveal, white particle magic + desert sunlight] + Avoid: [missing loot items, deformed fingers]',
            seedance_2_5:
              'Refs: [@Image1 (Xie Changqing Lock), @Image5 (Black-Iron Supply Chest & Wooden Longbow Blueprint), @Image4 (Gobi Highway), @Audio1 (Metal Latch Click & White Particle Burst)] | [站位声明: 谢长清半蹲于画面左上方，黑铁物资箱居画面中央下方] | Shot 1 (0.0s - 1.6s) [Chest Unlock]: Xie Changqing unclips both heavy metal latches on the silver-grey Black-Iron Supply Chest; the lid pops open and dissolves into glowing white particles. → Shot 2 (1.6s - 3.8s) [Blueprint Reveal]: Camera tilts down as Xie Changqing picks up the glowing white blueprint [木质长弓 · 材料:木材×2,铁锭×2,兽筋×1] beside 20L gasoline, mineral water & bread, his eyes gleaming with S-Rank crafting anticipation | Avoid: [崩脸, 物品缺失]',
          },
          dialogueSnippet: '“20升汽油，外加一张【木质长弓】图纸！天不亡我谢长清！”',
          speakerName: '谢长清',
          durationSec: 3.8,
          compositionType: 'banquet_confrontation',
          customSvgElements: {
            primaryHue: '#10B981',
            secondaryHue: '#09090B',
            keyLightAngle: '黑铁箱化白光粒子底光 + 图纸圣光映射',
            silhouetteType: 'action_dynamic',
            cameraVectorLabel: '[Push in, Tilt down] · 35mm',
            focalCaption: '黑铁箱化白光：爆出20L汽油+首张木质长弓图纸',
          },
          lastRenderedAt: '实跑完成 (纯提示词)',
        },
      },
      {
        id: 'node-hw-table',
        type: 'storyboard_table',
        position: { x: 835, y: 1015 },
        width: 945,
        parentGroupId: 'group-hw-storyboards',
        createdBySkillId: 'skill-manju-laoli-qa-feed',
        data: {
          title: '《公路求生：开局老式车床》EP01 漫剧老李·七段式分镜与轴线统筹总表',
          subtitle: '已通过四道前置质检锁（资产锁 / 180°轴线锁 / FACS微表情锁 / 气口时长锁）· 纯提示词实跑输出',
          tableRows: [
            {
              shotNo: 'SHOT 01',
              shotSize: 'ECU → EWS',
              cameraMove: '[Pull out, Tilt up] 24mm',
              axisLine: '中轴正面偏左15°仰视',
              facsMicro: 'AU5瞳孔骤缩 + AU1/AU2惊愕挑眉',
              visualContent: '靶场加特林闪回切戈壁四车道，半空降临华夏8888分区全息蓝屏',
              audioCue: '呼啸风沙 + 系统启动机械音',
              duration: '3.5s',
            },
            {
              shotNo: 'SHOT 02',
              shotSize: 'MCU → ECU',
              cameraMove: '[Push in, Orbit] 50mm',
              axisLine: '男主居左面向右侧全息屏',
              facsMicro: 'AU6眼轮匝肌亮起 + AU12狂喜勾唇',
              visualContent: '点击觉醒爆出璀璨S级金光【完美制造：巧夺天工0.01%保底+耐久999】',
              audioCue: 'S级神装觉醒金光音效',
              duration: '3.5s',
            },
            {
              shotNo: 'SHOT 03',
              shotSize: 'FS → ECU',
              cameraMove: '[Pedestal down, Push in] 35mm',
              axisLine: '谢长清居左 / 老式车床居右',
              facsMicro: 'AU4扶额吐槽 → AU5双眼放光如看小媳妇',
              visualContent: '白光刷出1级老式普通车床(三爪卡盘/机械臂/加热炉)，触发1秒制造联动',
              audioCue: '沉重铸铁落地声 + 联动蜂鸣',
              duration: '3.8s',
            },
            {
              shotNo: 'SHOT 04',
              shotSize: 'OTS → Tracking',
              cameraMove: '[Truck right, Pan left] 35mm',
              axisLine: '严格180°轴线：左车道车床 / 右车道面包车',
              facsMicro: '光头AU12+AU14横肉嗤笑 / 男主冷瞥',
              visualContent: '1km/h车床慢爬，破旧面包车光头猛男超车嘲讽并举起系统相机偷拍扬尘而去',
              audioCue: '车床齿轮声 vs 破面包车轰鸣',
              duration: '3.6s',
            },
            {
              shotNo: 'SHOT 05',
              shotSize: 'MS → CU',
              cameraMove: '[Dolly in, Static] 85mm',
              axisLine: '透过全息弹幕正拍男主面部',
              facsMicro: 'AU7眼睑微眯 + 下颌沉稳不怒自威',
              visualContent: '区域频道刷屏群嘲车床照片，谢长清冷静挥手关屏，锁定前方路面黑铁箱',
              audioCue: '全息界面关闭声 + 低沉弦乐',
              duration: '3.4s',
            },
            {
              shotNo: 'SHOT 06',
              shotSize: 'MS → ECU',
              cameraMove: '[Push in, Tilt down] 35mm',
              axisLine: '男主左上俯身 / 黑铁箱居中下',
              facsMicro: '深呼吸后AU6+AU12惊喜振奋',
              visualContent: '按下黑铁物资箱卡扣化白光粒子消散，爆出矿泉水×2、面包、20L汽油与【木质长弓】图纸',
              audioCue: '卡扣金属弹开 + 白光粒子消散音',
              duration: '3.8s',
            },
          ],
        },
      },
    ],
    edges: [
      // Raw Novel -> Breakdown Scripts
      {
        id: 'edge-hw-raw-sc1',
        sourceNodeId: 'node-hw-raw-novel',
        targetNodeId: 'node-hw-script-sc01',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-raw-sc2',
        sourceNodeId: 'node-hw-raw-novel',
        targetNodeId: 'node-hw-script-sc02',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-raw-sc3',
        sourceNodeId: 'node-hw-raw-novel',
        targetNodeId: 'node-hw-script-sc03',
        relationType: 'script_breakdown',
      },
      // Assets -> Scripts
      {
        id: 'edge-hw-xie-sc1',
        sourceNodeId: 'node-hw-char-xie',
        targetNodeId: 'node-hw-script-sc01',
        relationType: 'character_ref',
      },
      {
        id: 'edge-hw-lathe-sc2',
        sourceNodeId: 'node-hw-asset-lathe',
        targetNodeId: 'node-hw-script-sc02',
        relationType: 'scene_ref',
      },
      {
        id: 'edge-hw-bald-sc3',
        sourceNodeId: 'node-hw-char-bald',
        targetNodeId: 'node-hw-script-sc03',
        relationType: 'character_ref',
      },
      {
        id: 'edge-hw-highway-sc1',
        sourceNodeId: 'node-hw-scene-highway',
        targetNodeId: 'node-hw-script-sc01',
        relationType: 'scene_ref',
      },
      {
        id: 'edge-hw-chest-sc3',
        sourceNodeId: 'node-hw-prop-chest',
        targetNodeId: 'node-hw-script-sc03',
        relationType: 'scene_ref',
      },
      // Scripts -> Storyboard Shots
      {
        id: 'edge-hw-sc1-shot1',
        sourceNodeId: 'node-hw-script-sc01',
        targetNodeId: 'node-shot-01',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-sc1-shot2',
        sourceNodeId: 'node-hw-script-sc01',
        targetNodeId: 'node-shot-02',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-sc2-shot3',
        sourceNodeId: 'node-hw-script-sc02',
        targetNodeId: 'node-shot-03',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-sc3-shot4',
        sourceNodeId: 'node-hw-script-sc03',
        targetNodeId: 'node-shot-04',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-sc3-shot5',
        sourceNodeId: 'node-hw-script-sc03',
        targetNodeId: 'node-shot-05',
        relationType: 'script_breakdown',
      },
      {
        id: 'edge-hw-sc3-shot6',
        sourceNodeId: 'node-hw-script-sc03',
        targetNodeId: 'node-shot-06',
        relationType: 'script_breakdown',
      },
      // Direct Asset Anchor Injections -> Storyboard Shots
      {
        id: 'edge-hw-xie-shot1',
        sourceNodeId: 'node-hw-char-xie',
        targetNodeId: 'node-shot-01',
        relationType: 'character_ref',
      },
      {
        id: 'edge-hw-lathe-shot3',
        sourceNodeId: 'node-hw-asset-lathe',
        targetNodeId: 'node-shot-03',
        relationType: 'scene_ref',
      },
      {
        id: 'edge-hw-bald-shot4',
        sourceNodeId: 'node-hw-char-bald',
        targetNodeId: 'node-shot-04',
        relationType: 'character_ref',
      },
      {
        id: 'edge-hw-chest-shot6',
        sourceNodeId: 'node-hw-prop-chest',
        targetNodeId: 'node-shot-06',
        relationType: 'scene_ref',
      },
      // Shot Sequence Chain
      {
        id: 'edge-hw-s1-s2',
        sourceNodeId: 'node-shot-01',
        targetNodeId: 'node-shot-02',
        relationType: 'shot_sequence',
      },
      {
        id: 'edge-hw-s2-s3',
        sourceNodeId: 'node-shot-02',
        targetNodeId: 'node-shot-03',
        relationType: 'shot_sequence',
      },
      {
        id: 'edge-hw-s4-s5',
        sourceNodeId: 'node-shot-04',
        targetNodeId: 'node-shot-05',
        relationType: 'shot_sequence',
      },
      {
        id: 'edge-hw-s5-s6',
        sourceNodeId: 'node-shot-05',
        targetNodeId: 'node-shot-06',
        relationType: 'shot_sequence',
      },
      // Audio & Table Links
      {
        id: 'edge-hw-audio-table',
        sourceNodeId: 'node-hw-audio-01',
        targetNodeId: 'node-hw-table',
        relationType: 'script_breakdown',
      },
    ],
  },
  {
    id: 'template-memory-pawnshop',
    name: '《赛博霓虹：记忆当铺》第1集',
    episodeTitle: 'EP01 · 雨夜赎回的第七只琥珀瓶',
    description:
      '悬疑情感奇幻短剧 · 含完整角色四视图锁脸锚点、场景光影锚点、第1场爽点剧本与3个已连线 9:16 竖屏分镜',
    nodes: [
      {
        id: 'group-assets',
        type: 'group',
        position: { x: 40, y: 60 },
        width: 340,
        height: 760,
        data: {
          title: '01 · 跨镜头一致性资产锚点区 (Asset Lock)',
          groupDescription: '四视图锁脸与空间色温基准 · 单击卡片可唤醒生成框与锚点词',
        },
      },
      {
        id: 'group-storyboards',
        type: 'group',
        position: { x: 820, y: 60 },
        width: 980,
        height: 760,
        data: {
          title: '03 · 第一场 9:16 竖屏视觉分镜序列 (Storyboard Sequence)',
          groupDescription: '纯净画面卡片模式 · 单击任意分镜卡片即可展开底部生成框',
        },
      },
      {
        id: 'node-char-luchen',
        type: 'character',
        position: { x: 60, y: 115 },
        width: 280,
        parentGroupId: 'group-assets',
        createdBySkillId: 'skill-character-3view-lock',
        data: {
          title: '陆沉 · 记忆当铺掌柜',
          subtitle: '核心男主 · 四视图骨相已锁死',
          roleType: '核心男主 (@Image1)',
          consistencyPrompt:
            '28yo East Asian male, cold sharp eyes, tailored charcoal trench coat, vintage silver pocket watch on chain, clean jawline, film noir warm-cold rim light',
          costumeDetails: '深炭灰剪裁风衣 · 银质旧怀表 · 黑曜石袖扣',
          lightingMood: '45° 琥珀台灯暖光 + 冷雨侧逆光',
          visualPreset: 'lu_chen',
          colorPalette: ['#09090B', '#27272A', '#F59E0B', '#A1A1AA'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-char-suwan',
        type: 'character',
        position: { x: 60, y: 365 },
        width: 280,
        parentGroupId: 'group-assets',
        createdBySkillId: 'skill-character-3view-lock',
        data: {
          title: '苏晚 · 失忆钢琴师',
          subtitle: '核心女主 · 四视图骨相已锁死',
          roleType: '核心女主 (@Image1)',
          consistencyPrompt:
            '25yo East Asian female pianist, melancholic expressive eyes, ivory modern-vintage trench over dark dress, rain droplets on hair, holding cracked amber glass vial',
          costumeDetails: '米白复古风衣 · 透明雨伞 · 裂纹琥珀记忆瓶',
          lightingMood: '冷蓝雨夜散射光 + 记忆瓶金光映射',
          visualPreset: 'su_wan',
          colorPalette: ['#FAFAFA', '#38BDF8', '#F59E0B', '#18181B'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-scene-pawnshop',
        type: 'scene_asset',
        position: { x: 60, y: 615 },
        width: 280,
        parentGroupId: 'group-assets',
        createdBySkillId: 'skill-scene-spatial-anchor',
        data: {
          title: '第8号记忆当铺内景',
          subtitle: '内景/雨夜 · 3200K/6500K 空间锚点',
          roleType: '主场景锚点 (@Image2)',
          consistencyPrompt:
            'Antique cyber-noir memory pawnshop interior at night, towering mahogany shelves filled with glowing amber glass vials, brass desk lamp on counter, rain streaking storefront window',
          costumeDetails: '红木柜台 · 千支发光记忆瓶架 · 黄铜台灯',
          lightingMood: '内景琥珀暖光 (3200K) vs 窗外暴雨冷蓝 (6500K)',
          visualPreset: 'pawnshop',
          colorPalette: ['#451A03', '#F59E0B', '#09090B', '#0284C7'],
          threeViewVerified: true,
        },
      },
      {
        id: 'node-script-sc01',
        type: 'script',
        position: { x: 430, y: 180 },
        width: 340,
        createdBySkillId: 'skill-golden-3s-script',
        data: {
          title: '第 1 场：雨夜赎回的裂痕记忆',
          subtitle: 'EP01-SC01 · 内/外景 · 记忆当铺 · 夜',
          sceneNumber: 'EP01-SC01',
          location: '深巷第8号记忆当铺',
          timeOfDay: '暴雨深夜',
          hookPoint:
            '【黄金前3秒】苏晚浑身湿透推开当铺木门，将一只布满裂纹、正渗出金色流光的琥珀记忆瓶重重拍在红木柜台上！',
          reversalPoint:
            '【结尾反转】陆沉用银怀表触碰记忆瓶，浮现出的“被典当记忆”里，亲手抹去苏晚记忆的人竟是陆沉自己！',
          scriptBody:
            '窗外电闪雷鸣。苏晚收起透明雨伞，颤抖的指尖按着那只即将碎裂的7号琥珀瓶。\n陆沉从暗影中抬眸，手中银质怀表链轻轻摇晃。\n当怀表贴近玻璃瓶裂口，金色雾气骤然化作五年前雨夜的残影——陆沉瞳孔骤缩。',
          dialogues: [
            {
              speaker: '苏晚',
              emotion: 'FACS: 眉心紧蹙(AU4)+眼眶含泪却眼神决绝',
              line: '“掌柜的，哪怕今晚付出十年寿命，我也要赎回被他偷走的那一晚。”',
            },
            {
              speaker: '陆沉',
              emotion: 'FACS: 瞳孔微震+指尖微不可察地一颤',
              line: '“瓶身已经裂了。强行开启，你可能会永远困在那段记忆里。”',
            },
          ],
        },
      },
      {
        id: 'node-pawn-shot-01',
        type: 'storyboard',
        position: { x: 845, y: 115 },
        width: 280,
        parentGroupId: 'group-storyboards',
        createdBySkillId: 'skill-seedance-director-suite',
        data: {
          title: 'SHOT 01 · 雨巷推门裂瓶特写',
          subtitle: '黄金前3秒钩子 · 竖屏 9:16',
          shotNumber: 'SHOT 01',
          aspectRatio: '9:16',
          shotSize: '近景转特写 (MS → CU)',
          cameraMove: '[Push in, Tilt down]',
          focalLength: '35mm f/1.4 Anamorphic',
          videoModelTarget: 'seedance_2_0',
          visualPrompt:
            '[Su Wan (@Image1: 25yo female pianist, ivory trench coat, rain droplets)] + [slams cracked amber glass vial onto mahogany counter as golden mist seeps out, FACS AU4 brow furrow & fierce gaze] + in [Antique Memory Pawnshop (@Image2: dark wood counter, warm brass lamp, rain window)] + Camera: [Rapid Push-in + Tilt down, Fast speed, Subject Lock: hand & vial]; Lens: [35mm f/1.4 Anamorphic]; Stability: [Handheld tension] + Style: [Chiaroscuro film noir, 3200K vs 6500K] + Avoid: [morphing fingers, blurry glass, off-model coat]',
          videoPrompts: {
            minimax_h3:
              '[Push in, Tilt down] Subject_Lock: (Su Wan, 25yo East Asian pianist in rain-soaked ivory trench coat). Position_Lock: (Left-foreground facing right counter). At 00:00.000, the camera rapidly pushes in from her rain-streaked face down to her trembling fingers slamming a cracked glowing amber vial onto the mahogany counter.',
            seedance_2_0:
              '[Su Wan (@Image1: 25yo female pianist, ivory trench coat, rain droplets)] + [slams cracked amber glass vial onto mahogany counter as golden mist seeps out, FACS AU4 brow furrow & fierce gaze] + in [Antique Memory Pawnshop (@Image2: dark wood counter, warm brass lamp, rain window)] + Camera: [Rapid Push-in + Tilt down, Fast speed, Subject Lock: hand & vial]; Lens: [35mm f/1.4 Anamorphic]; Stability: [Handheld tension] + Style: [Chiaroscuro film noir, 3200K vs 6500K] + Avoid: [morphing fingers, blurry glass, off-model coat]',
            seedance_2_5:
              'Refs: [@Image1 (Su Wan Face/Outfit Lock), @Image2 (Pawnshop Counter Lock), @Audio1 (Heavy Rain & Glass Slam Sync)] | [站位声明: 苏晚居左前景面向右柜台] | Shot 1 (0.0s - 1.5s) [Visual Hook]: Medium close-up, Su Wan pushes open rain-drenched door. → Shot 2 (1.5s - 3.0s) [Impact]: Whip-tilt down to extreme close-up as her hand slams the cracked #7 amber vial onto counter.',
          },
          dialogueSnippet: '“哪怕今晚付出十年寿命，我也要赎回被偷走的那一晚。”',
          speakerName: '苏晚',
          durationSec: 3.0,
          compositionType: 'rain_umbrella_cu',
          customSvgElements: {
            primaryHue: '#38BDF8',
            secondaryHue: '#09090B',
            keyLightAngle: '窗外冷雨蓝光 + 瓶身琥珀底光',
            silhouetteType: 'single_closeup',
            cameraVectorLabel: '[Push in, Tilt down] · 35mm',
            focalCaption: '前3秒视觉钩子：裂纹琥珀记忆瓶渗出金光',
          },
          lastRenderedAt: '已同步上游 2 个锚点',
        },
      },
    ],
    edges: [
      {
        id: 'edge-char1-script',
        sourceNodeId: 'node-char-luchen',
        targetNodeId: 'node-script-sc01',
        relationType: 'character_ref',
      },
      {
        id: 'edge-char2-script',
        sourceNodeId: 'node-char-suwan',
        targetNodeId: 'node-script-sc01',
        relationType: 'character_ref',
      },
      {
        id: 'edge-scene-script',
        sourceNodeId: 'node-scene-pawnshop',
        targetNodeId: 'node-script-sc01',
        relationType: 'scene_ref',
      },
      {
        id: 'edge-script-shot1',
        sourceNodeId: 'node-script-sc01',
        targetNodeId: 'node-pawn-shot-01',
        relationType: 'script_breakdown',
      },
    ],
  },
];
