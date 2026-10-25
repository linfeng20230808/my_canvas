import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Image as ImageIcon,
  Film,
  FileText,
  UserCheck,
  Play,
  ShieldCheck,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { CanvasNode, CanvasEdge } from '../types/canvas';

interface DramaWorkflowModalProps {
  isOpen: boolean;
  darkMode: boolean;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onClose: () => void;
  onSynthesizeAllPrompts: () => void;
  onBatchGenerateAssetImages: () => void;
  onBatchGenerateStoryboardImages: () => void;
  onOpenStoryboardPlayer: () => void;
  onFocusNode: (nodeId: string) => void;
}

export const DramaWorkflowModal: React.FC<DramaWorkflowModalProps> = ({
  isOpen,
  darkMode,
  nodes,
  edges,
  onClose,
  onSynthesizeAllPrompts,
  onBatchGenerateAssetImages,
  onBatchGenerateStoryboardImages,
  onOpenStoryboardPlayer,
  onFocusNode,
}) => {
  if (!isOpen) return null;

  const scriptNodes = nodes.filter(
    (n) => n.type === 'script' || n.type === 'text_note'
  );
  const assetNodes = nodes.filter(
    (n) => n.type === 'character' || n.type === 'scene_asset'
  );
  const storyboardNodes = nodes.filter(
    (n) => n.type === 'storyboard' || n.type === 'video_clip'
  );
  const assetsWithImages = assetNodes.filter((n) =>
    Boolean(n.data.generatedImageUrl || n.data.firstFrameImageUrl)
  );
  const shotsWithPrompts = storyboardNodes.filter((n) =>
    Boolean(
      n.data.visualPrompt ||
        n.data.videoPrompts?.seedance_2_0 ||
        n.data.videoPrompts?.minimax_h3
    )
  );
  const shotsWithImages = storyboardNodes.filter((n) =>
    Boolean(n.data.generatedImageUrl || n.data.firstFrameImageUrl)
  );
  const shotsWithVideos = storyboardNodes.filter((n) =>
    Boolean(n.data.generatedVideoUrl)
  );

  // 4-Gate Quality Audit (漫剧老李 & GitHub Short-Drama QA Gate)
  const qaAuditResults = storyboardNodes.map((shot) => {
    const incomingAssetEdges = edges.filter(
      (e) =>
        e.targetNodeId === shot.id &&
        (e.relationType === 'character_ref' || e.relationType === 'scene_ref')
    );
    const fullPrompt = `${shot.data.visualPrompt || ''} ${
      shot.data.videoPrompts?.seedance_2_0 || ''
    } ${shot.data.videoPrompts?.seedance_2_5 || ''} ${
      shot.data.videoPrompts?.minimax_h3 || ''
    }`;

    const hasAnchorConnection = incomingAssetEdges.length > 0;
    const hasAxisLock =
      fullPrompt.includes('180') ||
      fullPrompt.includes('轴线') ||
      fullPrompt.includes('Position_Lock') ||
      fullPrompt.includes('站位');
    const hasFacsOrAction =
      fullPrompt.includes('FACS') ||
      fullPrompt.includes('AU') ||
      fullPrompt.includes('微表情') ||
      fullPrompt.includes('七态') ||
      fullPrompt.includes('At 00:');
    const hasMedia = Boolean(
      shot.data.generatedVideoUrl ||
        shot.data.generatedImageUrl ||
        shot.data.firstFrameImageUrl
    );

    return {
      node: shot,
      hasAnchorConnection,
      hasAxisLock,
      hasFacsOrAction,
      hasMedia,
      passCount: [
        hasAnchorConnection,
        hasAxisLock,
        hasFacsOrAction,
        hasMedia,
      ].filter(Boolean).length,
    };
  });

  const stages = [
    {
      step: '01',
      title: '剧本与黄金3秒拆解',
      subtitle: 'Novel / Script Breakdown',
      icon: FileText,
      stat: `${scriptNodes.length} 个剧本/文案节点`,
      ready: scriptNodes.length > 0,
      desc: '导入或编写分场剧本，提炼开篇 0-3 秒强冲突钩子与结尾断章反转点，双击或从剧本节点一键拆解下游分镜。',
      actionLabel: null,
      onAction: undefined,
    },
    {
      step: '02',
      title: '角色四视图与场景定妆出图',
      subtitle: 'Character & Scene Asset Lock (@Image1/@Image2)',
      icon: UserCheck,
      stat: `${assetsWithImages.length} / ${assetNodes.length} 已生成定妆图`,
      ready: assetNodes.length > 0 && assetsWithImages.length === assetNodes.length,
      desc: '调用 GRSAI Nano Banana 2.1 / Fast 生成角色四视图与场景锚点图，作为下游图生图、图生视频的一致性参考源。',
      actionLabel:
        assetNodes.length > 0 ? '批量生成资产定妆图' : null,
      onAction: onBatchGenerateAssetImages,
    },
    {
      step: '03',
      title: '分镜提示词与轴线编译',
      subtitle: 'Seedance 2.0/2.5 & MiniMax H3 Prompt Synthesis',
      icon: Sparkles,
      stat: `${shotsWithPrompts.length} / ${storyboardNodes.length} 已合成提示词`,
      ready:
        storyboardNodes.length > 0 &&
        shotsWithPrompts.length === storyboardNodes.length,
      desc: '自动继承上游角色与场景锚点，同步合成 Seedance 2.0 六段式、Seedance 2.5 四模态与 MiniMax H3 括号运镜提示词。',
      actionLabel:
        storyboardNodes.length > 0 ? '批量合成全部分镜提示词' : null,
      onAction: onSynthesizeAllPrompts,
    },
    {
      step: '04',
      title: '分镜首帧图渲染 (First-Frame)',
      subtitle: 'Keyframe Image Generation with Reference Injection',
      icon: ImageIcon,
      stat: `${shotsWithImages.length} / ${storyboardNodes.length} 已生成首帧图`,
      ready:
        storyboardNodes.length > 0 &&
        shotsWithImages.length === storyboardNodes.length,
      desc: '自动携带上游已出图的角色/场景定妆图 URL 作为参考图 (Reference Images)，为每个分镜渲染高一致性首帧画面。',
      actionLabel:
        storyboardNodes.length > 0 ? '批量生成分镜首帧图' : null,
      onAction: onBatchGenerateStoryboardImages,
    },
    {
      step: '05',
      title: '图生视频 (I2V) 与动态合成',
      subtitle: 'MiniMax H3 / Agnes Video 2.5 Generation',
      icon: Film,
      stat: `${shotsWithVideos.length} / ${storyboardNodes.length} 已生成视频`,
      ready: shotsWithVideos.length > 0,
      desc: '在任意分镜节点的底部生成框点击「生成视频」，系统自动将首帧图与结构化运镜词提交至视频引擎并实时轮询进度。',
      actionLabel: null,
      onAction: undefined,
    },
    {
      step: '06',
      title: '多角色 TTS 配音与成片连播',
      subtitle: 'Voiceover Synthesis & Animatic Timeline Preview',
      icon: Play,
      stat: `${storyboardNodes.length} 镜竖屏连播就绪`,
      ready: storyboardNodes.length > 0,
      desc: '在竖屏故事板播放器中按序连播全部已生成的视频与分镜首帧，并开启实时 TTS 角色对白配音预演全片节奏。',
      actionLabel:
        storyboardNodes.length > 0 ? '打开竖屏故事板连播' : null,
      onAction: () => {
        onClose();
        onOpenStoryboardPlayer();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-5xl max-h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          darkMode
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
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
                  ? 'bg-zinc-900 border-zinc-700 text-amber-400'
                  : 'bg-slate-900 border-slate-900 text-amber-400'
              }`}
            >
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                AI 短剧全链路工业流水线 & 漫剧老李四道质检中心
              </h2>
              <p
                className={`text-xs ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                融合 GitHub 开源短剧工作流 (LocalMiniDrama / Dramake / 漫剧老李 / ComfyUI-StoryBoard) 标准 6 阶生产管线
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: 6-Stage Pipeline Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold flex items-center gap-2">
                <span>一、AI 短剧 6 阶标准工业管线进度</span>
              </h3>
              <span
                className={`text-[11px] font-mono ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                剧本拆解 → 角色定妆图 → 分镜编译 → 首帧渲染 → 图生视频(I2V) → 配音连播
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {stages.map((st) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.step}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      darkMode
                        ? 'bg-zinc-900/60 border-zinc-800'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          STAGE {st.step}
                        </span>
                        <span
                          className={`text-[10px] font-mono flex items-center gap-1 ${
                            st.ready ? 'text-emerald-400' : 'text-zinc-400'
                          }`}
                        >
                          {st.ready && <CheckCircle2 className="w-3 h-3" />}
                          <span>{st.stat}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-zinc-300 shrink-0" />
                        <h4 className="text-xs font-bold">{st.title}</h4>
                      </div>

                      <p
                        className={`text-[11px] leading-relaxed ${
                          darkMode ? 'text-zinc-400' : 'text-slate-600'
                        }`}
                      >
                        {st.desc}
                      </p>
                    </div>

                    {st.actionLabel && st.onAction && (
                      <button
                        type="button"
                        onClick={st.onAction}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          darkMode
                            ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{st.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: 4-Gate Director Quality Audit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>二、漫剧老李 · 分镜四道质检锁实时扫描 ({storyboardNodes.length} 个分镜)</span>
              </h3>
              <span
                className={`text-[11px] ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                点击任意分镜行可直接定位至画布对应节点进行修正或出图
              </span>
            </div>

            {qaAuditResults.length === 0 ? (
              <div
                className={`p-8 rounded-xl border text-center text-xs ${
                  darkMode
                    ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                当前画布暂无分镜节点。请先在画布右键新建节点，或在右侧 Agent 面板输入剧本自动生成分镜。
              </div>
            ) : (
              <div
                className={`rounded-xl border overflow-hidden text-xs ${
                  darkMode ? 'border-zinc-800' : 'border-slate-200'
                }`}
              >
                <div
                  className={`grid grid-cols-12 px-4 py-2.5 font-mono text-[11px] font-semibold border-b ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="col-span-3">分镜节点</span>
                  <span className="col-span-2">① 资产锚点连线</span>
                  <span className="col-span-2">② 180°轴线站位</span>
                  <span className="col-span-2">③ FACS/动作七态</span>
                  <span className="col-span-2">④ 首帧图/视频</span>
                  <span className="col-span-1 text-right">得分</span>
                </div>

                {qaAuditResults.map((item) => (
                  <div
                    key={item.node.id}
                    onClick={() => {
                      onFocusNode(item.node.id);
                      onClose();
                    }}
                    className={`grid grid-cols-12 px-4 py-2.5 items-center border-b last:border-b-0 cursor-pointer transition-colors ${
                      darkMode
                        ? 'bg-zinc-950 hover:bg-zinc-900 border-zinc-900'
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="col-span-3 truncate font-medium pr-2">
                      <span className="font-mono text-amber-400 mr-1.5">
                        {item.node.data.shotNumber || 'SHOT'}
                      </span>
                      <span>{item.node.data.title}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1 text-[11px]">
                      {item.hasAnchorConnection ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已连线注入
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 未连角色锚点
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center gap-1 text-[11px]">
                      {item.hasAxisLock ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 轴线已锁定
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 缺轴线声明
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center gap-1 text-[11px]">
                      {item.hasFacsOrAction ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 细节已拆格
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 建议补充FACS
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center gap-1 text-[11px]">
                      {item.node.data.generatedVideoUrl ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已出视频
                        </span>
                      ) : item.hasMedia ? (
                        <span className="text-sky-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已出首帧图
                        </span>
                      ) : (
                        <span className="text-zinc-500">待渲染媒体</span>
                      )}
                    </div>

                    <div className="col-span-1 text-right font-mono font-bold">
                      {item.passCount}/4
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
