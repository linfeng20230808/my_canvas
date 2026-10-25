import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Film,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  X,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';
import { CanvasNodeData } from '../types/canvas';

interface CinematicArtProps {
  nodeType: 'character' | 'scene_asset' | 'storyboard';
  data: CanvasNodeData;
  upstreamAnchorCount?: number;
  compact?: boolean;
  onPreviewImage?: (url: string, title: string) => void;
}

/**
 * Clean Darkroom Media Viewport for Image & Video Nodes (Zero Fake Mock Drawings).
 * - Displays real generated video (<video>) when `data.generatedVideoUrl` is present.
 * - Displays real generated image (<img>) when `data.generatedImageUrl` or `data.firstFrameImageUrl` is present.
 * - Supports double-clicking any image to open a full-screen high-resolution Lightbox viewer (via React Portal).
 * - Displays live generation progress when `data.isGeneratingImage`, `data.isGeneratingVideo`, or `data.videoStatus === 'running'`.
 */
export const CinematicArtRenderer: React.FC<CinematicArtProps> = ({
  nodeType,
  data,
  upstreamAnchorCount = 0,
  compact = false,
  onPreviewImage,
}) => {
  const isVertical = (data.aspectRatio || '9:16') === '9:16';
  const heightClass =
    nodeType === 'character'
      ? 'h-40'
      : nodeType === 'scene_asset'
      ? 'h-36'
      : compact
      ? 'h-44'
      : isVertical
      ? 'h-64'
      : 'h-40';

  const activeImageUrl = data.generatedImageUrl || data.firstFrameImageUrl;
  const activeVideoUrl = data.generatedVideoUrl;
  const isVideoRunning =
    data.isGeneratingVideo || data.videoStatus === 'running';
  const isImageRunning = Boolean(data.isGeneratingImage);

  // Full-Screen Lightbox State (rendered via Portal to document.body so canvas transform never clips it)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [copiedUrl, setCopiedUrl] = useState(false);

  const openLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!activeImageUrl) return;
    if (onPreviewImage) {
      onPreviewImage(activeImageUrl, data.title);
    }
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))));
      } else if (e.key === '-') {
        setLightboxZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
      } else if (e.key === '0') {
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const handleCopyImageUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeImageUrl) return;
    navigator.clipboard.writeText(activeImageUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  return (
    <>
      <div
        onDoubleClick={(e) => {
          if (activeImageUrl) {
            openLightbox(e);
          }
        }}
        className={`relative w-full ${heightClass} rounded-xl overflow-hidden bg-[#09090B] border border-zinc-800/90 select-none group ${
          activeImageUrl && !activeVideoUrl ? 'cursor-zoom-in' : ''
        }`}
        title={
          activeImageUrl
            ? '双击图片查看高清大图'
            : undefined
        }
      >
        {/* 1. Real Generated Video Player */}
        {activeVideoUrl ? (
          <video
            src={activeVideoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              if (activeImageUrl) {
                openLightbox(e);
              }
            }}
            className="w-full h-full object-cover bg-black"
          />
        ) : activeImageUrl ? (
          /* 2. Real Generated Image (Character 4-View / Scene Anchor / Storyboard Keyframe) */
          <img
            src={activeImageUrl}
            alt={data.title}
            referrerPolicy="no-referrer"
            onDoubleClick={openLightbox}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          /* 3. Clean Technical Viewfinder Grid (No Fake Mock Silhouettes) */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 relative bg-gradient-to-b from-zinc-950 via-zinc-900/70 to-zinc-950">
            {/* Corner Viewfinder Brackets */}
            <div className="absolute inset-2.5 pointer-events-none border border-zinc-800/70 rounded-lg">
              <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-zinc-500" />
              <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-zinc-500" />
              <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-zinc-500" />
              <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-zinc-500" />
            </div>

            <div className="flex flex-col items-center text-center gap-1.5 z-10 max-w-[90%]">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                {nodeType === 'storyboard' ? (
                  <Film className="w-4 h-4 text-amber-400/90" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-sky-400/90" />
                )}
              </div>
              <div className="text-[11px] font-mono text-zinc-300 font-medium">
                {nodeType === 'character'
                  ? '角色四视图定妆锚点 (@Image)'
                  : nodeType === 'scene_asset'
                  ? '场景/载具空间锚点 (@Image)'
                  : `${data.shotNumber || 'SHOT'} · ${data.aspectRatio || '9:16'} 视频分镜`}
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
                {data.consistencyPrompt || data.visualPrompt
                  ? '提示词已就绪 · 单击节点在下方点击「生成图片」或「生成视频」'
                  : '单击节点弹出生成框，输入或合成提示词后即可真实出图/出视频'}
              </p>
            </div>
          </div>
        )}

        {/* Top-Left Status & Style Preset Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-10 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs border border-zinc-700/80 text-[9px] font-mono text-zinc-200">
            {data.aspectRatio || (nodeType === 'storyboard' ? '9:16' : '16:9')}
          </span>
          {data.stylePresetName && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/85 border border-amber-700/70 text-[9px] font-mono text-amber-300 truncate max-w-[140px]">
              {data.stylePresetName}
            </span>
          )}
          {activeVideoUrl && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-700/80 text-[9px] font-mono text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>已生成视频</span>
            </span>
          )}
          {!activeVideoUrl && activeImageUrl && (
            <span className="px-1.5 py-0.5 rounded bg-sky-950/90 border border-sky-700/80 text-[9px] font-mono text-sky-300 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{nodeType === 'storyboard' ? '首帧图已就绪' : '定妆图已生成'}</span>
            </span>
          )}
        </div>

        {/* Top-Right Hover Hint & Quick Zoom Button for Images */}
        {activeImageUrl && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={openLightbox}
            title="双击画面或点击此按钮查看高清大图"
            className="absolute top-2 right-2 z-20 px-2 py-1 rounded-lg bg-black/80 hover:bg-black border border-zinc-700/90 text-[10px] font-mono text-zinc-200 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
          >
            <Maximize2 className="w-3 h-3 text-sky-400" />
            <span>双击看大图</span>
          </button>
        )}

        {/* Live Generation Progress Overlay */}
        {(isImageRunning || isVideoRunning || data.isRendering) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-4 z-20 text-center">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            <div className="text-xs font-semibold text-zinc-100">
              {isVideoRunning
                ? `正在生成真实视频 (${data.videoProgress ?? 5}%)...`
                : isImageRunning
                ? '正在调用绘图引擎生成实拍图...'
                : '正在调用大模型合成三套提示词...'}
            </div>
            {isVideoRunning && (
              <div className="w-40 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.max(5, data.videoProgress || 5)}%` }}
                />
              </div>
            )}
            <span className="text-[10px] font-mono text-zinc-400">
              {isVideoRunning
                ? data.videoGenModelId || 'minimax-h3'
                : isImageRunning
                ? data.imageModelId || 'nano-banana-fast'
                : 'AI Director Engine'}
            </span>
          </div>
        )}

        {/* Video Error Banner if Failed */}
        {data.videoStatus === 'failed' && data.videoError && !isVideoRunning && (
          <div className="absolute inset-x-2 top-9 px-2.5 py-1.5 rounded-lg bg-red-950/90 border border-red-800 text-[10px] text-red-200 z-10 line-clamp-2">
            生成异常：{data.videoError}
          </div>
        )}

        {/* Bottom Scrim with Shot Metadata & Anchor Count (Hidden when playing video controls) */}
        {!activeVideoUrl && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-2.5 pt-6 flex flex-col gap-0.5 pointer-events-none">
            {data.dialogueSnippet && (
              <p className="text-[11px] leading-snug text-zinc-100 font-medium line-clamp-1 drop-shadow">
                {data.speakerName ? `${data.speakerName}：` : ''}
                {data.dialogueSnippet}
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono tabular-nums">
              <span className="truncate">
                {nodeType === 'storyboard'
                  ? `${data.shotSize || '特写 CU'} · ${data.cameraMove || '[Push in]'} · ${
                      data.durationSec ?? 4
                    }s`
                  : data.roleType || data.subtitle || '一致性资产锚点'}
              </span>
              <span className="shrink-0 ml-2 flex items-center gap-1">
                {upstreamAnchorCount > 0 ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>{upstreamAnchorCount} 锚点</span>
                  </>
                ) : (
                  <span>独立节点</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Portal High-Resolution Image Lightbox Modal */}
      {isLightboxOpen &&
        activeImageUrl &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setIsLightboxOpen(false);
              }
            }}
            onWheel={(e) => {
              e.stopPropagation();
              const delta = e.deltaY < 0 ? 0.18 : -0.18;
              setLightboxZoom((z) =>
                Math.min(4, Math.max(0.5, Number((z + delta).toFixed(2))))
              );
            }}
            className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150"
          >
            {/* Top Lightbox Header */}
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="h-14 px-6 border-b border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between gap-4 shrink-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[11px] font-mono">
                  {nodeType === 'character'
                    ? '角色四视图定妆图'
                    : nodeType === 'scene_asset'
                    ? '场景/载具资产图'
                    : `${data.shotNumber || 'SHOT'} 首帧画面`}
                </span>
                <h3 className="text-sm font-semibold text-zinc-100 truncate">
                  {data.title}
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  画幅 {data.aspectRatio || (nodeType === 'storyboard' ? '9:16' : '16:9')}
                </span>
              </div>

              {/* Zoom & Download Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxZoom((z) =>
                        Math.max(0.5, Number((z - 0.25).toFixed(2)))
                      )
                    }
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    title="缩小 (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center tabular-nums">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxZoom((z) =>
                        Math.min(4, Number((z + 0.25).toFixed(2)))
                      )
                    }
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    title="放大 (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxZoom(1);
                      setLightboxPan({ x: 0, y: 0 });
                    }}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer ml-0.5"
                    title="重置 100% 视图 (0)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyImageUrl}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已复制链接</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制图片直链</span>
                    </>
                  )}
                </button>

                <a
                  href={activeImageUrl}
                  download={`${data.title.replace(/\s+/g, '_')}.jpeg`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载原图</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                  title="关闭大图预览 (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center Interactive Zoom & Pan Canvas */}
            <div
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setIsLightboxOpen(false);
                  return;
                }
                setIsDraggingImage(true);
                setDragOrigin({
                  x: e.clientX - lightboxPan.x,
                  y: e.clientY - lightboxPan.y,
                });
              }}
              onMouseMove={(e) => {
                if (!isDraggingImage) return;
                setLightboxPan({
                  x: e.clientX - dragOrigin.x,
                  y: e.clientY - dragOrigin.y,
                });
              }}
              onMouseUp={() => setIsDraggingImage(false)}
              onMouseLeave={() => setIsDraggingImage(false)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (lightboxZoom > 1.05) {
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                } else {
                  setLightboxZoom(2);
                }
              }}
              className="flex-1 flex items-center justify-center overflow-hidden p-8 cursor-grab active:cursor-grabbing"
            >
              <img
                src={activeImageUrl}
                alt={data.title}
                referrerPolicy="no-referrer"
                draggable={false}
                style={{
                  transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})`,
                  transition: isDraggingImage ? 'none' : 'transform 120ms ease-out',
                }}
                className="max-h-[78vh] max-w-[88vw] object-contain rounded-xl shadow-2xl border border-zinc-800"
              />
            </div>

            {/* Bottom Prompt Metadata Footer */}
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between gap-4 text-xs text-zinc-400 shrink-0"
            >
              <div className="truncate font-mono text-[11px] text-zinc-300">
                <span className="text-amber-400 font-semibold mr-2">Prompt:</span>
                {data.consistencyPrompt || data.visualPrompt || data.subtitle || data.title}
              </div>
              <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                滚轮缩放 · 拖拽平移 · 双击切换 200% 放大 · 按 Esc 退出
              </span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
