import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Plus,
  Check,
  Sliders,
  Layers,
  CornerDownRight,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Activity,
  Cpu,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  ListTodo,
  Pencil,
  CheckCircle2,
  Wrench,
  PanelRightClose,
  BrainCircuit,
} from 'lucide-react';
import {
  CanvasNode,
  DramaSkill,
  AgentChatMessage,
  AgentModelOption,
  UploadedAttachment,
} from '../types/canvas';

interface OmniAgentPanelProps {
  models: AgentModelOption[];
  selectedModelId: string;
  skills: DramaSkill[];
  mountedSkillIds: string[];
  selectedNode: CanvasNode | null;
  upstreamNodes: CanvasNode[];
  messages: AgentChatMessage[];
  isRunning: boolean;
  darkMode: boolean;
  onSelectModel: (modelId: string) => void;
  onToggleMountSkill: (skillId: string) => void;
  onExecuteAgentPrompt: (prompt: string, attachments: UploadedAttachment[]) => void;
  onCreateNodeFromAttachment: (att: UploadedAttachment) => void;
  onOpenSkillStudio: (skillId?: string) => void;
  onFocusNode: (nodeId: string) => void;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
}

export const OmniAgentPanel: React.FC<OmniAgentPanelProps> = ({
  models,
  selectedModelId,
  skills,
  mountedSkillIds,
  selectedNode,
  messages,
  isRunning,
  darkMode,
  onSelectModel,
  onToggleMountSkill,
  onExecuteAgentPrompt,
  onCreateNodeFromAttachment,
  onOpenSkillStudio,
  onFocusNode,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isSkillRackOpen, setIsSkillRackOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState<'all' | 'video_model' | 'drama'>('all');
  const [testingModel, setTestingModel] = useState(false);
  const [modelTestStatus, setModelTestStatus] = useState<string | null>(null);
  const [expandedThinkingMap, setExpandedThinkingMap] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRunning]);

  const mountedSkills = skills.filter((s) => mountedSkillIds.includes(s.id));
  const videoSkillCount = skills.filter((s) => s.category === 'video_model').length;
  const filteredSkills = skills.filter((s) => {
    if (skillFilter === 'video_model') return s.category === 'video_model';
    if (skillFilter === 'drama') return s.category !== 'video_model';
    return true;
  });

  const toggleThinkingExpand = (msgId: string) => {
    setExpandedThinkingMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === undefined ? false : !prev[msgId],
    }));
  };

  const handleTestSelectedModel = async () => {
    setTestingModel(true);
    setModelTestStatus(null);
    try {
      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: selectedModelId }),
      });
      const data = await res.json();
      if (data.success) {
        setModelTestStatus(`已连通 (${data.provider} · ${data.latencyMs}ms)`);
      } else {
        setModelTestStatus(`测试失败: ${data.error || '未知错误'}`);
      }
    } catch {
      setModelTestStatus('网络请求异常');
    } finally {
      setTestingModel(false);
      setTimeout(() => setModelTestStatus(null), 4500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      if (isImage) {
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              mimeType: file.type || 'image/png',
              sizeBytes: file.size,
              kind: 'image',
              dataUrl,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const textContent = typeof reader.result === 'string' ? reader.result : '';
          setAttachments((prev) => [
            ...prev,
            {
              id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              mimeType: file.type || 'text/plain',
              sizeBytes: file.size,
              kind: 'text',
              textContent: textContent.slice(0, 18000),
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputPrompt.trim() && attachments.length === 0) || isRunning) return;
    const effectivePrompt =
      inputPrompt.trim() ||
      `请解析我上传的附件（${attachments.map((a) => a.name).join(', ')}），结合当前挂载的漫剧老李与 Seedance 导演 Skill 在画布上生成对应节点与连线。`;
    onExecuteAgentPrompt(effectivePrompt, attachments);
    setInputPrompt('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickDirectives = [
    {
      shortLabel: '续写SHOT07：1秒搓木质长弓',
      prompt:
        '基于《公路求生》SHOT 06开出的【木质长弓】图纸，调用『Seedance 2.0/2.5 导演 Skill』与『漫剧老李·三大打戏专精引擎』，生成 SHOT 07 谢长清用老式车床1秒制造出“巧夺天工”满耐久999木质长弓的9:16分镜节点（纯提示词，不出图）',
    },
    {
      shortLabel: '文武双模+FACS分镜',
      prompt:
        '使用『漫剧老李·总控与文武双模分镜 Skill』，按 FACS 面部动作编码六阶段微表情与 180° 轴线站位声明，将当前剧本拆解为 2 个 9:16 竖屏分镜节点（纯提示词）',
    },
    {
      shortLabel: '四视图资产锁死卡',
      prompt:
        '调用『漫剧老李·四视图资产锁死 Skill』，为《公路求生》中的新道具「巧夺天工·木质长弓（耐久999）」生成一张完整的四视图资产提示词卡',
    },
  ];

  const optionClass = darkMode
    ? 'bg-zinc-900 text-zinc-100'
    : 'bg-white text-slate-900';

  const currentModelName =
    models.find((m) => m.id === selectedModelId)?.displayName || selectedModelId;

  return (
    <aside
      className={`w-[410px] shrink-0 h-full border-l flex flex-col select-none transition-colors ${
        darkMode
          ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* 1. Compact Studio Copilot Header + Model Selector + Collapse Button */}
      <div
        className={`px-4 py-3 border-b space-y-2.5 shrink-0 ${
          darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  : 'bg-slate-900 border-slate-900 text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold tracking-tight truncate">
                全能短剧导演 Agent · 漫剧老李总控
              </h2>
              <p className={`text-[10px] truncate ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                DeepSeek + GRSAI + 自定义运营商 · 思考链与工具轨迹可视
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenSkillStudio('skill-seedance-director-suite')}
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Skill 工坊</span>
            </button>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="隐藏右侧 Agent 面板，展开全屏无限画布"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  darkMode
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Model Selector & Ping Button & Custom Provider Button */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Cpu
              className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                darkMode ? 'text-zinc-400' : 'text-slate-400'
              }`}
            />
            <select
              value={selectedModelId}
              onChange={(e) => onSelectModel(e.target.value)}
              className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[11px] font-medium focus:outline-none cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-900'
              }`}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className={optionClass}>
                  [{m.providerLabel}] {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={testingModel}
            onClick={handleTestSelectedModel}
            title="测试当前所选大模型接口连通延迟"
            className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
              darkMode
                ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>{testingModel ? '测速...' : '测速'}</span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="打开设置中心：自定义添加 AI 运营商与模型网关"
              className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>运营商</span>
            </button>
          )}
        </div>

        {modelTestStatus && (
          <div
            className={`text-[11px] font-mono px-2.5 py-1 rounded-md border ${
              darkMode
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {modelTestStatus}
          </div>
        )}
      </div>

      {/* 2. Collapsible Skill Mount Drawer */}
      <div
        className={`border-b shrink-0 ${
          darkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div
          onClick={() => setIsSkillRackOpen((o) => !o)}
          className="px-4 py-2 flex items-center justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium shrink-0">
              已挂载 {mountedSkills.length}/{skills.length} 个短剧 Skill
            </span>
            <span
              className={`text-[11px] truncate ${
                darkMode ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              ({mountedSkills.map((s) => s.name.split(' ')[0]).join('、')})
            </span>
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] shrink-0 ${
              darkMode ? 'text-zinc-300' : 'text-slate-600'
            }`}
          >
            <span>{isSkillRackOpen ? '收起' : '展开管理'}</span>
            {isSkillRackOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {isSkillRackOpen && (
          <div
            className={`px-4 pb-3 pt-1 space-y-2 border-t ${
              darkMode ? 'border-zinc-800/80' : 'border-slate-200/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: `全部 (${skills.length})` },
                  { id: 'video_model', label: `视频模型/打戏 (${videoSkillCount})` },
                  { id: 'drama', label: '总控/剧本/锁脸' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSkillFilter(tab.id as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      skillFilter === tab.id
                        ? darkMode
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-slate-900 text-white'
                        : darkMode
                        ? 'text-zinc-400 hover:text-zinc-100'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenSkillStudio('new')}
                className={`text-[11px] flex items-center gap-0.5 hover:underline cursor-pointer ${
                  darkMode ? 'text-zinc-200' : 'text-slate-700'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>新建 Skill</span>
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {filteredSkills.map((skill) => {
                const isMounted = mountedSkillIds.includes(skill.id);
                return (
                  <div
                    key={skill.id}
                    onClick={() => onToggleMountSkill(skill.id)}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                      isMounted
                        ? darkMode
                          ? 'bg-zinc-800/95 border-zinc-200 text-zinc-100'
                          : 'bg-slate-900 border-slate-900 text-white'
                        : darkMode
                        ? 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">
                        {skill.name}
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 line-clamp-1 font-mono ${
                          isMounted
                            ? darkMode
                              ? 'text-zinc-300'
                              : 'text-slate-300'
                            : darkMode
                            ? 'text-zinc-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {skill.promptSyntaxFormula || skill.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSkillStudio(skill.id);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          isMounted
                            ? darkMode
                              ? 'border-zinc-600 bg-zinc-900 text-zinc-100 hover:bg-zinc-950'
                              : 'border-slate-700 bg-slate-800 text-white'
                            : darkMode
                            ? 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        调试
                      </button>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isMounted
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                              : 'bg-white text-slate-900 border-white'
                            : darkMode
                            ? 'border-zinc-600 bg-zinc-950'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isMounted && <Check className="w-3 h-3 stroke-[2.5]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Agent Conversation Stream with AI Studio Style Action History & Thinking Trace */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isThinkingOpen =
            expandedThinkingMap[msg.id] === undefined ? true : expandedThinkingMap[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-2 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              {/* Role & Duration Header matching the reference screenshot */}
              <div
                className={`flex items-center gap-1.5 text-[11px] px-0.5 ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                {isUser ? (
                  <>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                    <span>•</span>
                    <span className={`font-medium ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
                      导演指令
                    </span>
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span className={`font-medium ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {msg.modelUsed || 'DeepSeek-V4.1-Flash'}
                    </span>
                    <span>•</span>
                    <span>
                      Ran for {msg.actionHistory?.durationLabel || '4s'}
                    </span>
                  </>
                )}
              </div>

              {/* Screenshot-Accurate Action History & Thinking Process Card (For Assistant Messages) */}
              {!isUser && msg.actionHistory && (
                <div
                  className={`w-full rounded-xl border overflow-hidden text-xs transition-colors ${
                    darkMode
                      ? 'bg-[#141417] border-zinc-800 text-zinc-200'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Card Header: Action history */}
                  <div
                    onClick={() => toggleThinkingExpand(msg.id)}
                    className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 cursor-pointer ${
                      darkMode
                        ? 'border-zinc-800/90 bg-zinc-900/60 hover:bg-zinc-900'
                        : 'border-slate-200 bg-slate-100/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <ListTodo
                        className={`w-3.5 h-3.5 ${
                          darkMode ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      />
                      <span>Action history</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-[11px] ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      <BrainCircuit className="w-3 h-3" />
                      <span>
                        思考过程 ({msg.actionHistory.thinkingSteps.length})
                      </span>
                      {isThinkingOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 space-y-3">
                    <div
                      className={`text-[11px] ${
                        darkMode ? 'text-zinc-300' : 'text-slate-600'
                      }`}
                    >
                      Here are key actions taken for the app:
                    </div>

                    {/* Collapsible Thinking Process Steps */}
                    {isThinkingOpen &&
                      msg.actionHistory.thinkingSteps &&
                      msg.actionHistory.thinkingSteps.length > 0 && (
                        <div
                          className={`p-2.5 rounded-lg border space-y-1.5 text-[11px] leading-relaxed ${
                            darkMode
                              ? 'bg-zinc-950/80 border-zinc-800/90 text-zinc-400'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${
                              darkMode ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            <BrainCircuit className="w-3 h-3 text-emerald-400" />
                            <span>Thinking Process · 导演思维链推理</span>
                          </div>
                          {msg.actionHistory.thinkingSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2 pl-1">
                              <span
                                className={`font-mono text-[10px] shrink-0 mt-0.5 ${
                                  darkMode ? 'text-zinc-500' : 'text-slate-400'
                                }`}
                              >
                                0{sIdx + 1}.
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Edited / Executed N items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Pencil
                          className={`w-3.5 h-3.5 ${
                            darkMode ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        />
                        <span>
                          {msg.actionHistory.summaryHeader ||
                            `Edited ${msg.actionHistory.toolCalls.length} files`}
                        </span>
                      </div>

                      {/* Indented Tool / File Execution List with Right Checkmarks */}
                      <div
                        className={`ml-2 pl-3 border-l space-y-2 ${
                          darkMode ? 'border-zinc-800' : 'border-slate-300'
                        }`}
                      >
                        {msg.actionHistory.toolCalls.map((tc) => (
                          <div
                            key={tc.id}
                            className="flex items-center justify-between gap-2 text-[11px] font-mono"
                          >
                            <div className="min-w-0 truncate">
                              <span
                                className={
                                  darkMode ? 'text-zinc-300' : 'text-slate-700'
                                }
                              >
                                {tc.target}
                              </span>
                              {tc.detail && (
                                <span
                                  className={`ml-1.5 text-[10px] ${
                                    darkMode ? 'text-zinc-500' : 'text-slate-500'
                                  }`}
                                >
                                  ({tc.detail})
                                </span>
                              )}
                            </div>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Built Footer Status */}
                    <div className="pt-1 flex items-center gap-2 text-xs font-medium">
                      <Wrench
                        className={`w-3.5 h-3.5 ${
                          darkMode ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{msg.actionHistory.builtStatus || 'Built'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Card Body */}
              <div
                className={`w-full p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? darkMode
                      ? 'max-w-[92%] bg-zinc-100 text-zinc-950 rounded-tr-xs'
                      : 'max-w-[92%] bg-slate-900 text-white rounded-tr-xs'
                    : darkMode
                    ? 'bg-zinc-900/90 text-zinc-100 border border-zinc-800/90 rounded-tl-xs'
                    : 'bg-slate-100/90 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                }`}
              >
                {/* Attachments inside Message */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="text-[11px] pb-2 mb-2 border-b border-current/15 flex flex-wrap gap-1.5">
                    {msg.attachments.map((a, i) => (
                      <span key={i} className="font-mono">
                        📎 {a.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Compact Mounted Skills Summary inside Message */}
                {msg.mountedSkills && msg.mountedSkills.length > 0 && (
                  <div
                    className={`text-[10px] font-mono pb-2 mb-2 border-b truncate ${
                      isUser
                        ? 'border-zinc-300 text-zinc-700'
                        : darkMode
                        ? 'border-zinc-800 text-zinc-400'
                        : 'border-slate-200 text-slate-500'
                    }`}
                    title={msg.mountedSkills.join(' · ')}
                  >
                    已调度 {msg.mountedSkills.length} 个 Skill：{msg.mountedSkills.slice(0, 2).join(' · ')}
                    {msg.mountedSkills.length > 2 ? ` 等` : ''}
                  </div>
                )}

                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Spawned Canvas Nodes Jump Links */}
                {msg.spawnedNodeIds && msg.spawnedNodeIds.length > 0 && (
                  <div
                    className={`mt-3 pt-2.5 border-t flex flex-wrap gap-1.5 ${
                      darkMode ? 'border-zinc-800' : 'border-slate-200'
                    }`}
                  >
                    {msg.spawnedNodeIds.map((nid, idx) => (
                      <button
                        key={nid}
                        type="button"
                        onClick={() => onFocusNode(nid)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                          darkMode
                            ? 'bg-zinc-950 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>定位新增节点 #{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Running State with Real-Time Thinking & Tool Execution Card */}
        {isRunning && (
          <div className="space-y-2">
            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                darkMode ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              <span
                className={`font-medium ${
                  darkMode ? 'text-zinc-200' : 'text-slate-800'
                }`}
              >
                {currentModelName}
              </span>
              <span>•</span>
              <span>Running thinking & tool calls...</span>
            </div>
            <div
              className={`w-full rounded-xl border overflow-hidden text-xs ${
                darkMode
                  ? 'bg-[#141417] border-zinc-800 text-zinc-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
                  darkMode
                    ? 'border-zinc-800 bg-zinc-900/60'
                    : 'border-slate-200 bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <ListTodo
                    className={`w-3.5 h-3.5 ${
                      darkMode ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  />
                  <span>Action history</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  Thinking...
                </span>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div
                  className={`text-[11px] ${
                    darkMode ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Here are key actions taken for the app:
                </div>
                <div
                  className={`ml-2 pl-3 border-l space-y-2 text-[11px] font-mono ${
                    darkMode ? 'border-zinc-800' : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={darkMode ? 'text-zinc-300' : 'text-slate-700'}>
                      mount_skill (漫剧老李总控 + Seedance 导演 Skill)
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={darkMode ? 'text-zinc-300' : 'text-slate-700'}>
                      inspect_canvas_topology (@Image1, @Image2 锚点链路)
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>
                      synthesize_storyboard_nodes (生成 6/7段式分镜与连线)...
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 4. Modern Unified Bottom Composer Card */}
      <div
        className={`p-3.5 border-t space-y-2 shrink-0 ${
          darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
        }`}
      >
        {/* Horizontal Quick Directives Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {quickDirectives.map((qd, i) => (
            <button
              key={i}
              type="button"
              disabled={isRunning}
              onClick={() => onExecuteAgentPrompt(qd.prompt, attachments)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              + {qd.shortLabel}
            </button>
          ))}
        </div>

        {/* Unified Composer Box */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl border p-2.5 space-y-2 transition-colors ${
            darkMode
              ? 'bg-zinc-900/90 border-zinc-700 focus-within:border-zinc-300'
              : 'bg-slate-50/70 border-slate-300 focus-within:border-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.json,.srt,.csv,image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Uploaded Attachments Inside Composer */}
          {attachments.length > 0 && (
            <div
              className={`flex flex-wrap gap-1.5 pb-1.5 border-b ${
                darkMode ? 'border-zinc-800' : 'border-slate-200'
              }`}
            >
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                    darkMode
                      ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {att.kind === 'image' ? (
                    <ImageIcon className="w-3 h-3 shrink-0" />
                  ) : (
                    <FileText className="w-3 h-3 shrink-0" />
                  )}
                  <span className="max-w-[110px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => onCreateNodeFromAttachment(att)}
                    className={`text-[10px] underline px-1 cursor-pointer ${
                      darkMode
                        ? 'text-zinc-200 hover:text-white'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    上画布
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className={`cursor-pointer ${
                      darkMode
                        ? 'text-zinc-400 hover:text-zinc-100'
                        : 'text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入短剧导演指令（Enter 发送，Shift+Enter 换行）..."
            className={`w-full bg-transparent text-xs focus:outline-none resize-none leading-relaxed ${
              darkMode
                ? 'text-zinc-100 placeholder:text-zinc-500'
                : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />

          {/* Composer Bottom Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="上传剧本文件 (.txt/.md/.srt/.json) 或角色/分镜参考图"
                className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  darkMode
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900'
                }`}
              >
                <Paperclip className="w-3 h-3" />
                <span>上传剧本/参考图</span>
              </button>

              <span
                className={`text-[11px] truncate ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
                title={selectedNode ? `当前焦点：${selectedNode.data.title}` : '全局画布模式'}
              >
                {selectedNode
                  ? `焦点: ${selectedNode.data.title.split('·')[0]}`
                  : '焦点: 全局画布'}
              </span>
            </div>

            <button
              type="submit"
              disabled={(!inputPrompt.trim() && attachments.length === 0) || isRunning}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer shrink-0 ${
                darkMode
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <span>发送</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
};
