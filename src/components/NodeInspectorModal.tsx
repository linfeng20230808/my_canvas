import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Save,
  Link2,
  Copy,
  Check,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import {
  CanvasNode,
  ShotAspectRatio,
  VideoModelTarget,
} from '../types/canvas';
import { CinematicArtRenderer } from './CinematicArtRenderer';

interface NodeInspectorModalProps {
  node: CanvasNode | null;
  upstreamNodes: CanvasNode[];
  darkMode: boolean;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updatedData: CanvasNode['data']) => void;
  onRenderStoryboardNode: (nodeId: string) => void;
  onGenerateNodeImage: (nodeId: string, imageModel?: string) => void;
  onGenerateNodeVideo: (nodeId: string, videoModel?: string) => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  upstreamNodes,
  darkMode,
  onClose,
  onUpdateNode,
  onRenderStoryboardNode,
  onGenerateNodeImage,
  onGenerateNodeVideo,
}) => {
  const [formData, setFormData] = useState<CanvasNode['data'] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setFormData({ ...node.data });
    } else {
      setFormData(null);
    }
  }, [node]);

  if (!node || !formData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNode(node.id, formData);
    onClose();
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-xs transition-colors focus:outline-none ${
    darkMode
      ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-300'
      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900'
  }`;

  const optionClass = darkMode
    ? 'bg-zinc-900 text-zinc-100'
    : 'bg-white text-slate-900';

  const activeVideoModel: VideoModelTarget =
    formData.videoModelTarget || 'minimax_h3';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-end">
      <div
        className={`w-full max-w-xl h-full border-l flex flex-col shadow-2xl ${
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
            <h2 className="text-sm font-semibold">
              节点参数与图片/视频生成器 (Node Inspector)
            </h2>
            <p
              className={`text-xs font-mono mt-0.5 ${
                darkMode ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              ID: {node.id} · TYPE: {node.type.toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              darkMode
                ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
        >
          {(node.type === 'character' ||
            node.type === 'scene_asset' ||
            node.type === 'storyboard' ||
            node.type === 'video_clip') && (
            <div className="space-y-2.5">
              <CinematicArtRenderer
                nodeType={
                  node.type === 'video_clip' ? 'storyboard' : node.type
                }
                data={node.data}
                upstreamAnchorCount={upstreamNodes.length}
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={node.data.isRendering}
                  onClick={() => onRenderStoryboardNode(node.id)}
                  className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    darkMode
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
                      : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{node.data.isRendering ? '合成中...' : '合成提示词'}</span>
                </button>

                <button
                  type="button"
                  disabled={Boolean(node.data.isGeneratingImage)}
                  onClick={() =>
                    onGenerateNodeImage(
                      node.id,
                      formData.imageModelId || 'nano-banana-fast'
                    )
                  }
                  className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    node.type === 'storyboard' || node.type === 'video_clip'
                      ? darkMode
                        ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300 hover:bg-sky-500/30'
                        : 'bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100'
                      : darkMode
                      ? 'bg-zinc-100 text-zinc-950 hover:bg-white col-span-2'
                      : 'bg-slate-900 text-white hover:bg-slate-800 col-span-2'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    {node.data.isGeneratingImage
                      ? '绘制中...'
                      : node.type === 'storyboard' || node.type === 'video_clip'
                      ? '生成首帧图'
                      : '生成实拍定妆图'}
                  </span>
                </button>

                {(node.type === 'storyboard' || node.type === 'video_clip') && (
                  <button
                    type="button"
                    disabled={
                      Boolean(node.data.isGeneratingVideo) ||
                      node.data.videoStatus === 'running'
                    }
                    onClick={() =>
                      onGenerateNodeVideo(
                        node.id,
                        formData.videoGenModelId || 'minimax-h3'
                      )
                    }
                    className={`py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                      darkMode
                        ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>
                      {node.data.isGeneratingVideo ||
                      node.data.videoStatus === 'running'
                        ? `生成视频 (${node.data.videoProgress ?? 5}%)`
                        : '生成视频'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upstream Inherited Consistency Anchors */}
          <div
            className={`p-3.5 rounded-xl border space-y-1.5 ${
              darkMode
                ? 'border-zinc-800 bg-zinc-900/80'
                : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                darkMode ? 'text-zinc-100' : 'text-slate-700'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>已注入的上游多模态一致性锚点 ({upstreamNodes.length})</span>
            </div>
            {upstreamNodes.length > 0 ? (
              <div className="space-y-1 pt-1">
                {upstreamNodes.map((up, i) => (
                  <div
                    key={up.id}
                    className={`text-[11px] ${
                      darkMode ? 'text-zinc-300' : 'text-slate-600'
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        darkMode ? 'text-zinc-100' : 'text-slate-800'
                      }`}
                    >
                      [@Image{i + 1}] {up.data.title}
                    </span>
                    ：{up.data.consistencyPrompt || up.data.hookPoint || up.data.subtitle}
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                当前节点暂无上游输入连线。可在画布上从角色或剧本节点的右侧端口拖线至此节点。
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label
                className={`block font-medium mb-1 ${
                  darkMode ? 'text-zinc-300' : 'text-slate-600'
                }`}
              >
                节点标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="col-span-2">
              <label
                className={`block font-medium mb-1 ${
                  darkMode ? 'text-zinc-300' : 'text-slate-600'
                }`}
              >
                副标题 / 场次镜头定位
              </label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          {(node.type === 'character' || node.type === 'scene_asset') && (
            <>
              <div>
                <label
                  className={`block font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  跨镜头一致性锁脸 / 空间锚点词 (Consistency Anchor Prompt)
                </label>
                <textarea
                  rows={3}
                  value={formData.consistencyPrompt || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consistencyPrompt: e.target.value,
                    })
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label
                  className={`block font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  标志性服化道与细节特征
                </label>
                <input
                  type="text"
                  value={formData.costumeDetails || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, costumeDetails: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </>
          )}

          {node.type === 'script' && (
            <>
              <div>
                <label
                  className={`block font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  黄金前3秒爽点钩子 (Hook Point)
                </label>
                <textarea
                  rows={2}
                  value={formData.hookPoint || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, hookPoint: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  className={`block font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  分场剧本正文
                </label>
                <textarea
                  rows={4}
                  value={formData.scriptBody || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, scriptBody: e.target.value })
                  }
                  className={`${inputClass} leading-relaxed`}
                />
              </div>
              <div>
                <label
                  className={`block font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  本场情绪反转留钩 (Reversal Point)
                </label>
                <input
                  type="text"
                  value={formData.reversalPoint || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, reversalPoint: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </>
          )}

          {node.type === 'storyboard' && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label
                    className={`block font-medium mb-1 ${
                      darkMode ? 'text-zinc-300' : 'text-slate-600'
                    }`}
                  >
                    画幅比例
                  </label>
                  <select
                    value={formData.aspectRatio || '9:16'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aspectRatio: e.target.value as ShotAspectRatio,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="9:16" className={optionClass}>
                      竖屏短剧 9:16
                    </option>
                    <option value="16:9" className={optionClass}>
                      横屏漫剧 16:9
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    className={`block font-medium mb-1 ${
                      darkMode ? 'text-zinc-300' : 'text-slate-600'
                    }`}
                  >
                    景别 (Shot Size)
                  </label>
                  <input
                    type="text"
                    value={formData.shotSize || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, shotSize: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    className={`block font-medium mb-1 ${
                      darkMode ? 'text-zinc-300' : 'text-slate-600'
                    }`}
                  >
                    运镜括号指令
                  </label>
                  <input
                    type="text"
                    value={formData.cameraMove || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, cameraMove: e.target.value })
                    }
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-600'
                  }`}
                >
                  绑定角色台词 (@Audio1 音画卡点)
                </label>
                <input
                  type="text"
                  value={formData.dialogueSnippet || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dialogueSnippet: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              {/* Three Specialized Video Model Prompt Formats */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  darkMode
                    ? 'border-zinc-800 bg-zinc-900/80'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    三大视频大模型专属提示词格式
                  </span>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'minimax_h3', label: 'MiniMax H3' },
                        { id: 'seedance_2_0', label: 'Seedance 2.0' },
                        { id: 'seedance_2_5', label: 'Seedance 2.5' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            videoModelTarget: m.id,
                            visualPrompt:
                              formData.videoPrompts?.[m.id] ||
                              formData.visualPrompt,
                          })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          activeVideoModel === m.id
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-950'
                              : 'bg-slate-900 text-white'
                            : darkMode
                            ? 'text-zinc-400 hover:text-zinc-100'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. MiniMax H3 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={darkMode ? 'text-zinc-200' : 'text-slate-700'}>
                      1. MiniMax H3 (海螺 Director)：`[运镜括号] + Subject_Lock + 毫秒时间轴`
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'h3',
                          formData.videoPrompts?.minimax_h3 || formData.visualPrompt || ''
                        )
                      }
                      className={`px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                        darkMode
                          ? 'bg-zinc-950 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedKey === 'h3' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>复制</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={
                      formData.videoPrompts?.minimax_h3 || formData.visualPrompt || ''
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        videoPrompts: {
                          ...formData.videoPrompts,
                          minimax_h3: e.target.value,
                        },
                      })
                    }
                    className={`${inputClass} font-mono text-[11px]`}
                  />
                </div>

                {/* 2. Seedance 2.0 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={darkMode ? 'text-zinc-200' : 'text-slate-700'}>
                      2. Seedance 2.0 (6段式公式)：`[Subject (@Image1)] + [Action] + in [Env (@Image2)]`
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          's20',
                          formData.videoPrompts?.seedance_2_0 || ''
                        )
                      }
                      className={`px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                        darkMode
                          ? 'bg-zinc-950 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedKey === 's20' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>复制</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.videoPrompts?.seedance_2_0 || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        videoPrompts: {
                          ...formData.videoPrompts,
                          seedance_2_0: e.target.value,
                        },
                      })
                    }
                    className={`${inputClass} font-mono text-[11px]`}
                  />
                </div>

                {/* 3. Seedance 2.5 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={darkMode ? 'text-zinc-200' : 'text-slate-700'}>
                      3. Seedance 2.5 (四模态时间轴)：`Refs: [@Image/@Audio] | Shot 1 → Shot 2`
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          's25',
                          formData.videoPrompts?.seedance_2_5 || ''
                        )
                      }
                      className={`px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                        darkMode
                          ? 'bg-zinc-950 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedKey === 's25' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>复制</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.videoPrompts?.seedance_2_5 || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        videoPrompts: {
                          ...formData.videoPrompts,
                          seedance_2_5: e.target.value,
                        },
                      })
                    }
                    className={`${inputClass} font-mono text-[11px]`}
                  />
                </div>
              </div>
            </>
          )}

          <div
            className={`pt-3 border-t flex items-center justify-end gap-2 ${
              darkMode ? 'border-zinc-800' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                darkMode
                  ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存节点修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
