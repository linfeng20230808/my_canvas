import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { CanvasNode, CanvasEdge, VideoModelTarget } from '../types/canvas';
import { CinematicArtRenderer } from './CinematicArtRenderer';

interface StoryboardPlayerModalProps {
  isOpen: boolean;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  darkMode: boolean;
  onClose: () => void;
  onRenderShot: (nodeId: string) => void;
}

export const StoryboardPlayerModal: React.FC<StoryboardPlayerModalProps> = ({
  isOpen,
  nodes,
  edges,
  darkMode,
  onClose,
  onRenderShot,
}) => {
  const storyboardNodes = nodes
    .filter((n) => n.type === 'storyboard')
    .sort((a, b) => a.position.x - b.position.x);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewVideoFormat, setPreviewVideoFormat] =
    useState<VideoModelTarget>('minimax_h3');

  useEffect(() => {
    if (!isPlaying || storyboardNodes.length === 0) return;
    const currentShot = storyboardNodes[currentIndex];
    const durationMs = (currentShot?.data.durationSec || 3.0) * 1000;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 >= storyboardNodes.length) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, storyboardNodes]);

  if (!isOpen) return null;

  const activeShot = storyboardNodes[currentIndex] || null;
  const totalDuration = storyboardNodes.reduce(
    (acc, n) => acc + (n.data.durationSec || 3.0),
    0
  );

  const getUpstreamNames = (shotId: string) => {
    const incomingIds = edges
      .filter((e) => e.targetNodeId === shotId)
      .map((e) => e.sourceNodeId);
    return nodes
      .filter((n) => incomingIds.includes(n.id))
      .map((n) => n.data.title);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6">
      <div
        className={`w-full max-w-5xl rounded-2xl border overflow-hidden shadow-2xl flex flex-col ${
          darkMode
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            darkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
          }`}
        >
          <div>
            <h2 className="text-base font-semibold">
              竖屏短剧动态分镜故事板预览 (Storyboard Animatic Preview)
            </h2>
            <p
              className={`text-xs font-mono tabular-nums mt-0.5 ${
                darkMode ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              共 {storyboardNodes.length} 个分镜镜头 · 总时长 {totalDuration.toFixed(1)}s
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              darkMode
                ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeShot ? (
          <div className="p-6 grid grid-cols-12 gap-6 items-center">
            <div className="col-span-5 flex flex-col items-center">
              <div className="w-[270px] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950">
                <CinematicArtRenderer
                  nodeType="storyboard"
                  data={activeShot.data}
                  upstreamAnchorCount={getUpstreamNames(activeShot.id).length}
                />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    darkMode
                      ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className={`px-5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>暂停连播</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>连续播放分镜</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(storyboardNodes.length - 1, i + 1)
                    )
                  }
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    darkMode
                      ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="col-span-7 space-y-4">
              <div className="space-y-1">
                <div
                  className={`text-xs font-mono tabular-nums ${
                    darkMode ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  {activeShot.data.shotNumber || `SHOT 0${currentIndex + 1}`} ·{' '}
                  {activeShot.data.aspectRatio || '9:16'} ·{' '}
                  {activeShot.data.shotSize} · {activeShot.data.cameraMove}
                </div>
                <h3 className="text-lg font-semibold">
                  {activeShot.data.title}
                </h3>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                  darkMode
                    ? 'bg-zinc-900/90 border-zinc-800 text-zinc-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>
                    镜头台词：
                  </span>
                  <span className="font-medium">
                    {activeShot.data.speakerName
                      ? `${activeShot.data.speakerName}：`
                      : ''}
                    {activeShot.data.dialogueSnippet || '（纯视觉情绪镜头）'}
                  </span>
                </div>
                <div>
                  <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>
                    已注入一致性锚点：
                  </span>
                  <span>
                    {getUpstreamNames(activeShot.id).join(' · ') || '独立镜头'}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>
                      视频大模型专属提示词：
                    </span>
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'minimax_h3', label: 'MiniMax H3' },
                          { id: 'seedance_2_0', label: 'Seedance 2.0' },
                          { id: 'seedance_2_5', label: 'Seedance 2.5' },
                        ] as const
                      ).map((vm) => (
                        <button
                          key={vm.id}
                          type="button"
                          onClick={() => setPreviewVideoFormat(vm.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                            previewVideoFormat === vm.id
                              ? darkMode
                                ? 'bg-zinc-100 text-zinc-950'
                                : 'bg-slate-900 text-white'
                              : darkMode
                              ? 'text-zinc-400 hover:text-zinc-100'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {vm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p
                    className={`font-mono text-[11px] leading-relaxed ${
                      darkMode ? 'text-zinc-200' : 'text-slate-600'
                    }`}
                  >
                    {activeShot.data.videoPrompts?.[previewVideoFormat] ||
                      activeShot.data.visualPrompt}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
                  分镜序列镜头轴 (点击切换)
                </span>
                <button
                  type="button"
                  onClick={() => onRenderShot(activeShot.id)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
                      : 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>重新渲染当前镜头</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {storyboardNodes.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIndex(idx);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      idx === currentIndex
                        ? darkMode
                          ? 'border-zinc-200 bg-zinc-900 text-zinc-100'
                          : 'border-slate-900 bg-slate-100 text-slate-900'
                        : darkMode
                        ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-mono tabular-nums font-semibold">
                      {shot.data.shotNumber || `SHOT 0${idx + 1}`} ·{' '}
                      {shot.data.durationSec || 3.0}s
                    </div>
                    <div className="text-xs font-medium truncate mt-0.5">
                      {shot.data.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-12 text-center text-sm ${
              darkMode ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            当前画布暂无视觉分镜节点，请先在画布或通过全能 Agent 生成分镜。
          </div>
        )}
      </div>
    </div>
  );
};
