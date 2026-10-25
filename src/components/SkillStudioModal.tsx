import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Play,
  Save,
  Trash2,
  Copy,
  CheckCircle2,
  Terminal,
  Wand2,
  Layers,
} from 'lucide-react';
import {
  DramaSkill,
  SkillCategory,
  NodeCategory,
  VideoModelTarget,
} from '../types/canvas';

interface SkillStudioModalProps {
  isOpen: boolean;
  skills: DramaSkill[];
  initialSelectedSkillId?: string;
  mountedSkillIds: string[];
  selectedModelId: string;
  darkMode: boolean;
  onClose: () => void;
  onSaveSkill: (skill: DramaSkill, autoMount?: boolean) => void;
  onDeleteSkill: (skillId: string) => void;
  onToggleMountSkill: (skillId: string) => void;
}

const RULE_SNIPPET_PRESETS = [
  {
    label: '+ 6段式公式 (Seedance 2.0)',
    formula:
      '[Subject (@Image1)] + [Action+FACS] + in [Env (@Image2)] + Camera: [Move+Speed+Lock]; Lens; Stability + Style + Avoid',
    snippet: `【Seedance 2.0 6段式结构化公式规则】
必须严格按以下6段式输出：
[Subject (Character Anchor @Image1)] + [Specific Action & FACS Micro-Expression] + in [Environment & Atmosphere (@Image2)] + Camera: [Movement + Speed + Subject Lock]; Lens: [Focal Length + Depth of Field]; Stability: [Steadicam/Handheld] + Style: [Lighting & Color Grade] + Avoid: [Negative Constraints]`,
  },
  {
    label: '+ 漫剧老李 七段式投喂组 (Seedance 2.5)',
    formula:
      'Refs: [@Image1, @Image2, @Audio1] | [站位声明] | Shot 1 → Shot 2 (FACS) | Audio | Avoid',
    snippet: `【漫剧老李 (manju-laoli-skill) 七段式投喂提示词规范】
1. 画幅与视觉风格基准 (9:16 竖屏电影感)
2. 场景空间资产锁定 (@Image2 主辅光源色温与透视)
3. 核心人物四视图锁定 (@Image1 骨相与服化道锚点)
4. 180° 轴线与左右站位声明 (防止多镜头越轴)
5. 时间轴分镜与 FACS 微表情六阶段 / 动作七态拆格
6. 台词气口与音效卡点 (@Audio1)
7. 强制禁止项 (Avoid: 崩脸、多指、越轴、背景闪烁)`,
  },
  {
    label: '+ 漫剧老李 FACS 微表情六阶段 & 动作七态',
    formula:
      '文戏: FACS(AU4眉心/AU6眼轮匝肌/瞳孔微震/气口切镜) | 武戏: 起势→蓄力→突进→交锋→受击→卸力→定格',
    snippet: `【漫剧老李 文武双模核心规则】
- 文戏微表情 (FACS 六阶段)：①瞳孔凝滞 → ②眉心聚拢(AU4) → ③眼轮匝肌紧绷(AU6) → ④呼吸气口 → ⑤下颌/唇角微动 → ⑥台词尾音切镜。
- 武戏/冲突动作 (七态相位拆格)：按「起势 → 蓄力 → 突进 → 交锋(Hit-stop) → 受击形变 → 卸力滑行 → 定格留钩」逐秒标注。`,
  },
  {
    label: '+ MiniMax H3 运镜括号六段式',
    formula:
      '[Push in, Tilt down] + Subject_Lock + Position_Lock + At 00:00.000 ... [Shot Cut] At 00:01.800 ...',
    snippet: `【MiniMax H3 (海螺 Director) 六段式运镜括号规范】
1. 标准英文方括号运镜指令前置：[Push in], [Pull out], [Pan left], [Pan right], [Tilt up], [Tilt down], [Truck left], [Truck right], [Orbit], [Tracking shot], [Static shot]。
2. Subject_Lock + Position_Lock + 毫秒级时间轴：At 00:00.000 ... [Shot Cut] At 00:01.800 ...`,
  },
];

