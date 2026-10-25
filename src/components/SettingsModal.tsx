import React, { useState, useMemo } from 'react';
import {
  X,
  Server,
  Plus,
  Trash2,
  CheckCircle2,
  Activity,
  Sliders,
  KeyRound,
  Globe,
  Cpu,
  Eye,
  EyeOff,
  Sparkles,
  Image as ImageIcon,
  Film,
  MessageSquareText,
  Layers,
} from 'lucide-react';
import {
  CustomAIProviderConfig,
  AgentModelOption,
  VideoModelTarget,
  ModelModality,
} from '../types/canvas';
import { GRSAI_DASHBOARD_MODELS } from '../data/initialProject';

interface SettingsModalProps {
  isOpen: boolean;
  darkMode: boolean;
  builtInModels: AgentModelOption[];
  customProviders: CustomAIProviderConfig[];
  selectedModelId: string;
  purePromptMode: boolean;
  defaultVideoModel: VideoModelTarget;
  edgeColor: string;
  onClose: () => void;
  onAddCustomProvider: (provider: CustomAIProviderConfig) => void;
  onDeleteCustomProvider: (id: string) => void;
  onSelectModel: (modelId: string) => void;
  onTogglePurePromptMode: (val: boolean) => void;
  onChangeDefaultVideoModel: (vm: VideoModelTarget) => void;
  onChangeEdgeColor: (color: string) => void;
  onToggleDarkMode: () => void;
}

