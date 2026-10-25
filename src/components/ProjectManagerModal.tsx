import React, { useState } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Film,
  Layers,
  RotateCcw,
  Pencil,
  ArrowUpRight,
} from 'lucide-react';
import {
  CanvasProject,
  ProjectTemplate,
  ShotAspectRatio,
} from '../types/canvas';

interface ProjectManagerModalProps {
  isOpen: boolean;
  darkMode: boolean;
  projects: CanvasProject[];
  activeProjectId: string;
  templates: ProjectTemplate[];
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (params: {
    name: string;
    episodeTitle: string;
    description: string;
    genreTag: string;
    aspectRatio: ShotAspectRatio;
    sourceTemplateId: string; // 'blank' | 'starter' | template.id
  }) => void;
  onDuplicateProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string, newEpisode: string) => void;
  onDeleteProject: (projectId: string) => void;
  onResetDefaultProjects: () => void;
}

const GENRE_TAGS = [
  '末日公路求生',
  '赛博悬疑短剧',
  '都市豪门逆袭',
  '古风玄幻修真',
  '科幻机甲漫剧',
  '无限流规则怪谈',
];

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  darkMode,
  projects,
  activeProjectId,
  templates,
  onClose,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  onResetDefaultProjects,
}) => {
  const [name, setName] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('EP01 · 第一集开篇黄金3秒');
  const [genreTag, setGenreTag] = useState(GENRE_TAGS[0]);
  const [aspectRatio, setAspectRatio] = useState<ShotAspectRatio>('9:16');
  const [sourceTemplateId, setSourceTemplateId] = useState<string>('starter');
  const [description, setDescription] = useState('');

  // Inline Delete Confirmation & Rename state (no window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [editEpisodeVal, setEditEpisodeVal] = useState('');

  if (!isOpen) return null;

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      name.trim() || `未命名短剧画布 #${projects.length + 1}`;
    const finalDesc =
      description.trim() ||
      (sourceTemplateId === 'blank'
        ? '纯净空白无限画布，可通过右键菜单或连线自由创建资产与分镜节点。'
        : sourceTemplateId === 'starter'
        ? '包含初始 @Image1 角色锚点、黄金前3秒剧本与 SHOT 01 竖屏分镜的基础拓扑画布。'
        : '基于内置实跑短剧模板克隆创建的独立画布工程。');

    onCreateProject({
      name: finalName,
      episodeTitle: episodeTitle.trim() || 'EP01 · 第一集',
      description: finalDesc,
      genreTag,
      aspectRatio,
      sourceTemplateId,
    });

    setName('');
    setDescription('');
  };

  const startEditing = (proj: CanvasProject) => {
    setEditingId(proj.id);
    setEditNameVal(proj.name);
    setEditEpisodeVal(proj.episodeTitle);
  };

  const saveEditing = (projId: string) => {
    if (editNameVal.trim()) {
      onRenameProject(
        projId,
        editNameVal.trim(),
        editEpisodeVal.trim() || 'EP01'
      );
    }
    setEditingId(null);
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-xs transition-colors focus:outline-none ${
    darkMode
      ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400'
      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900'
  }`;

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
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                AI 短剧无限画布 · 项目管理中心 (Project Workspace Manager)
              </h2>
              <p
                className={`text-xs ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                支持自由新建空白/模板画布、多剧集独立保存、复制副本与一键删除画布（当前共 {projects.length} 个画布工程）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDefaultProjects}
              title="恢复内置的《公路求生》等 3 套初始工程画布"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                darkMode
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>恢复默认示范画布</span>
            </button>

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
        </div>

        {/* Modal Body: 12-Column Split (Left 5 Cols: Create New Canvas | Right 7 Cols: Existing Canvases List) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create New Canvas Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleSubmitNewProject}
              className={`p-5 rounded-2xl border space-y-4 ${
                darkMode
                  ? 'bg-zinc-900/60 border-zinc-800'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>新建 AI 短剧无限画布工程</span>
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    darkMode
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  独立拓扑存档
                </span>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  画布工程名称 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：《公路求生》EP02 · 巧夺天工长弓反杀"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-[11px] font-medium mb-1 ${
                      darkMode ? 'text-zinc-300' : 'text-slate-700'
                    }`}
                  >
                    分集 / 场次标号
                  </label>
                  <input
                    type="text"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="EP02 · 戈壁夜袭"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] font-medium mb-1 ${
                      darkMode ? 'text-zinc-300' : 'text-slate-700'
                    }`}
                  >
                    默认主画幅比例
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['9:16', '16:9'] as ShotAspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 px-2 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${
                          aspectRatio === ratio
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                              : 'bg-slate-900 text-white border-slate-900'
                            : darkMode
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {ratio === '9:16' ? '9:16 竖屏' : '16:9 横屏'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1.5 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  短剧题材标签
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setGenreTag(tag)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                        genreTag === tag
                          ? darkMode
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                            : 'bg-slate-900 text-white border-slate-900'
                          : darkMode
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1.5 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  画布初始节点结构
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'starter',
                      title: '标准起步拓扑 (1角色 + 1剧本 + 1竖屏分镜)',
                      desc: '适合快速开始新剧集创作，已预连线好 @Image1 角色注入链路',
                    },
                    {
                      id: 'blank',
                      title: '纯净空白无限画布 (0节点)',
                      desc: '完全空白画布，可通过右键菜单或 Agent 指令从零搭建节点',
                    },
                    ...templates.map((tpl) => ({
                      id: tpl.id,
                      title: `克隆模板：${tpl.name}`,
                      desc: `${tpl.nodes.length} 个节点 / ${tpl.edges.length} 条连线 · ${tpl.episodeTitle}`,
                    })),
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSourceTemplateId(opt.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        sourceTemplateId === opt.id
                          ? darkMode
                            ? 'bg-zinc-800/95 border-zinc-200 text-zinc-100'
                            : 'bg-slate-900 border-slate-900 text-white'
                          : darkMode
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{opt.title}</div>
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            sourceTemplateId === opt.id
                              ? darkMode
                                ? 'text-zinc-300'
                                : 'text-slate-300'
                              : darkMode
                              ? 'text-zinc-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {opt.desc}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          sourceTemplateId === opt.id
                            ? darkMode
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                              : 'bg-white text-slate-900 border-white'
                            : darkMode
                            ? 'border-zinc-600'
                            : 'border-slate-300'
                        }`}
                      >
                        {sourceTemplateId === opt.id && (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    darkMode ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  剧集梗概与爽点备注 (可选)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简要描述本集核心戏剧冲突、核心资产锚点或反转设计..."
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>立即创建并打开新画布</span>
              </button>
            </form>
          </div>

          {/* Right Column: Existing Canvas Projects List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>全部无限画布工程列表 ({projects.length})</span>
              </h3>
              <span
                className={`text-[11px] ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                点击卡片即可切换至对应画布 · 支持重命名、复制与删除
              </span>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                const isConfirmingDelete = confirmDeleteId === proj.id;
                const isEditing = editingId === proj.id;

                const charCount = proj.nodes.filter(
                  (n) => n.type === 'character' || n.type === 'scene_asset'
                ).length;
                const scriptCount = proj.nodes.filter(
                  (n) => n.type === 'script'
                ).length;
                const shotCount = proj.nodes.filter(
                  (n) => n.type === 'storyboard' || n.type === 'video_clip'
                ).length;

                return (
                  <div
                    key={proj.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? darkMode
                          ? 'bg-zinc-900 border-zinc-200 ring-1 ring-zinc-200 shadow-xl'
                          : 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-lg'
                        : darkMode
                        ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={editNameVal}
                              onChange={(e) => setEditNameVal(e.target.value)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                                darkMode
                                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <input
                              type="text"
                              value={editEpisodeVal}
                              onChange={(e) => setEditEpisodeVal(e.target.value)}
                              className={`w-36 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                                darkMode
                                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => saveEditing(proj.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                                darkMode
                                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className={`px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                                darkMode
                                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => {
                                onSelectProject(proj.id);
                                onClose();
                              }}
                              className="text-sm font-bold tracking-tight cursor-pointer hover:underline"
                            >
                              {proj.name}
                            </h4>
                            {isActive && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                  darkMode
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                ● 当前正在编辑
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                darkMode
                                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                                  : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {proj.genreTag}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                darkMode
                                  ? 'bg-zinc-950 border-zinc-800 text-amber-400'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              {proj.aspectRatio}
                            </span>
                          </div>
                        )}

                        <div
                          className={`text-xs font-mono mt-1 ${
                            darkMode ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          {proj.episodeTitle} · 更新于 {proj.updatedAt}
                        </div>

                        <p
                          className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                            darkMode ? 'text-zinc-300' : 'text-slate-600'
                          }`}
                        >
                          {proj.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(proj.id);
                              onClose();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              darkMode
                                ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            <span>进入画布</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => startEditing(proj)}
                          title="重命名画布工程"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            darkMode
                              ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDuplicateProject(proj.id)}
                          title="复制该画布副本"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            darkMode
                              ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProject(proj.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              确认删除
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className={`px-2 py-1.5 rounded-lg border text-xs cursor-pointer ${
                                darkMode
                                  ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(proj.id)}
                            title="删除此画布工程"
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                              darkMode
                                ? 'border-red-900/60 bg-red-950/30 text-red-300 hover:bg-red-950/70 hover:border-red-800'
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>删除画布</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Node & Edge Statistics Bar */}
                    <div
                      className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
                        darkMode
                          ? 'border-zinc-800/80 text-zinc-400'
                          : 'border-slate-200/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span>总节点: {proj.nodes.length}</span>
                        <span>角色/场景锚点: {charCount}</span>
                        <span>分场剧本: {scriptCount}</span>
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3 text-amber-400" />
                          <span>视频分镜: {shotCount}</span>
                        </span>
                        <span>属性注入连线: {proj.edges.length}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectProject(proj.id);
                          onClose();
                        }}
                        className={`hover:underline cursor-pointer ${
                          darkMode ? 'text-zinc-200' : 'text-slate-800'
                        }`}
                      >
                        {isActive ? '返回当前画布 →' : '切换至此画布 →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