export const SkillStudioModal: React.FC<SkillStudioModalProps> = ({
  isOpen,
  skills,
  initialSelectedSkillId,
  mountedSkillIds,
  selectedModelId,
  darkMode,
  onClose,
  onSaveSkill,
  onDeleteSkill,
  onToggleMountSkill,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedSkillId && initialSelectedSkillId !== 'new'
      ? initialSelectedSkillId
      : skills[0]?.id || ''
  );

  const [formState, setFormState] = useState<DramaSkill>({
    id: '',
    name: '',
    version: '1.0.0',
    category: 'video_model',
    sourceRepo: 'Custom Studio Skill',
    targetVideoModel: 'seedance_2_0',
    promptSyntaxFormula: '',
    description: '',
    systemInstruction: '',
    inputVariables: ['{{upstream_script}}', '{{character_anchors}}', '{{scene_anchors}}'],
    outputNodeType: 'storyboard',
    exampleUserPrompt: '',
    isBuiltIn: false,
  });

  const [sandboxInput, setSandboxInput] = useState(
    '场景：记忆当铺雨夜内景 (@Image2)。苏晚 (@Image1) 将布满裂纹的7号琥珀瓶重重拍在红木柜台上，要求赎回五年前被抹去的记忆；男主陆沉认出那是自己亲手封印的记忆瓶 (@Audio1 台词重音)。'
  );
  const [sandboxTargetFormat, setSandboxTargetFormat] = useState<
    'all' | 'seedance_2_0' | 'seedance_2_5' | 'minimax_h3'
  >('all');
  const [sandboxOutput, setSandboxOutput] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialSelectedSkillId === 'new') {
      handleCreateNew();
    } else if (initialSelectedSkillId) {
      const found = skills.find((s) => s.id === initialSelectedSkillId);
      if (found) {
        setSelectedId(found.id);
        setFormState({ ...found });
      }
    } else if (skills.length > 0) {
      const current = skills.find((s) => s.id === selectedId) || skills[0];
      setSelectedId(current.id);
      setFormState({ ...current });
    }
  }, [isOpen, initialSelectedSkillId, skills]);

  if (!isOpen) return null;

  const handleSelectSkill = (skill: DramaSkill) => {
    setSelectedId(skill.id);
    setFormState({ ...skill });
    setSandboxOutput('');
    setSaveMessage(null);
  };

  const handleCreateNew = () => {
    const newSkill: DramaSkill = {
      id: `skill-custom-${Date.now()}`,
      name: '自定义 Seedance 2.0/2.5 竖屏高潮运镜 Skill',
      version: '1.0.0',
      category: 'video_model',
      targetVideoModel: 'seedance_2_0',
      sourceRepo: 'User Custom Studio',
      promptSyntaxFormula:
        '[Subject (@Image1)] + [Action] + in [Env (@Image2)] + Camera: [Move+Speed+Lock]; Lens; Stability + Style + Avoid',
      description:
        '自定义 6段式公式 + 多模态锚点 (@Image1/@Image2/@Audio1) + MiniMax H3 运镜括号联合输出规则。',
      systemInstruction: `你是自定义短剧导演与多模型视频提示词生成 Skill。
1. 【6段式结构化公式 (Seedance 2.0)】：
   [Subject (Character Anchor @Image1)] + [Specific Action & Micro-Expression] + in [Environment & Atmosphere (@Image2)] + Camera: [Movement + Speed + Subject Lock]; Lens: [Focal Length + Depth of Field]; Stability: [Steadicam/Handheld] + Style: [Lighting & Color Grade] + Avoid: [Negative Constraints]
2. 【四模态时间轴 (Seedance 2.5)】：
   Refs: [@Image1 (角色锁脸), @Image2 (场景空间锚点), @Audio1 (台词情绪重音)] | Shot 1 (0.0s - 1.5s) [Hook]: ... → Shot 2 (1.5s - 3.5s) [Climax]: ...
3. 【运镜括号指令 (MiniMax H3)】：
   [Push in, Tilt up] Subject_Lock: ({{character_anchors}}). At 00:00.000 ... [Shot Cut] At 00:01.800 ...`,
      inputVariables: [
        '{{upstream_script}}',
        '{{character_anchors}}',
        '{{scene_anchors}}',
      ],
      outputNodeType: 'storyboard',
      exampleUserPrompt:
        '使用 6段式公式与 @Image1/@Image2 多模态锚点，将当前质问台词转化为竖屏 9:16 分镜节点',
      isBuiltIn: false,
    };
    setSelectedId(newSkill.id);
    setFormState(newSkill);
    setSandboxOutput('');
    setSaveMessage('已初始化自定义短剧 Skill 模板，可直接修改规则并运行沙盒调试');
  };

  const handleDuplicateSkill = () => {
    const dup: DramaSkill = {
      ...formState,
      id: `skill-custom-${Date.now()}`,
      name: `${formState.name} (自定义调试副本)`,
      sourceRepo: 'User Custom Studio',
      isBuiltIn: false,
    };
    onSaveSkill(dup, true);
    setSelectedId(dup.id);
    setFormState(dup);
    setSaveMessage('已复制为自定义 Skill 并自动挂载至全能导演 Agent');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.systemInstruction.trim()) return;
    onSaveSkill(formState, true);
    setSaveMessage('Skill 提示词规则已保存并同步挂载至全能导演 Agent');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleRunSandboxTest = async () => {
    setIsTesting(true);
    setSandboxOutput('');
    const formatDirective =
      sandboxTargetFormat === 'seedance_2_0'
        ? '\n【本次调试重点】：请严格按照 Seedance 2.0 6段式公式与 @Image1/@Image2 锚点输出提示词并检验每个槽位。'
        : sandboxTargetFormat === 'seedance_2_5'
        ? '\n【本次调试重点】：请严格按照 Seedance 2.5 四模态引用头 (@Image1/@Image2/@Video1/@Audio1) 与多镜时间轴输出提示词。'
        : sandboxTargetFormat === 'minimax_h3'
        ? '\n【本次调试重点】：请严格按照 MiniMax H3 运镜括号 [Push in, ...] 与毫秒时间轴格式输出提示词。'
        : '\n【本次调试重点】：请同时输出 Seedance 2.0 (6段式公式)、Seedance 2.5 (四模态时间轴) 与 MiniMax H3 (运镜括号) 三套完整视频提示词以便对比调试。';

    try {
      const res = await fetch('/api/skill/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          skill: {
            ...formState,
            systemInstruction: `${formState.systemInstruction}\n${formatDirective}`,
          },
          sampleInput: sandboxInput,
        }),
      });
      const data = await res.json();
      setSandboxOutput(
        `[调试模型: ${data.modelUsed || selectedModelId} · 目标格式: ${sandboxTargetFormat.toUpperCase()}]\n\n${
          data.output || '执行成功'
        }`
      );
    } catch {
      setSandboxOutput('沙盒调试调用失败，请检查网络连接。');
    } finally {
      setIsTesting(false);
    }
  };

  const insertVariableTag = (tag: string) => {
    setFormState((prev) => ({
      ...prev,
      systemInstruction: `${prev.systemInstruction}\n请结合上下文变量 ${tag} 进行推理。`,
    }));
  };

  const insertRulePreset = (preset: (typeof RULE_SNIPPET_PRESETS)[number]) => {
    setFormState((prev) => ({
      ...prev,
      promptSyntaxFormula: preset.formula,
      systemInstruction: `${prev.systemInstruction.trim()}\n\n${preset.snippet}`,
    }));
    setSaveMessage(`已注入「${preset.label}」提示词语法规则，可点击右侧沙盒测试验证`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-xs transition-colors focus:outline-none ${
    darkMode
      ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-300'
      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900'
  }`;

  const optionClass = darkMode
    ? 'bg-zinc-900 text-zinc-100'
    : 'bg-white text-slate-900';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6">
      <div
        className={`w-full max-w-6xl h-[88vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
          }`}
        >
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              短剧与视频模型 Skill 技能工坊 (Skill Studio)
            </h2>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              内置『Seedance 2.0/2.5 导演 Skill』、6段式公式、多模态锚点解析与 MiniMax H3 运镜括号 · 支持自定义调试提示词规则
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCreateNew}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建自定义 Skill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="关闭 Skill 工坊"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                darkMode
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Column Body */}
        <div className="flex-1 grid grid-cols-12 min-h-0">
          {/* Left Column: Installed & Custom Skills */}
          <div
            className={`col-span-3 border-r overflow-y-auto p-4 space-y-2 ${
              darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
            }`}
          >
            <div
              className={`text-xs font-semibold px-1 pb-1 flex items-center justify-between ${
                darkMode ? 'text-zinc-300' : 'text-slate-600'
              }`}
            >
              <span>技能库列表 ({skills.length})</span>
              <span className={`text-[11px] font-mono ${darkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
                已挂载 {mountedSkillIds.length}
              </span>
            </div>
            {skills.map((skill) => {
              const isSelected = skill.id === selectedId;
              const isMounted = mountedSkillIds.includes(skill.id);
              return (
                <div
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                    isSelected
                      ? darkMode
                        ? 'bg-zinc-800/95 border-zinc-200 text-zinc-100 shadow-sm'
                        : 'bg-slate-900 text-white border-slate-900'
                      : darkMode
                      ? 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                      : 'bg-slate-50/70 border-slate-200/80 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">
                      {skill.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono shrink-0 ${
                        isSelected
                          ? darkMode
                            ? 'text-zinc-300'
                            : 'text-slate-300'
                          : darkMode
                          ? 'text-zinc-400'
                          : 'text-slate-500'
                      }`}
                    >
                      v{skill.version}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] line-clamp-1 ${
                      isSelected
                        ? darkMode
                          ? 'text-zinc-300'
                          : 'text-slate-200'
                        : darkMode
                        ? 'text-zinc-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {skill.description}
                  </p>
                  <div
                    className={`text-[10px] font-mono flex items-center gap-1.5 ${
                      isSelected
                        ? darkMode
                          ? 'text-zinc-300'
                          : 'text-slate-300'
                        : darkMode
                        ? 'text-zinc-400'
                        : 'text-slate-500'
                    }`}
                  >
                    <span>
                      {skill.category === 'video_model'
                        ? '视频模型导演语法'
                        : skill.isBuiltIn
                        ? '内置短剧技能'
                        : '自定义技能'}
                    </span>
                    <span>·</span>
                    <span>产出: {skill.outputNodeType}</span>
                    {isMounted && (
                      <>
                        <span>·</span>
                        <span className={darkMode ? 'text-zinc-100 underline' : 'underline'}>
                          已挂载
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Column: Skill Rule & Video Syntax Formula Editor */}
          <form
            onSubmit={handleSave}
            className={`col-span-5 border-r overflow-y-auto p-6 space-y-4 ${
              darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                Skill 规则定义与视频提示词公式编辑器
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDuplicateSkill}
                  className={`px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    darkMode
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>派生副本</span>
                </button>
                {!formState.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteSkill(formState.id);
                      if (skills.length > 0) handleSelectSkill(skills[0]);
                    }}
                    className={`px-2.5 py-1 rounded-md border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                      darkMode
                        ? 'border-red-800/80 bg-red-950/40 text-red-300 hover:bg-red-950/80'
                        : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>删除</span>
                  </button>
                )}
              </div>
            </div>

            {saveMessage && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  darkMode
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{saveMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  Skill 名称
                </label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState({ ...formState, name: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  技能分类与目标产出节点
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        category: e.target.value as SkillCategory,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="video_model" className={optionClass}>
                      视频模型语法 (video_model)
                    </option>
                    <option value="script" className={optionClass}>
                      剧本扩写 (script)
                    </option>
                    <option value="character" className={optionClass}>
                      角色锁脸 (character)
                    </option>
                    <option value="scene" className={optionClass}>
                      场景锚点 (scene)
                    </option>
                    <option value="storyboard" className={optionClass}>
                      视觉分镜 (storyboard)
                    </option>
                    <option value="custom" className={optionClass}>
                      自定义 (custom)
                    </option>
                  </select>
                  <select
                    value={formState.outputNodeType}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        outputNodeType: e.target.value as NodeCategory,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="storyboard" className={optionClass}>
                      产出: 视觉分镜卡
                    </option>
                    <option value="script" className={optionClass}>
                      产出: 分场剧本卡
                    </option>
                    <option value="character" className={optionClass}>
                      产出: 角色锚点卡
                    </option>
                    <option value="scene_asset" className={optionClass}>
                      产出: 场景锚点卡
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  主适配视频大模型
                </label>
                <select
                  value={formState.targetVideoModel || 'seedance_2_0'}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      targetVideoModel: e.target.value as VideoModelTarget,
                    })
                  }
                  className={inputClass}
                >
                  <option value="seedance_2_0" className={optionClass}>
                    Seedance 2.0 (6段式公式)
                  </option>
                  <option value="seedance_2_5" className={optionClass}>
                    Seedance 2.5 (四模态时间轴)
                  </option>
                  <option value="minimax_h3" className={optionClass}>
                    MiniMax H3 (海螺运镜括号)
                  </option>
                </select>
              </div>
              <div className="col-span-2">
                <label
                  className={`block text-xs font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  视频提示词标准语法公式 (Syntax Formula)
                </label>
                <input
                  type="text"
                  value={formState.promptSyntaxFormula || ''}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      promptSyntaxFormula: e.target.value,
                    })
                  }
                  placeholder="[Subject (@Image1)] + [Action] + in [Env (@Image2)] + Camera..."
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            {/* Quick Video Rule Template Injector */}
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                darkMode
                  ? 'bg-zinc-900/80 border-zinc-800'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={`font-medium flex items-center gap-1.5 ${
                    darkMode ? 'text-zinc-200' : 'text-slate-700'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>一键注入视频提示词语法模块 (点击追加至下方规则供自定义调试)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RULE_SNIPPET_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertRulePreset(preset)}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                      darkMode
                        ? 'bg-zinc-950 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-500'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-1 ${
                  darkMode ? 'text-zinc-300' : 'text-slate-600'
                }`}
              >
                功能描述与开源参考来源 ({formState.sourceRepo || 'Custom'})
              </label>
              <input
                type="text"
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-medium ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  核心规则 Prompt (System Instruction · 支持自定义修改)
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-400'}>
                    插入锚点变量:
                  </span>
                  {[
                    '{{upstream_script}}',
                    '{{character_anchors}}',
                    '{{scene_anchors}}',
                    '@Image1',
                    '@Image2',
                    '@Audio1',
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariableTag(v)}
                      className={`px-1.5 py-0.5 rounded border font-mono text-[10px] cursor-pointer transition-colors ${
                        darkMode
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={8}
                value={formState.systemInstruction}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    systemInstruction: e.target.value,
                  })
                }
                className={`${inputClass} font-mono leading-relaxed`}
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <label
                className={`flex items-center gap-2 text-xs cursor-pointer ${
                  darkMode ? 'text-zinc-200' : 'text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={mountedSkillIds.includes(formState.id)}
                  onChange={() => onToggleMountSkill(formState.id)}
                  className={
                    darkMode
                      ? 'rounded border-zinc-600 bg-zinc-900 accent-white'
                      : 'rounded border-slate-300 accent-slate-900'
                  }
                />
                <span>在全能导演 Agent 中挂载激活该 Skill</span>
              </label>

              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  darkMode
                    ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存规则并应用到 Agent</span>
              </button>
            </div>
          </form>

          {/* Right Column: Live Skill Sandbox Debugger */}
          <div
            className={`col-span-4 p-6 flex flex-col gap-4 overflow-y-auto ${
              darkMode ? 'bg-zinc-900/50 text-zinc-100' : 'bg-slate-50/60 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Terminal className="w-4 h-4" />
                <span>提示词规则沙盒调试 (Live Debugger)</span>
              </div>
              <button
                type="button"
                disabled={isTesting}
                onClick={handleRunSandboxTest}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  darkMode
                    ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTesting ? '正在推理...' : '运行沙盒测试'}</span>
              </button>
            </div>

            {/* Target Video Format Filter for Sandbox */}
            <div className="space-y-1.5">
              <label
                className={`block text-xs font-medium ${
                  darkMode ? 'text-zinc-300' : 'text-slate-600'
                }`}
              >
                选择调试输出的视频模型格式：
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'all', label: '联合输出三套格式' },
                    { id: 'seedance_2_0', label: 'Seedance 2.0 (6段式)' },
                    { id: 'seedance_2_5', label: 'Seedance 2.5 (四模态)' },
                    { id: 'minimax_h3', label: 'MiniMax H3 (运镜括号)' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSandboxTargetFormat(fmt.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer text-left flex items-center gap-1.5 ${
                      sandboxTargetFormat === fmt.id
                        ? darkMode
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                          : 'bg-slate-900 text-white border-slate-900'
                        : darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Layers className="w-3 h-3 shrink-0" />
                    <span className="truncate">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-zinc-300' : 'text-slate-600'
                }`}
              >
                模拟上游画布输入 (包含 @Image1 角色锁脸 / @Image2 场景锚点 / @Audio1 台词)
              </label>
              <textarea
                rows={4}
                value={sandboxInput}
                onChange={(e) => setSandboxInput(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[220px]">
              <span
                className={`text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-zinc-300' : 'text-slate-600'
                }`}
              >
                Skill 规则推理输出预览 (当前引擎: {selectedModelId})
              </span>
              <div
                className={`flex-1 rounded-xl border p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto ${
                  darkMode
                    ? 'border-zinc-800 bg-zinc-950 text-zinc-200'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                {isTesting ? (
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-400'}>
                    正在调用所选大模型 ({selectedModelId}) 调试「{formState.name}」的提示词规则...
                  </span>
                ) : sandboxOutput ? (
                  sandboxOutput
                ) : (
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-400'}>
                    点击右上角「运行沙盒测试」，即可实时调试『{formState.name}』的 6段式公式、多模态锚点解析与视频模型提示词输出效果。
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
