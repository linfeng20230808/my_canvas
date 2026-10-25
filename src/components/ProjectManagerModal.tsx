import React, { useState, useRef } from 'react';
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
  Pencil,
  ArrowUpRight,
  Upload,
  Download,
  FileJson,
  RotateCcw,
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
  templates?: ProjectTemplate[];
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (params: {
    name: string;
    episodeTitle: string;
    description: string;
    genreTag: string;
    aspectRatio: ShotAspectRatio;
    sourceTemplateId?: string;
    templateId?: string;
  }) => void;
  onDuplicateProject: (projectId: string) => void;
  onRenameProject: (
    projectId: string,
    newName: string,
    newEpisode: string
  ) => void;
  onDeleteProject: (projectId: string) => void;
  onResetDefaultProjects?: () => void;
  onImportProjectJson?: (project: CanvasProject) => void;
  onBackupNodesJson?: (project: CanvasProject) => void;
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
  projects = [],
  activeProjectId,
  templates = [],
  onClose,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  onResetDefaultProjects,
  onImportProjectJson,
  onBackupNodesJson,
}) => {
  const [name, setName] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('EP01 · 第一集');
  const [genreTag, setGenreTag] = useState(GENRE_TAGS[0]);
  const [aspectRatio, setAspectRatio] = useState<ShotAspectRatio>('9:16');
  const [sourceTemplateId, setSourceTemplateId] = useState<string>('blank');
  const [description, setDescription] = useState('');

  // Inline Delete Confirmation & Rename state (no window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [editEpisodeVal, setEditEpisodeVal] = useState('');

  // Node JSON Backup Preview & Copy state
  const [previewJsonProjectId, setPreviewJsonProjectId] = useState<string | null>(
    null
  );
  const [copiedJsonId, setCopiedJsonId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  /**
   * Build structured Node Data Backup JSON payload containing all nodes
   * (coordinates, types, dimensions, full data payloads) and topology edges.
   */
  const buildNodeBackupPayload = (proj: CanvasProject) => {
    const projNodes = proj.nodes || [];
    const projEdges = proj.edges || [];
    return {
      backupType: 'FRAMEVERSE_NODE_DATA_BACKUP',
      schemaVersion: '2.0',
      exportedAt: new Date().toISOString(),
      projectMeta: {
        id: proj.id,
        name: proj.name,
        episodeTitle: proj.episodeTitle,
        genreTag: proj.genreTag,
        aspectRatio: proj.aspectRatio,
        edgeColor: proj.edgeColor || '#A1A1AA',
        nodeCount: projNodes.length,
        edgeCount: projEdges.length,
      },
      nodes: projNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: {
          x: n.position.x,
          y: n.position.y,
        },
        width: n.width,
        ...(n.height ? { height: n.height } : {}),
        ...(n.parentGroupId ? { parentGroupId: n.parentGroupId } : {}),
        ...(n.createdBySkillId ? { createdBySkillId: n.createdBySkillId } : {}),
        data: n.data,
      })),
      edges: projEdges.map((e) => ({
        id: e.id,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        relationType: e.relationType,
      })),
    };
  };

  const handleDownloadNodeBackup = (proj: CanvasProject) => {
    const payload = buildNodeBackupPayload(proj);
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const safeName = (proj.name || 'canvas-nodes')
      .replace(/[\\/:*?"<>|\s]+/g, '_')
      .slice(0, 40);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-nodes-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (onBackupNodesJson) {
      onBackupNodesJson(proj);
    }
  };

  const handleCopyNodeBackupJson = (proj: CanvasProject) => {
    const payload = buildNodeBackupPayload(proj);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJsonId(proj.id);
    setTimeout(() => setCopiedJsonId(null), 1800);
  };

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      name.trim() || `短剧画布工程 #${projects.length + 1}`;
    const finalDesc =
      description.trim() ||
      (sourceTemplateId === 'blank'
        ? '纯净空白无限画布，可通过右键菜单、连线或右侧导演 Agent 真实生成节点。'
        : sourceTemplateId === 'starter'
        ? '包含基础角色锚点 (@Image1)、分场剧本与 9:16 分镜节点的起步画布。'
        : '基于工程模板创建的独立短剧画布。');

    onCreateProject({
      name: finalName,
      episodeTitle: episodeTitle.trim() || 'EP01 · 第一集',
      description: finalDesc,
      genreTag,
      aspectRatio,
      sourceTemplateId,
      templateId: sourceTemplateId,
    });

    setName('');
    setDescription('');
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportProjectJson) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const nodesArr = Array.isArray(parsed.nodes)
          ? parsed.nodes
          : Array.isArray(parsed)
          ? parsed
          : null;
        if (nodesArr) {
          const meta = parsed.projectMeta || parsed;
          const importedProj: CanvasProject = {
            id: `proj-import-${Date.now()}`,
            name:
              meta.name ||
              file.name.replace(/(-nodes-backup-\d+)?\.json$/i, ''),
            episodeTitle: meta.episodeTitle || 'EP01 · 节点备份导入',
            description:
              meta.description ||
              `从本地 JSON 节点备份文件导入（共 ${nodesArr.length} 个节点）`,
            genreTag: meta.genreTag || '自定义短剧',
            aspectRatio: meta.aspectRatio === '16:9' ? '16:9' : '9:16',
            createdAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            updatedAt: '刚刚',
            nodes: nodesArr,
            edges: Array.isArray(parsed.edges) ? parsed.edges : [],
            edgeColor: meta.edgeColor || '#A1A1AA',
          };
          onImportProjectJson(importedProj);
          onClose();
        }
      } catch {
        // Ignore invalid json
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEditing = (proj: CanvasProject) => {
    setEditingId(proj.id);
    setEditNameVal(proj.name);
    setEditEpisodeVal(proj.episodeTitle || 'EP01');
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
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${
            darkMode
              ? 'border-zinc-800 bg-zinc-900/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  : 'bg-slate-900 border-slate-900 text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight truncate">
                AI 短剧无限画布 · 项目管理与节点数据备份中心
              </h2>
              <p
                className={`text-xs truncate ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                支持一键导出当前项目的『节点数据备份 (.json)』（含坐标、类型、数据载荷与连线拓扑），方便外部编辑与分析
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Requirement 1: Primary "节点数据备份" Button for Active Project */}
            {activeProject && (
              <button
                type="button"
                onClick={() => handleDownloadNodeBackup(activeProject)}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
                title={`将当前项目「${activeProject.name}」的所有节点 JSON 数据（坐标、类型、数据载荷）导出下载为 .json 文件`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>节点数据备份 (.json)</span>
              </button>
            )}

            {onImportProjectJson && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    darkMode
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  title="导入之前备份的节点数据 .json 或完整短剧工程 .json"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>导入 JSON 备份/工程</span>
                </button>
              </>
            )}

            {onResetDefaultProjects && (
              <button
                type="button"
                onClick={onResetDefaultProjects}
                title="恢复默认《公路求生》演示工程"
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  darkMode
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

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

        {/* Modal Body: 12-Column Split */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create New Canvas Form + Active Project Node Backup Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Dedicated Active Project Node Data Backup Banner Card */}
            {activeProject && (
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  darkMode
                    ? 'bg-zinc-900/90 border-amber-500/40'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <FileJson className="w-4 h-4 text-amber-400" />
                      <span>当前项目 · 节点数据备份 (JSON Export)</span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 leading-relaxed ${
                        darkMode ? 'text-zinc-400' : 'text-slate-600'
                      }`}
                    >
                      包含「{activeProject.name}」全部{' '}
                      <span className="font-mono font-semibold text-amber-400">
                        {(activeProject.nodes || []).length}
                      </span>{' '}
                      个节点的完整坐标 (`position.x/y`)、类型 (`type`)、数据载荷 (`data`) 及{' '}
                      <span className="font-mono font-semibold text-amber-400">
                        {(activeProject.edges || []).length}
                      </span>{' '}
                      条连线拓扑。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadNodeBackup(activeProject)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      darkMode
                        ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载当前节点数据备份 (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyNodeBackupJson(activeProject)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      darkMode
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {copiedJsonId === activeProject.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>已复制 JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制 JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
                  placeholder="输入新短剧工程名称..."
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
                    placeholder="EP01 · 第一集"
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
                      id: 'blank',
                      title: '纯净空白无限画布 (0节点 · 推荐)',
                      desc: '零预置内容，完全由您或右侧全能导演 Agent 实跑创建节点',
                    },
                    {
                      id: 'starter',
                      title: '基础三节点空白拓扑 (1角色 + 1剧本 + 1分镜)',
                      desc: '预置 3 个空白关联节点框架，方便直接填写提示词并出图/出视频',
                    },
                    ...(templates || []).map((tpl) => ({
                      id: tpl.id,
                      title: `导入实跑档案：${tpl.name}`,
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
                <span>立即新建并切换至此画布</span>
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
                点击卡片切换画布 · 支持节点数据备份 (.json)、重命名、复制与删除
              </span>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                const isConfirmingDelete = confirmDeleteId === proj.id;
                const isEditing = editingId === proj.id;
                const isPreviewingJson = previewJsonProjectId === proj.id;

                const projNodes = proj.nodes || [];
                const projEdges = proj.edges || [];

                const charCount = projNodes.filter(
                  (n) => n.type === 'character' || n.type === 'scene_asset'
                ).length;
                const scriptCount = projNodes.filter(
                  (n) => n.type === 'script'
                ).length;
                const shotCount = projNodes.filter(
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
                            {proj.genreTag && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  darkMode
                                    ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                                    : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                              >
                                {proj.genreTag}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                darkMode
                                  ? 'bg-zinc-950 border-zinc-800 text-amber-400'
                                  : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              {proj.aspectRatio || '9:16'}
                            </span>
                          </div>
                        )}

                        <div
                          className={`text-xs font-mono mt-1 ${
                            darkMode ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          {proj.episodeTitle || 'EP01'} · 更新于 {proj.updatedAt || '刚刚'}
                        </div>

                        {proj.description && (
                          <p
                            className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                              darkMode ? 'text-zinc-300' : 'text-slate-600'
                            }`}
                          >
                            {proj.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
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

                        {/* Per-Project Node Data Backup (.json) Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadNodeBackup(proj)}
                          title="导出此画布所有节点的 JSON 数据备份（含坐标、类型、数据载荷）"
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                            darkMode
                              ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                              : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>节点数据备份</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPreviewJsonProjectId((prev) =>
                              prev === proj.id ? null : proj.id
                            )
                          }
                          title="展开预览或复制该项目的节点拓扑 JSON"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isPreviewingJson
                              ? darkMode
                                ? 'border-amber-400 bg-zinc-800 text-amber-300'
                                : 'border-slate-900 bg-slate-100 text-slate-900'
                              : darkMode
                              ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <FileJson className="w-3.5 h-3.5" />
                        </button>

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

                    {/* Expandable Raw Node JSON Topology Inspector */}
                    {isPreviewingJson && (
                      <div
                        className={`mt-3 p-3 rounded-xl border space-y-2 ${
                          darkMode
                            ? 'bg-zinc-950 border-zinc-800'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-semibold text-amber-400">
                            节点数据备份 JSON 预览 (含 id / type / position / data / edges)
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyNodeBackupJson(proj)}
                              className="text-sky-400 hover:underline font-mono cursor-pointer"
                            >
                              {copiedJsonId === proj.id ? '✓ 已复制' : '复制完整 JSON'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadNodeBackup(proj)}
                              className="text-emerald-400 hover:underline font-mono cursor-pointer"
                            >
                              下载 .json 文件
                            </button>
                          </div>
                        </div>
                        <pre
                          className={`max-h-44 overflow-y-auto p-2.5 rounded-lg font-mono text-[10px] leading-relaxed select-all ${
                            darkMode
                              ? 'bg-black/70 text-zinc-300 border border-zinc-800'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          {JSON.stringify(buildNodeBackupPayload(proj), null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Bottom Node & Edge Statistics Bar */}
                    <div
                      className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
                        darkMode
                          ? 'border-zinc-800/80 text-zinc-400'
                          : 'border-slate-200/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span>总节点: {projNodes.length}</span>
                        <span>角色/场景锚点: {charCount}</span>
                        <span>分场剧本: {scriptCount}</span>
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3 text-amber-400" />
                          <span>视频分镜: {shotCount}</span>
                        </span>
                        <span>属性注入连线: {projEdges.length}</span>
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