const PROVIDER_PRESETS = [
  {
    name: '火山方舟 (Doubao / Seedance)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: 'doubao-1-5-pro-32k-250115, doubao-seedance-2-0',
    supportsVision: true,
  },
  {
    name: '硅基流动 (SiliconFlow)',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: 'deepseek-ai/DeepSeek-V3, Qwen/Qwen2.5-72B-Instruct',
    supportsVision: true,
  },
  {
    name: 'MiniMax 海螺开放平台',
    baseUrl: 'https://api.minimax.chat/v1',
    models: 'abab6.5s-chat, MiniMax-Text-01, minimax-h3',
    supportsVision: true,
  },
  {
    name: 'OpenRouter 全球聚合',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: 'anthropic/claude-3.7-sonnet, google/gemini-2.5-pro',
    supportsVision: true,
  },
  {
    name: '阿里云百炼 (DashScope)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: 'qwen-max, qwen-vl-max',
    supportsVision: true,
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  darkMode,
  builtInModels,
  customProviders,
  selectedModelId,
  purePromptMode,
  defaultVideoModel,
  edgeColor,
  onClose,
  onAddCustomProvider,
  onDeleteCustomProvider,
  onSelectModel,
  onTogglePurePromptMode,
  onChangeDefaultVideoModel,
  onChangeEdgeColor,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<
    'grsai_catalog' | 'providers' | 'preferences'
  >('grsai_catalog');
  const [grsaiModalityFilter, setGrsaiModalityFilter] = useState<
    'all' | ModelModality
  >('all');
  const [grsaiSearch, setGrsaiSearch] = useState('');

  // Form state for adding a new custom AI provider
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [modelsInput, setModelsInput] = useState('');
  const [supportsVision, setSupportsVision] = useState(true);

  const [testingStatus, setTestingStatus] = useState<{
    loading: boolean;
    ok?: boolean;
    msg?: string;
  }>({ loading: false });

  const [pingingBuiltInId, setPingingBuiltInId] = useState<string | null>(null);
  const [builtInPingResult, setBuiltInPingResult] = useState<
    Record<string, string>
  >({});

  const filteredGrsaiModels = useMemo(() => {
    return GRSAI_DASHBOARD_MODELS.filter((m) => {
      if (grsaiModalityFilter !== 'all' && m.modality !== grsaiModalityFilter) {
        return false;
      }
      if (grsaiSearch.trim()) {
        const q = grsaiSearch.toLowerCase();
        return (
          m.modelName.toLowerCase().includes(q) ||
          m.displayName.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [grsaiModalityFilter, grsaiSearch]);

  if (!isOpen) return null;

  const textCount = GRSAI_DASHBOARD_MODELS.filter(
    (m) => m.modality === 'text'
  ).length;
  const imageCount = GRSAI_DASHBOARD_MODELS.filter(
    (m) => m.modality === 'image'
  ).length;
  const videoCount = GRSAI_DASHBOARD_MODELS.filter(
    (m) => m.modality === 'video'
  ).length;

  const handleApplyPreset = (preset: (typeof PROVIDER_PRESETS)[0]) => {
    setName(preset.name);
    setBaseUrl(preset.baseUrl);
    setModelsInput(preset.models);
    setSupportsVision(preset.supportsVision);
    setTestingStatus({ loading: false });
  };

  const handleTestCustomProvider = async () => {
    const modelList = modelsInput
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!baseUrl.trim() || !apiKey.trim() || modelList.length === 0) {
      setTestingStatus({
        loading: false,
        ok: false,
        msg: '请填写完整的 Base URL、API Key 以及至少 1 个模型 ID',
      });
      return;
    }

    setTestingStatus({
      loading: true,
      msg: '正在请求运营商接口验证连通性...',
    });
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || '自定义运营商',
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
          testModel: modelList[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestingStatus({
          loading: false,
          ok: true,
          msg: `连通成功！模型 [${data.model}] 响应延迟 ${data.latencyMs}ms`,
        });
      } else {
        setTestingStatus({
          loading: false,
          ok: false,
          msg: `连接失败：${data.error || '请检查 Base URL 或 Key'}`,
        });
      }
    } catch {
      setTestingStatus({
        loading: false,
        ok: false,
        msg: '网络请求异常，请检查接口地址格式',
      });
    }
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    const modelList = modelsInput
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      !name.trim() ||
      !baseUrl.trim() ||
      !apiKey.trim() ||
      modelList.length === 0
    ) {
      setTestingStatus({
        loading: false,
        ok: false,
        msg: '请填写运营商名称、Base URL、API Key 与模型列表后再保存',
      });
      return;
    }

    const newProvider: CustomAIProviderConfig = {
      id: `prov-${Date.now()}`,
      name: name.trim(),
      protocol: 'openai_compatible',
      baseUrl: baseUrl.trim().replace(/\/+$/, ''),
      apiKey: apiKey.trim(),
      models: modelList,
      supportsVision,
      enabled: true,
    };

    onAddCustomProvider(newProvider);
    setName('');
    setBaseUrl('');
    setApiKey('');
    setModelsInput('');
    setTestingStatus({
      loading: false,
      ok: true,
      msg: `已成功添加「${newProvider.name}」并注册 ${modelList.length} 个模型至全局工作台！`,
    });
  };

  const handlePingBuiltIn = async (modelId: string) => {
    setPingingBuiltInId(modelId);
    try {
      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();
      setBuiltInPingResult((prev) => ({
        ...prev,
        [modelId]: data.success ? `正常 (${data.latencyMs}ms)` : '超时/异常',
      }));
    } catch {
      setBuiltInPingResult((prev) => ({
        ...prev,
        [modelId]: '请求失败',
      }));
    } finally {
      setPingingBuiltInId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-5xl max-h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          darkMode
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            darkMode
              ? 'border-zinc-800 bg-zinc-900/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  : 'bg-slate-900 border-slate-900 text-white'
              }`}
            >
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                工作台设置 · GRSAI 32模型矩阵与自定义 AI 运营商中心
              </h2>
              <p
                className={`text-xs ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                已同步 https://grsai.ai/zh/dashboard/models 全部 32 款文本/图像/视频模型 · 支持接入任意自定义 OpenAI 兼容运营商
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              darkMode
                ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`px-6 py-2.5 border-b flex items-center gap-2 shrink-0 flex-wrap ${
            darkMode
              ? 'border-zinc-800 bg-zinc-950'
              : 'border-slate-200 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('grsai_catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'grsai_catalog'
                ? darkMode
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-slate-900 text-white'
                : darkMode
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              GRSAI 官方模型目录 ({GRSAI_DASHBOARD_MODELS.length}款：文本 {textCount} / 图像 {imageCount} / 视频 {videoCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'providers'
                ? darkMode
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-slate-900 text-white'
                : darkMode
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>
              自定义 AI 运营商接入 ({customProviders.length} 家自定义 + DeepSeek官方)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'preferences'
                ? darkMode
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-slate-900 text-white'
                : darkMode
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>生成模式与画布引擎偏好</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GRSAI 32-MODEL CATALOG (TEXT / IMAGE / VIDEO) */}
          {activeTab === 'grsai_catalog' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                  darkMode
                    ? 'bg-zinc-900/60 border-zinc-800'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    {
                      id: 'all' as const,
                      label: `全部模型 (${GRSAI_DASHBOARD_MODELS.length})`,
                      icon: Layers,
                    },
                    {
                      id: 'text' as const,
                      label: `文本与多模态推理 (${textCount})`,
                      icon: MessageSquareText,
                    },
                    {
                      id: 'image' as const,
                      label: `图像绘画生成 (${imageCount})`,
                      icon: ImageIcon,
                    },
                    {
                      id: 'video' as const,
                      label: `视频生成模型 (${videoCount})`,
                      icon: Film,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = grsaiModalityFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setGrsaiModalityFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                              : 'bg-slate-900 text-white border-slate-900'
                            : darkMode
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={grsaiSearch}
                  onChange={(e) => setGrsaiSearch(e.target.value)}
                  placeholder="搜索 nano-banana / gpt-image / minimax-h3 / gemini..."
                  className={`w-64 px-3 py-1.5 rounded-lg border text-xs font-mono focus:outline-none ${
                    darkMode
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900'
                  }`}
                />
              </div>

              {/* Models Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredGrsaiModels.map((gm) => {
                  const isCurrent = selectedModelId === gm.id;
                  const pingText = builtInPingResult[gm.id];

                  return (
                    <div
                      key={gm.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isCurrent
                          ? darkMode
                            ? 'bg-zinc-900 border-zinc-200 ring-1 ring-zinc-200'
                            : 'bg-slate-50 border-slate-900 ring-1 ring-slate-900'
                          : darkMode
                          ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                                gm.modality === 'video'
                                  ? darkMode
                                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                  : gm.modality === 'image'
                                  ? darkMode
                                    ? 'bg-sky-950/60 border-sky-800 text-sky-300'
                                    : 'bg-sky-50 border-sky-200 text-sky-800'
                                  : darkMode
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}
                            >
                              {gm.modality === 'video'
                                ? '视频模型'
                                : gm.modality === 'image'
                                ? '图像模型'
                                : '文本/多模态'}
                            </span>
                            <span className="text-xs font-bold font-mono truncate">
                              {gm.modelName}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                              darkMode
                                ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {gm.resolutionOrDuration}
                          </span>
                        </div>

                        <p
                          className={`text-[11px] leading-relaxed ${
                            darkMode ? 'text-zinc-300' : 'text-slate-600'
                          }`}
                        >
                          {gm.description}
                        </p>
                      </div>

                      <div
                        className={`pt-2 border-t flex items-center justify-between gap-2 ${
                          darkMode ? 'border-zinc-800/80' : 'border-slate-100'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-mono ${
                            darkMode ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          {pingText || gm.badge}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={pingingBuiltInId === gm.id}
                            onClick={() => handlePingBuiltIn(gm.id)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer ${
                              darkMode
                                ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pingingBuiltInId === gm.id ? '测速中...' : '测速'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectModel(gm.id)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                              isCurrent
                                ? darkMode
                                  ? 'bg-emerald-400 text-zinc-950'
                                  : 'bg-emerald-600 text-white'
                                : darkMode
                                ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {isCurrent ? '✓ 当前已激活' : '设为当前引擎'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM AI PROVIDERS & BUILT-IN DEEPSEEK */}
          {activeTab === 'providers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Add Custom AI Provider Form (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  className={`p-4 rounded-xl border space-y-4 ${
                    darkMode
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        新增自定义 AI 运营商 (OpenAI /v1/chat/completions 兼容)
                      </span>
                    </h3>
                  </div>

                  {/* Quick Fill Presets */}
                  <div className="space-y-1.5">
                    <span
                      className={`text-[11px] block ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      一键填入主流运营商预设模板：
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PROVIDER_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                            darkMode
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          + {preset.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form
                    onSubmit={handleSaveProvider}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        运营商显示名称 *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如：硅基流动 SiliconFlow / 火山方舟 Seedance"
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                          darkMode
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-500'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        API Base URL (接口地址) *
                      </label>
                      <div className="relative">
                        <Globe
                          className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                            darkMode ? 'text-zinc-400' : 'text-slate-400'
                          }`}
                        />
                        <input
                          type="text"
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                          placeholder="https://api.siliconflow.cn/v1"
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border text-xs font-mono focus:outline-none ${
                            darkMode
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-500'
                              : 'bg-white border-slate-200 text-slate-900 focus:border-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        API Key (密钥将通过服务端代理调用，安全存储于本地) *
                      </label>
                      <div className="relative flex items-center">
                        <KeyRound
                          className={`w-3.5 h-3.5 absolute left-3 ${
                            darkMode ? 'text-zinc-400' : 'text-slate-400'
                          }`}
                        />
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                          className={`w-full pl-8 pr-9 py-2 rounded-lg border text-xs font-mono focus:outline-none ${
                            darkMode
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-500'
                              : 'bg-white border-slate-200 text-slate-900 focus:border-slate-900'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((s) => !s)}
                          className={`absolute right-2.5 cursor-pointer ${
                            darkMode
                              ? 'text-zinc-400 hover:text-zinc-100'
                              : 'text-slate-400 hover:text-slate-800'
                          }`}
                        >
                          {showKey ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        模型 ID 列表 (多个模型请用英文逗号分隔) *
                      </label>
                      <input
                        type="text"
                        value={modelsInput}
                        onChange={(e) => setModelsInput(e.target.value)}
                        placeholder="deepseek-ai/DeepSeek-V3, Qwen/Qwen2.5-72B-Instruct"
                        className={`w-full px-3 py-2 rounded-lg border text-xs font-mono focus:outline-none ${
                          darkMode
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-500'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-slate-900'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={supportsVision}
                          onChange={(e) => setSupportsVision(e.target.checked)}
                          className={
                            darkMode
                              ? 'rounded border-zinc-600 bg-zinc-900 accent-zinc-100'
                              : 'rounded border-slate-300 accent-slate-900'
                          }
                        />
                        <span>支持多模态图片识别 (Vision)</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={testingStatus.loading}
                          onClick={handleTestCustomProvider}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                            darkMode
                              ? 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>
                            {testingStatus.loading
                              ? '验证中...'
                              : '测试接口连通'}
                          </span>
                        </button>

                        <button
                          type="submit"
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                            darkMode
                              ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>保存并接入工作台</span>
                        </button>
                      </div>
                    </div>

                    {testingStatus.msg && (
                      <div
                        className={`p-2.5 rounded-lg border text-[11px] font-mono ${
                          testingStatus.ok
                            ? darkMode
                              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : darkMode
                            ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        {testingStatus.msg}
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Right Column: Active Custom Providers & DeepSeek Official (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    darkMode
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <h3 className="text-xs font-semibold">
                    已接入的自定义 AI 运营商 ({customProviders.length})
                  </h3>

                  {customProviders.length === 0 ? (
                    <p
                      className={`text-xs py-4 text-center border border-dashed rounded-lg ${
                        darkMode
                          ? 'border-zinc-800 text-zinc-400'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      暂未添加自定义运营商，可在左侧填入添加
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {customProviders.map((cp) => (
                        <div
                          key={cp.id}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                            darkMode
                              ? 'bg-zinc-950 border-zinc-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{cp.name}</span>
                            <button
                              type="button"
                              onClick={() => onDeleteCustomProvider(cp.id)}
                              className={`cursor-pointer ${
                                darkMode
                                  ? 'text-zinc-400 hover:text-red-400'
                                  : 'text-slate-400 hover:text-red-600'
                              }`}
                              title="移除该运营商"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div
                            className={`text-[11px] font-mono truncate ${
                              darkMode ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            {cp.baseUrl}
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {cp.models.map((m) => {
                              const fullId = `custom:${cp.id}:${m}`;
                              const isCurrent = selectedModelId === fullId;
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => onSelectModel(fullId)}
                                  className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                                    isCurrent
                                      ? darkMode
                                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                                        : 'bg-slate-900 text-white border-slate-900'
                                      : darkMode
                                      ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  {isCurrent ? '✓ ' : ''}
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Built-in Verified DeepSeek & Gemini Native */}
                <div
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    darkMode
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <h3 className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>内置直连引擎 (DeepSeek 官方 & Google 原生)</span>
                  </h3>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {builtInModels
                      .filter((bm) => bm.provider !== 'grsai')
                      .map((bm) => {
                        const isCurrent = selectedModelId === bm.id;
                        return (
                          <div
                            key={bm.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              isCurrent
                                ? darkMode
                                  ? 'bg-zinc-900 border-zinc-400'
                                  : 'bg-white border-slate-900'
                                : darkMode
                                ? 'bg-zinc-950 border-zinc-800'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div
                              onClick={() => onSelectModel(bm.id)}
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="font-medium truncate">
                                [{bm.providerLabel}] {bm.displayName}
                              </div>
                              <div
                                className={`text-[10px] font-mono ${
                                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                                }`}
                              >
                                ID: {bm.modelName} ·{' '}
                                {builtInPingResult[bm.id] || bm.badge}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={pingingBuiltInId === bm.id}
                              onClick={() => handlePingBuiltIn(bm.id)}
                              className={`px-2 py-1 rounded border text-[10px] font-mono shrink-0 cursor-pointer ${
                                darkMode
                                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pingingBuiltInId === bm.id ? '测速中...' : '测速'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div
                className={`p-4 rounded-xl border space-y-4 ${
                  darkMode
                    ? 'bg-zinc-900/60 border-zinc-800'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <h3 className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>短剧提示词与分镜生成偏好</span>
                </h3>

                <div
                  className={`flex items-center justify-between gap-4 py-2 border-b ${
                    darkMode ? 'border-zinc-800/70' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-medium">
                      纯提示词实跑模式（不调用出图接口）
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      开启后，分镜与资产合成仅通过大模型输出 Seedance 2.0/2.5、MiniMax H3 视频提示词与四视图资产提示词，提升全链路实跑速度
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={purePromptMode}
                    onChange={(e) => onTogglePurePromptMode(e.target.checked)}
                    className={`w-4 h-4 cursor-pointer ${
                      darkMode ? 'accent-zinc-100' : 'accent-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium block">
                    新建分镜默认激活视频提示词格式
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'seedance_2_0', label: 'Seedance 2.0 (6段式)' },
                        { id: 'seedance_2_5', label: 'Seedance 2.5 (7段式)' },
                        { id: 'minimax_h3', label: 'MiniMax H3 (括号)' },
                      ] as { id: VideoModelTarget; label: string }[]
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChangeDefaultVideoModel(item.id)}
                        className={`p-2 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                          defaultVideoModel === item.id
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                              : 'bg-slate-900 text-white border-slate-900'
                            : darkMode
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-4 ${
                  darkMode
                    ? 'bg-zinc-900/60 border-zinc-800'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <h3 className="font-semibold">无限画布视觉与连线设置</h3>

                <div
                  className={`flex items-center justify-between py-2 border-b ${
                    darkMode ? 'border-zinc-800/70' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-medium">
                      极简暗房监视模式 (Darkroom Mode)
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      切换 Zinc 暗色导演监视器主题或浅色纸张画布主题
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      darkMode
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700'
                        : 'bg-slate-200 border-slate-300 text-slate-900 hover:bg-slate-300'
                    }`}
                  >
                    {darkMode ? '当前：暗房模式' : '当前：浅色模式'}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">全局属性注入连线颜色</div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      自定义贝塞尔连线与流动光点颜色 ({edgeColor})
                    </p>
                  </div>
                  <input
                    type="color"
                    value={edgeColor}
                    onChange={(e) => onChangeEdgeColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
