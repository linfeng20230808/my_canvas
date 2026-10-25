/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Download,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  Undo2,
  Redo2,
  Settings,
  Plus,
} from 'lucide-react';
import {
  CanvasNode,
  CanvasEdge,
  DramaSkill,
  NodeCategory,
  EdgeRelationType,
  AgentChatMessage,
  VideoModelTarget,
  UploadedAttachment,
  CustomAIProviderConfig,
  AgentModelOption,
  CanvasStateSnapshot,
  CanvasHistoryCommand,
  CanvasProject,
} from './types/canvas';
import {
  BUILTIN_DRAMA_SKILLS,
  PROJECT_TEMPLATES,
  VERIFIED_AGENT_MODELS,
} from './data/initialProject';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { OmniAgentPanel } from './components/OmniAgentPanel';
import { SkillStudioModal } from './components/SkillStudioModal';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { StoryboardPlayerModal } from './components/StoryboardPlayerModal';
import { SettingsModal } from './components/SettingsModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';

const STORAGE_KEY_SKILLS = 'frameverse_custom_skills_v4';
const STORAGE_KEY_PROVIDERS = 'frameverse_custom_providers_v1';
const STORAGE_KEY_PROJECTS = 'frameverse_canvas_projects_v1';

const DEFAULT_MOUNTED_SKILLS = [
  'skill-seedance-director-suite',
  'skill-manju-laoli-director',
  'skill-manju-laoli-combat',
  'skill-character-3view-lock',
  'skill-manju-laoli-qa-feed',
  'skill-minimax-h3-director',
  'skill-golden-3s-script',
];

function createDefaultProjects(): CanvasProject[] {
  return PROJECT_TEMPLATES.map((tpl, idx) => ({
    id: tpl.id,
    name: tpl.name,
    subtitle: tpl.subtitle,
    createdAt: idx === 0 ? '2025-05-12 09:30' : '2025-05-10 14:20',
    updatedAt: idx === 0 ? '刚刚' : '2小时前',
    nodes: JSON.parse(JSON.stringify(tpl.nodes)),
    edges: JSON.parse(JSON.stringify(tpl.edges)),
    mountedSkillIds: [...DEFAULT_MOUNTED_SKILLS],
    edgeColor: '#A1A1AA',
  }));
}

export default function App() {
  const [projects, setProjects] = useState<CanvasProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage error
    }
    return createDefaultProjects();
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    () => projects[0]?.id || PROJECT_TEMPLATES[0].id
  );
  const [nodes, setNodes] = useState<CanvasNode[]>(
    () => projects[0]?.nodes || PROJECT_TEMPLATES[0].nodes
  );
  const [edges, setEdges] = useState<CanvasEdge[]>(
    () => projects[0]?.edges || PROJECT_TEMPLATES[0].edges
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    'node-shot-01'
  );
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isProjectManagerOpen, setIsProjectManagerOpen] =
    useState<boolean>(false);

  // Customizable Edge Color & Right Agent Panel Collapse State
  const [edgeColor, setEdgeColor] = useState<string>(
    () => projects[0]?.edgeColor || '#A1A1AA'
  );
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState<boolean>(true);

  // Settings & Custom AI Providers State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [purePromptMode, setPurePromptMode] = useState<boolean>(true);
  const [defaultVideoModel, setDefaultVideoModel] =
    useState<VideoModelTarget>('seedance_2_0');

  const [customProviders, setCustomProviders] = useState<
    CustomAIProviderConfig[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROVIDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage error
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_PROVIDERS,
        JSON.stringify(customProviders)
      );
    } catch {
      // Ignore storage error
    }
  }, [customProviders]);

  // Combined Built-in + Custom Provider Models
  const allModels: AgentModelOption[] = useMemo(() => {
    const customList: AgentModelOption[] = [];
    customProviders.forEach((cp) => {
      if (!cp.enabled) return;
      cp.models.forEach((mName) => {
        customList.push({
          id: `custom:${cp.id}:${mName}`,
          provider: 'custom',
          providerLabel: cp.name,
          modelName: mName,
          displayName: `${cp.name} · ${mName}`,
          badge: '自定义运营商',
          supportsVision: cp.supportsVision,
          verified: true,
          customProviderId: cp.id,
        });
      });
    });
    return [...VERIFIED_AGENT_MODELS, ...customList];
  }, [customProviders]);

  const [selectedModelId, setSelectedModelId] = useState<string>(
    VERIFIED_AGENT_MODELS[0].id
  );

  const activeCustomProvider = useMemo(() => {
    if (!selectedModelId.startsWith('custom:')) return null;
    const parts = selectedModelId.split(':');
    const provId = parts[1];
    return customProviders.find((p) => p.id === provId) || null;
  }, [selectedModelId, customProviders]);

  // Skills & Mounted Skill State
  const [skills, setSkills] = useState<DramaSkill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SKILLS);
      if (saved) {
        const parsed: DramaSkill[] = JSON.parse(saved);
        return [...BUILTIN_DRAMA_SKILLS, ...parsed];
      }
    } catch {
      // Ignore storage error
    }
    return BUILTIN_DRAMA_SKILLS;
  });

  const [mountedSkillIds, setMountedSkillIds] = useState<string[]>([
    'skill-seedance-director-suite',
    'skill-manju-laoli-director',
    'skill-manju-laoli-combat',
    'skill-character-3view-lock',
    'skill-manju-laoli-qa-feed',
    'skill-minimax-h3-director',
    'skill-golden-3s-script',
  ]);

  // =========================================================================
  // REQUIREMENT 1: COMMAND PATTERN UNDO / REDO ENGINE
  // Covers all node creations, moves, edits, deletions, edges & skill mounts
  // =========================================================================
  const [undoStack, setUndoStack] = useState<CanvasHistoryCommand[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasHistoryCommand[]>([]);
  const dragStartSnapshotRef = useRef<CanvasStateSnapshot | null>(null);

  const getCurrentSnapshot = useCallback(
    (): CanvasStateSnapshot => ({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      mountedSkillIds: [...mountedSkillIds],
      selectedNodeId,
    }),
    [nodes, edges, mountedSkillIds, selectedNodeId]
  );

  const applySnapshot = useCallback((snap: CanvasStateSnapshot) => {
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setMountedSkillIds(snap.mountedSkillIds);
    setSelectedNodeId(snap.selectedNodeId);
  }, []);

  const commitCommand = useCallback(
    (
      label: string,
      nextState: CanvasStateSnapshot,
      customBefore?: CanvasStateSnapshot
    ) => {
      const beforeSnap = customBefore || getCurrentSnapshot();
      const cmd: CanvasHistoryCommand = {
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        before: beforeSnap,
        after: JSON.parse(JSON.stringify(nextState)),
      };
      setUndoStack((prev) => [...prev.slice(-39), cmd]);
      setRedoStack([]);
      applySnapshot(nextState);
    },
    [getCurrentSnapshot, applySnapshot]
  );

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastCmd = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastCmd]);
    applySnapshot(lastCmd.before);
    showToast(`已撤销：${lastCmd.label}`);
  }, [undoStack, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextCmd = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextCmd]);
    applySnapshot(nextCmd.after);
    showToast(`已重做：${nextCmd.label}`);
  }, [redoStack, applySnapshot]);

  // Global Keyboard Shortcuts Ctrl+Z / Cmd+Z & Ctrl+Y / Cmd+Shift+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Modals & Drawers State
  const [isSkillStudioOpen, setIsSkillStudioOpen] = useState(false);
  const [skillStudioTargetId, setSkillStudioTargetId] = useState<
    string | undefined
  >(undefined);
  const [inspectorNodeId, setInspectorNodeId] = useState<string | null>(null);
  const [isStoryboardPlayerOpen, setIsStoryboardPlayerOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Omni-Director Agent Chat State with Real-Run Highway Survival Trace
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentMessages, setAgentMessages] = useState<AgentChatMessage[]>([
    {
      id: 'msg-highway-real-run',
      role: 'assistant',
      modelUsed: 'DeepSeek Official · deepseek-chat',
      content:
        '已基于您提供的《公路求生：开局老式车床》140行原文，调用 DeepSeek 官方引擎结合『漫剧老李·文武双模分镜 Skill』与『Seedance 2.0/2.5 导演 Skill』真实跑通全流程（纯提示词模式，未触发出图）：\n\n1. **5大跨镜头一致性资产提示词卡**：\n   - `@Image1` 谢长清（四视图锁脸 + 战术工装夹克 + 右耳直播耳麦）\n   - `@Image2` 1级老式普通车床（三爪卡盘 + 刀架尾座 + 机械臂 + 小型加热炉 + 4个宽大机械轮 + S级1秒联动金光）\n   - `@Image3` 光头猛男（黑色背心肌肉壮汉 + 破旧五菱面包车）\n   - `@Image4` 华夏8888分区·戈壁四车道公路（4500K烈日风沙 vs 6500K全息蓝屏）\n   - `@Image5` 黑铁物资箱 & 巧夺天工·木质长弓图纸\n2. **3场黄金前3秒爽点分场剧本（SC01~SC03）** + **6个 9:16 竖屏分镜全套三模型视频提示词（SHOT 01~06）** + **七段式分镜统筹总表**。\n3. **交互提示**：单击画布上任意节点即可在节点正下方弹出 `open-ai-canvas` 风格生成框；从节点右侧 `⊕` 拖出连线在空白处松手可弹出菜单新建并自动连接下游节点！',
      timestamp: '10:24',
      mountedSkills: [
        'Seedance 2.0/2.5 导演 Skill',
        '漫剧老李·总控与文武双模分镜 Skill',
        '漫剧老李·四视图资产锁死 Skill',
        '漫剧老李·七段式投喂与全链路质检 Skill',
      ],
      spawnedNodeIds: [
        'node-hw-char-xie',
        'node-hw-asset-lathe',
        'node-shot-01',
        'node-shot-03',
        'node-shot-06',
        'node-hw-table',
      ],
      actionHistory: {
        durationLabel: '4.8s',
        summaryHeader: 'Edited 16 items',
        thinkingSteps: [
          '1. 原著文案解析: 读取《公路求生》140行文本，提取核心爽点链：靶场穿越戈壁四车道 → 觉醒0.01%保底S级【完美制造】(巧夺天工/耐久999) → 盲选随机载具获【1级老式普通车床】(联动缩短至1秒制造) → 光头猛男面包车超车偷拍群嘲 → 开启黑铁物资箱获20L汽油与【木质长弓】图纸。',
          '2. 漫剧老李四视图资产锁死: 为谢长清(@Image1)、1级老式普通车床(@Image2)、光头猛男(@Image3)、戈壁四车道公路(@Image4)、黑铁物资箱与木质长弓图纸(@Image5)生成中英双语一致性资产提示词。',
          '3. 180°轴线与FACS微表情分镜编译: 严格锁定左车道1km/h车床与右车道超车面包车的180°拍摄轴线，按FACS面部编码编译 SHOT 01~06 的 Seedance 2.0(6段式)、Seedance 2.5(7段式)与 MiniMax H3 视频提示词。',
        ],
        toolCalls: [
          {
            id: 'tc-hw-1',
            toolName: 'parse_novel_script',
            target: 'assets/__1_3e7cc03b.txt',
            detail: '解析《公路求生》140行原文',
            status: 'completed',
          },
          {
            id: 'tc-hw-2',
            toolName: 'compile_asset_prompts',
            target: 'nodes/assets/@Image1~@Image5.prompt',
            detail: '生成谢长清/老式车床/戈壁公路等5套资产提示词',
            status: 'completed',
          },
          {
            id: 'tc-hw-3',
            toolName: 'breakdown_drama_scenes',
            target: 'nodes/scripts/EP01-SC01~SC03.md',
            detail: '拆解3场黄金前3秒爽点剧本',
            status: 'completed',
          },
          {
            id: 'tc-hw-4',
            toolName: 'synthesize_video_prompts',
            target: 'nodes/storyboards/SHOT01~SHOT06.json',
            detail: '实跑生成 Seedance 2.0/2.5 & MiniMax H3 提示词',
            status: 'completed',
          },
          {
            id: 'tc-hw-5',
            toolName: 'qa_axis_and_facs',
            target: 'nodes/table/EP01-7Part-Sheet.table',
            detail: '通过四道质检锁并生成七段式统筹总表',
            status: 'completed',
          },
        ],
        builtStatus: 'Built · 全套视频提示词与资产提示词已实跑就绪（纯提示词模式）',
      },
    },
  ]);

  useEffect(() => {
    try {
      const customOnly = skills.filter((s) => !s.isBuiltIn);
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(customOnly));
    } catch {
      // Ignore storage error
    }
  }, [skills]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const inspectorNode = useMemo(
    () => nodes.find((n) => n.id === inspectorNodeId) || null,
    [nodes, inspectorNodeId]
  );

  const getUpstreamNodesFor = (nodeId: string | null): CanvasNode[] => {
    if (!nodeId) return [];
    const incomingSourceIds = edges
      .filter((e) => e.targetNodeId === nodeId)
      .map((e) => e.sourceNodeId);
    return nodes.filter((n) => incomingSourceIds.includes(n.id));
  };

  // Synchronize active canvas changes back into `projects` & localStorage
  useEffect(() => {
    setProjects((prev) => {
      const next = prev.map((p) =>
        p.id === activeTemplateId
          ? {
              ...p,
              nodes,
              edges,
              mountedSkillIds,
              edgeColor,
              updatedAt: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  }, [nodes, edges, mountedSkillIds, edgeColor, activeTemplateId]);

  const handleSwitchTemplate = (projectId: string) => {
    const found = projects.find((t) => t.id === projectId);
    if (!found) return;
    setActiveTemplateId(found.id);
    if (found.edgeColor) setEdgeColor(found.edgeColor);
    commitCommand(`切换画布工程：${found.name}`, {
      nodes: found.nodes,
      edges: found.edges,
      mountedSkillIds: found.mountedSkillIds || mountedSkillIds,
      selectedNodeId:
        found.nodes.find((n) => n.type === 'storyboard')?.id ||
        found.nodes[0]?.id ||
        null,
    });
    showToast(`已切换短剧画布工程：${found.name}`);
  };

  const handleCreateProject = (
    name: string,
    subtitle: string,
    templateMode: 'blank' | 'starter' | string
  ) => {
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newId = `proj-${Date.now()}`;
    let initialNodes: CanvasNode[] = [];
    let initialEdges: CanvasEdge[] = [];

    if (templateMode === 'blank') {
      initialNodes = [];
      initialEdges = [];
    } else if (templateMode === 'starter') {
      const charId = `node-char-${Date.now()}`;
      const scriptId = `node-script-${Date.now() + 1}`;
      const shotId = `node-shot-${Date.now() + 2}`;
      initialNodes = [
        {
          id: charId,
          type: 'character',
          position: { x: 80, y: 120 },
          data: {
            title: '核心主角 · 四视图锚点',
            subtitle: '@Image1 · 角色一致性锁死',
            anchorTag: '@Character_Main',
            consistencyLocked: true,
            traits: ['24岁亚洲主角', '高辨识度服装锚点', 'FACS微表情基准'],
            visualPrompt:
              'Character turnaround sheet, front view, side profile, back view, 3/4 view, consistent facial identity, dramatic cinematic lighting, 9:16 vertical short drama style.',
          },
        },
        {
          id: scriptId,
          type: 'script',
          position: { x: 460, y: 120 },
          data: {
            title: 'EP01 · 黄金前3秒爽点剧本',
            subtitle: '开局高潮钩子 · 冲突反转',
            episodeTag: 'EP01-SC01',
            durationSec: 12,
            hookScore: 95,
            content:
              '【0-3秒强冲突】主角在绝境中突然触发唯一隐藏神级天赋，全息金光瞬间笼罩全场，反派表情从嘲讽凝固为惊骇。',
          },
        },
        {
          id: shotId,
          type: 'storyboard',
          position: { x: 860, y: 120 },
          data: {
            title: 'SHOT 01 · 黄金前3秒视觉特写',
            subtitle: 'Seedance 2.0 · 9:16 竖屏分镜',
            shotNumber: 'SHOT 01',
            cameraAngle: 'ECU 极近特写 -> 环绕推镜',
            lightingStyle: '高反差冷暖双色温碰撞',
            aspectRatio: '9:16',
            videoModelTarget: 'seedance_2_0',
            dialogue: '“谁告诉你，这只是普通装备？”',
            visualPrompt:
              '【Seedance 2.0 6段式】1.主体与锚点：引用 @Image1 (@Character_Main)；2.微表情(FACS)：AU4眉头微蹙转冷笑；3.镜头运镜：ECU瞳孔特写急速拉出至中景环绕；4.光影色温：6500K全息蓝光碰撞2800K金芒；5.物理特效：气浪掀起衣角与碎屑；6.画质规格：9:16 vertical, 60fps.',
            videoPrompts: {
              seedance_2_0:
                '【Seedance 2.0 6段式】1.主体与锚点：引用 @Image1 (@Character_Main)；2.微表情(FACS)：AU4眉头微蹙转冷笑；3.镜头运镜：ECU瞳孔特写急速拉出至中景环绕；4.光影色温：6500K全息蓝光碰撞2800K金芒；5.物理特效：气浪掀起衣角与碎屑；6.画质规格：9:16 vertical, 60fps.',
              seedance_2_5:
                '【Seedance 2.5 7段式】@Image1 主角觉醒瞬间，0-2s瞳孔倒映金光，2-5s气浪炸裂衣角翻飞，180度轴线锁定，9:16竖屏电影质感。',
              minimax_h3:
                '[Push in & Orbit] Protagonist (@Image1) awakens golden aura in extreme close-up, debris floating in slow motion, high contrast lighting, 9:16 vertical.',
            },
          },
        },
      ];
      initialEdges = [
        {
          id: `edge-starter-1-${Date.now()}`,
          sourceNodeId: charId,
          targetNodeId: shotId,
          relationType: 'character_ref',
          animated: true,
        },
        {
          id: `edge-starter-2-${Date.now()}`,
          sourceNodeId: scriptId,
          targetNodeId: shotId,
          relationType: 'script_breakdown',
          animated: true,
        },
      ];
    } else {
      const tpl =
        PROJECT_TEMPLATES.find((t) => t.id === templateMode) ||
        PROJECT_TEMPLATES[0];
      initialNodes = JSON.parse(JSON.stringify(tpl.nodes));
      initialEdges = JSON.parse(JSON.stringify(tpl.edges));
    }

    const newProj: CanvasProject = {
      id: newId,
      name,
      subtitle,
      createdAt: nowStr,
      updatedAt: '刚刚',
      nodes: initialNodes,
      edges: initialEdges,
      mountedSkillIds: [...DEFAULT_MOUNTED_SKILLS],
      edgeColor: '#A1A1AA',
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveTemplateId(newId);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(initialNodes[0]?.id || null);
    setUndoStack([]);
    setRedoStack([]);
    showToast(`已新建并切换至画布「${name}」`);
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      showToast('至少需要保留 1 个短剧画布工程');
      return;
    }
    const target = projects.find((p) => p.id === projectId);
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(remaining));
    } catch {
      // Ignore storage error
    }
    if (activeTemplateId === projectId && remaining.length > 0) {
      const nextActive = remaining[0];
      setActiveTemplateId(nextActive.id);
      setNodes(nextActive.nodes);
      setEdges(nextActive.edges);
      setSelectedNodeId(nextActive.nodes[0]?.id || null);
      setUndoStack([]);
      setRedoStack([]);
    }
    showToast(`已删除画布工程「${target?.name || projectId}」`);
  };

  const handleDuplicateProject = (projectId: string) => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const copyProj: CanvasProject = {
      ...JSON.parse(JSON.stringify(source)),
      id: `proj-copy-${Date.now()}`,
      name: `${source.name} (副本)`,
      createdAt: nowStr,
      updatedAt: '刚刚',
    };
    setProjects((prev) => [copyProj, ...prev]);
    setActiveTemplateId(copyProj.id);
    setNodes(copyProj.nodes);
    setEdges(copyProj.edges);
    setSelectedNodeId(copyProj.nodes[0]?.id || null);
    showToast(`已复制画布工程「${copyProj.name}」`);
  };

  const handleRenameProject = (
    projectId: string,
    newName: string,
    newSubtitle: string
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, name: newName, subtitle: newSubtitle, updatedAt: '刚刚' }
          : p
      )
    );
    showToast(`已更新画布名称为「${newName}」`);
  };

  const handleResetDefaultProjects = () => {
    const defaults = createDefaultProjects();
    setProjects(defaults);
    setActiveTemplateId(defaults[0].id);
    setNodes(defaults[0].nodes);
    setEdges(defaults[0].edges);
    setSelectedNodeId('node-shot-01');
    setUndoStack([]);
    setRedoStack([]);
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(defaults));
    } catch {
      // Ignore
    }
    showToast('已恢复《公路求生》实跑工程与赛博悬疑预设画布');
  };

  // Node Dragging with atomic Command Pattern Undo/Redo
  const handleNodeDragStart = (id: string) => {
    const _ = id;
    dragStartSnapshotRef.current = getCurrentSnapshot();
  };

  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position: { x, y } } : n))
    );
  };

  const handleNodeDragEnd = (id: string) => {
    const startSnap = dragStartSnapshotRef.current;
    dragStartSnapshotRef.current = null;
    if (!startSnap) return;

    const beforeNode = startSnap.nodes.find((n) => n.id === id);
    const afterNode = nodes.find((n) => n.id === id);
    if (!beforeNode || !afterNode) return;

    if (
      beforeNode.position.x !== afterNode.position.x ||
      beforeNode.position.y !== afterNode.position.y
    ) {
      commitCommand(
        `移动节点「${afterNode.data.title.split('·')[0]}」`,
        {
          nodes,
          edges,
          mountedSkillIds,
          selectedNodeId,
        },
        startSnap
      );
    }
  };

  const handleSwitchNodeVideoModel = (
    nodeId: string,
    videoModelTarget: VideoModelTarget
  ) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;
    const nextNodes = nodes.map((n) => {
      if (n.id !== nodeId) return n;
      const nextPrompt =
        n.data.videoPrompts?.[videoModelTarget] || n.data.visualPrompt;
      return {
        ...n,
        data: {
          ...n.data,
          videoModelTarget,
          visualPrompt: nextPrompt,
        },
      };
    });
    commitCommand(
      `切换「${targetNode.data.title.split('·')[0]}」视频模型为 ${videoModelTarget}`,
      {
        nodes: nextNodes,
        edges,
        mountedSkillIds,
        selectedNodeId,
      }
    );
  };

  const createNewCanvasNodeObject = (
    type: NodeCategory,
    customX?: number,
    customY?: number
  ): CanvasNode => {
    const id = `node-${type}-${Date.now()}`;
    const shotCount = nodes.filter((n) => n.type === 'storyboard').length + 1;
    const hasCustomPos =
      typeof customX === 'number' && typeof customY === 'number';

    if (type === 'character') {
      return {
        id,
        type: 'character',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 80, y: 220 + Math.round(Math.random() * 120) },
        width: 300,
        data: {
          title: '新角色四视图一致性资产',
          subtitle: '四视图锁脸设定 · 单击节点弹出生成框',
          roleType: '核心角色锚点 (@Image1)',
          consistencyPrompt:
            '[Asset_Board_Lock: 4-View Character Sheet (01.Front View | 02.90° Profile View | 03.Back View | 04.FACS Face Close-Up)] 24yo East Asian protagonist, sharp expressive eyes, distinct wasteland tactical attire, high-contrast studio rim light.',
          costumeDetails: '定制战术工装 · 标志性配饰 (@Image1)',
          lightingMood: '4500K 侧逆光 + 6500K 轮廓光',
          visualPreset: 'custom',
          threeViewVerified: true,
        },
      };
    }
    if (type === 'scene_asset') {
      return {
        id,
        type: 'scene_asset',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 80, y: 500 },
        width: 300,
        data: {
          title: '新场景/载具空间锚点',
          subtitle: '空间透视与机械结构基准 (@Image2)',
          roleType: '核心场景/载具锚点 (@Image2)',
          consistencyPrompt:
            '[Scene_Spatial_Lock: 180-Degree Axis Environment] Cinematic wasteland highway or industrial workshop interior, high-contrast warm tungsten & cool blue holographic lighting.',
          costumeDetails: '核心场景与载具陈设 (@Image2)',
          lightingMood: '4500K 主光 + 6500K 全息冷光',
        },
      };
    }
    if (type === 'script') {
      return {
        id,
        type: 'script',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 440, y: 380 },
        width: 340,
        data: {
          title: '新分场剧本节点：高潮对峙',
          subtitle: '外景 · 黄金前3秒爽点结构',
          sceneNumber: 'EP01-SC04',
          hookPoint:
            '【黄金前3秒】谢长清将木质长弓图纸拍在老式车床三爪卡盘上，1秒金光爆闪！',
          reversalPoint:
            '【结尾反转】巧夺天工级木质长弓（耐久999）瞬间成型，附带穿甲爆裂词条！',
          scriptBody:
            '在此输入或点击下方生成框扩写分场剧本正文、FACS微表情与动作描写。',
          dialogues: [
            {
              speaker: '谢长清',
              emotion: 'FACS: 单侧唇角自信勾起(AU12)',
              line: '“1秒钟，巧夺天工品质——这车床真香！”',
            },
          ],
        },
      };
    }
    if (type === 'text_note') {
      return {
        id,
        type: 'text_note',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 440, y: 180 },
        width: 300,
        data: {
          title: '导演批注与原著设定便签',
          subtitle: '自由文本节点 · 可连线注入剧本或分镜',
          textNoteContent:
            '【轴线与情绪备忘】本场严格锁定 180° 轴线（谢长清与老式车床居左车道，超车面包车居右车道）。',
        },
      };
    }
    if (type === 'audio_clip') {
      return {
        id,
        type: 'audio_clip',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 440, y: 540 },
        width: 300,
        data: {
          title: '@Audio1 · 音轨与台词气口节点',
          subtitle: 'Seedance 2.5 音画同步锚点',
          audioBpmOrMood: '78 BPM · 废土风沙呼啸 + 车床1秒金光音效',
          audioTranscript:
            '[0.0s 机械卡盘夹紧声] → [1.0s S级巧夺天工金光爆鸣] → [2.2s 弓弦震颤嗡鸣]',
          durationSec: 3.5,
        },
      };
    }
    if (type === 'storyboard_table') {
      return {
        id,
        type: 'storyboard_table',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 840, y: 560 },
        width: 720,
        data: {
          title: '漫剧老李·七段式分镜统筹表',
          subtitle: '含镜号 / 景别 / 运镜 / 180°轴线 / FACS微表情 / 时长',
          tableRows: [
            {
              shotNo: `SHOT 0${shotCount}`,
              shotSize: '中近景 MCU',
              cameraMove: '[Push in] 35mm',
              axisLine: '男主居左面向右侧车床',
              facsMicro: 'AU6+AU12 狂喜勾唇',
              visualContent: '老式车床1秒合成巧夺天工木质长弓，金光映亮瞳孔',
              duration: '3.5s',
            },
          ],
        },
      };
    }
    if (type === 'group') {
      return {
        id,
        type: 'group',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 420, y: 500 },
        width: 680,
        height: 440,
        data: {
          title: '新自由分镜分组框 (Scene Group)',
          groupDescription:
            '可将关联剧本、角色锚点与分镜卡片拖拽至此分组区域',
        },
      };
    }

    const defaultPrompts = {
      minimax_h3:
        '[Push in, Tilt up] Subject_Lock: (Xie Changqing @Image1 on Vintage Lathe @Image2). Position_Lock: (Left-foreground facing right). At 00:00.000, rapid push-in as S-Rank golden crafting light erupts from the 3-jaw chuck. [Shot Cut] At 00:01.500, Masterwork Wooden Longbow materializes in 1 second.',
      seedance_2_0:
        '[Xie Changqing (@Image1) & Vintage Cast-Iron Lathe (@Image2)] + [triggers 1-second S-Rank Perfect Crafting golden burst, FACS AU6/AU12 confident smirk] + in [Gobi 4-Lane Highway (@Image4)] + Camera: [Rapid Push-in + Orbit, Fast speed, Subject Lock: chuck & bow]; Lens: [35mm f/1.4 Anamorphic]; Stability: [Steadicam] + Style: [Wasteland survival blockbuster] + Avoid: [face morphing, extra fingers, axis jump]',
      seedance_2_5:
        'Refs: [@Image1 (Xie Changqing Lock), @Image2 (Vintage Lathe Lock), @Image4 (Gobi Highway), @Audio1 (1s Crafting Chime)] | [站位声明: 谢长清居左操控车床，严格遵守180°轴线] | Shot 1 (0.0s - 1.2s) [Hook]: Blueprint placed on lathe chuck, golden light flashes for 1s. -> Shot 2 (1.2s - 3.5s) [Climax]: Xie Changqing lifts Masterwork Wooden Longbow (Durability 999) | Avoid: [崩脸, 越轴]',
    };

    return {
      id,
      type: 'storyboard',
      position: hasCustomPos
        ? { x: customX!, y: customY! }
        : { x: 880 + ((shotCount - 1) % 3) * 315, y: 340 },
      width: 295,
      data: {
        title: `SHOT 0${shotCount} · 新增竖屏视频分镜`,
        subtitle: '特写 (CU) · 竖屏 9:16',
        shotNumber: `SHOT 0${shotCount}`,
        aspectRatio: '9:16',
        shotSize: '特写 (CU)',
        cameraMove: '[Push in, Tilt up]',
        focalLength: '35mm f/1.4',
        videoModelTarget: defaultVideoModel,
        visualPrompt: defaultPrompts[defaultVideoModel],
        videoPrompts: defaultPrompts,
        dialogueSnippet:
          '“点击下方生成框【生成提示词】，自动融合上游角色与老式车床锚点。”',
        speakerName: '谢长清',
        durationSec: 3.5,
        customSvgElements: {
          primaryHue: '#F59E0B',
          secondaryHue: '#18181B',
          keyLightAngle: '45° 戈壁烈日侧逆光 + S级金光',
          silhouetteType: 'single_closeup',
          cameraVectorLabel: '[Push in] · 35mm',
          focalCaption: '单击节点在下方生成框查看/合成三套视频提示词',
        },
      },
    };
  };

  const handleAddNode = (
    type: NodeCategory,
    customX?: number,
    customY?: number
  ) => {
    const newNode = createNewCanvasNodeObject(type, customX, customY);
    commitCommand(`新建节点「${newNode.data.title}」`, {
      nodes: [...nodes, newNode],
      edges,
      mountedSkillIds,
      selectedNodeId: newNode.id,
    });
    showToast(`已新建节点「${newNode.data.title}」（可按 Ctrl+Z 撤销）`);
  };

  // Requirement 4: Dragging out an edge and releasing on empty canvas pops up menu,
  // creating the new node AND automatically connecting it to the source node!
  const handleAddConnectedNode = (
    sourceNodeId: string,
    targetType: NodeCategory,
    x: number,
    y: number
  ) => {
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    const newNode = createNewCanvasNodeObject(targetType, x, y);

    // Inherit context from sourceNode if applicable
    if (
      sourceNode &&
      (newNode.type === 'storyboard' || newNode.type === 'video_clip')
    ) {
      const anchorTag =
        sourceNode.type === 'character'
          ? `@Image1 (${sourceNode.data.title})`
          : sourceNode.type === 'scene_asset'
          ? `@Image2 (${sourceNode.data.title})`
          : sourceNode.data.title;
      newNode.data.subtitle = `已自动连接自「${sourceNode.data.title.split('·')[0]}」`;
      newNode.data.visualPrompt = `[继承上游锚点: ${anchorTag}] ${newNode.data.visualPrompt}`;
    }

    let relationType: EdgeRelationType = 'script_breakdown';
    if (sourceNode?.type === 'character') relationType = 'character_ref';
    else if (sourceNode?.type === 'scene_asset') relationType = 'scene_ref';
    else if (sourceNode?.type === 'storyboard') relationType = 'shot_sequence';

    const newEdge: CanvasEdge = {
      id: `edge-auto-${Date.now()}`,
      sourceNodeId,
      targetNodeId: newNode.id,
      relationType,
    };

    commitCommand(
      `连线新建「${newNode.data.title.split('·')[0]}」并连接自「${
        sourceNode?.data.title.split('·')[0] || '上游节点'
      }」`,
      {
        nodes: [...nodes, newNode],
        edges: [...edges, newEdge],
        mountedSkillIds,
        selectedNodeId: newNode.id,
      }
    );
    showToast(
      `已新建「${newNode.data.title}」并自动建立属性注入连线！`
    );
  };

  // Convert an uploaded file attachment directly into a Canvas Node
  const handleCreateNodeFromAttachment = (att: UploadedAttachment) => {
    const id = `node-upload-${Date.now()}`;
    let newNode: CanvasNode;
    if (att.kind === 'image' && att.dataUrl) {
      newNode = {
        id,
        type: 'character',
        position: { x: 90, y: 240 },
        width: 300,
        data: {
          title: `上传资产：${att.name.replace(/\.[^.]+$/, '')}`,
          subtitle: '用户上传参考图锚点 · 支持连线注入分镜',
          roleType: '上传视觉参考锚点',
          consistencyPrompt: `Reference image [${att.name}] locked character/scene visual style and facial structure`,
          costumeDetails: '来自上传参考图 (@Image1)',
          generatedImageUrl: att.dataUrl,
          threeViewVerified: true,
        },
      };
    } else {
      newNode = {
        id,
        type: 'script',
        position: { x: 440, y: 260 },
        width: 340,
        data: {
          title: `上传剧本：${att.name}`,
          subtitle: '外部导入剧本文档节点',
          sceneNumber: 'IMPORT-01',
          hookPoint: '【导入剧本片段】可连线至分镜节点或交由全能 Agent 拆解',
          scriptBody: (att.textContent || '').slice(0, 1200),
        },
      };
    }

    commitCommand(`导入附件节点「${newNode.data.title}」`, {
      nodes: [...nodes, newNode],
      edges,
      mountedSkillIds,
      selectedNodeId: id,
    });
    showToast(`已将上传附件「${att.name}」转为画布节点`);
  };

  const handleDeleteNode = (id: string) => {
    const target = nodes.find((n) => n.id === id);
    if (!target) return;
    commitCommand(`删除节点「${target.data.title.split('·')[0]}」`, {
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter(
        (e) => e.sourceNodeId !== id && e.targetNodeId !== id
      ),
      mountedSkillIds,
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
    });
    showToast(`已删除节点「${target.data.title.split('·')[0]}」（可按 Ctrl+Z 撤销）`);
  };

  const handleAddEdge = (
    sourceId: string,
    targetId: string,
    relationType: EdgeRelationType
  ) => {
    const exists = edges.some(
      (e) => e.sourceNodeId === sourceId && e.targetNodeId === targetId
    );
    if (exists) return;

    const newEdge: CanvasEdge = {
      id: `edge-${Date.now()}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      relationType,
    };
    commitCommand('新增属性注入连线', {
      nodes,
      edges: [...edges, newEdge],
      mountedSkillIds,
      selectedNodeId,
    });
    showToast('已建立属性注入流向连线');
  };

  const handleDeleteEdge = (edgeId: string) => {
    commitCommand('断开属性注入连线', {
      nodes,
      edges: edges.filter((e) => e.id !== edgeId),
      mountedSkillIds,
      selectedNodeId,
    });
    showToast('已断开属性注入连线（可按 Ctrl+Z 撤销）');
  };

  const handleUpdateNodeData = (
    nodeId: string,
    updatedData: CanvasNode['data'],
    customLabel?: string
  ) => {
    const nextNodes = nodes.map((n) =>
      n.id === nodeId ? { ...n, data: updatedData } : n
    );
    commitCommand(
      customLabel || `更新节点「${updatedData.title.split('·')[0]}」参数`,
      {
        nodes: nextNodes,
        edges,
        mountedSkillIds,
        selectedNodeId,
      }
    );
  };

  const handleAutoLayout = () => {
    const assets = nodes.filter(
      (n) => n.type === 'character' || n.type === 'scene_asset'
    );
    const scripts = nodes.filter(
      (n) =>
        n.type === 'script' ||
        n.type === 'idea' ||
        n.type === 'text_note' ||
        n.type === 'audio_clip'
    );
    const storyboards = nodes.filter(
      (n) => n.type === 'storyboard' || n.type === 'storyboard_table'
    );

    const nextNodes = nodes.map((node) => {
      if (node.type === 'character' || node.type === 'scene_asset') {
        const idx = assets.findIndex((a) => a.id === node.id);
        return {
          ...node,
          position: { x: 50, y: 110 + idx * 265 },
        };
      }
      if (
        node.type === 'script' ||
        node.type === 'idea' ||
        node.type === 'text_note' ||
        node.type === 'audio_clip'
      ) {
        const idx = scripts.findIndex((s) => s.id === node.id);
        return {
          ...node,
          position: { x: 420, y: 110 + idx * 305 },
        };
      }
      if (node.type === 'storyboard') {
        const idx = storyboards
          .filter((s) => s.type === 'storyboard')
          .findIndex((sb) => sb.id === node.id);
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        return {
          ...node,
          position: {
            x: 835 + col * 325,
            y: 110 + row * 445,
          },
        };
      }
      if (node.type === 'storyboard_table') {
        return {
          ...node,
          position: { x: 835, y: 1015 },
        };
      }
      return node;
    });

    commitCommand('一键拓扑对齐全部画布节点', {
      nodes: nextNodes,
      edges,
      mountedSkillIds,
      selectedNodeId,
    });
    showToast('已按【一致性资产锚点 → 分场剧本 → 视觉分镜序列】完成拓扑对齐');
  };

  const handleRenderStoryboardNode = async (nodeId: string) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const beforeRenderSnap = getCurrentSnapshot();

    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, isRendering: true } } : n
      )
    );

    const upstream = getUpstreamNodesFor(nodeId);
    const characterAnchors = upstream
      .filter((n) => n.type === 'character')
      .map((n) => n.data);
    const sceneAnchors = upstream
      .filter((n) => n.type === 'scene_asset')
      .map((n) => n.data);

    try {
      const res = await fetch('/api/storyboard/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          customProvider: activeCustomProvider,
          node: targetNode,
          characterAnchors,
          sceneAnchors,
          useGrsaiDraw: !purePromptMode,
        }),
      });
      const json = await res.json();
      const synth = json.data;

      const nextNodes = beforeRenderSnap.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const activeTarget = n.data.videoModelTarget || defaultVideoModel;
        const nextPrompts = synth?.videoPrompts || n.data.videoPrompts;
        return {
          ...n,
          data: {
            ...n.data,
            isRendering: false,
            videoPrompts: nextPrompts,
            visualPrompt:
              nextPrompts?.[activeTarget] ||
              synth?.synthesizedPrompt ||
              n.data.visualPrompt,
            consistencyPrompt:
              n.type === 'character' || n.type === 'scene_asset'
                ? synth?.synthesizedPrompt || n.data.consistencyPrompt
                : n.data.consistencyPrompt,
            customSvgElements: {
              primaryHue: synth?.primaryHue || '#F59E0B',
              secondaryHue: synth?.secondaryHue || '#18181B',
              keyLightAngle: synth?.keyLightAngle || '45° 戏剧侧逆光',
              silhouetteType: synth?.silhouetteType || 'single_closeup',
              cameraVectorLabel:
                synth?.cameraVectorLabel ||
                `${n.data.cameraMove || '[Push in]'} · ${
                  n.data.focalLength || '35mm'
                }`,
              focalCaption:
                synth?.focalCaption || '已融合上游锚点实跑生成三套视频提示词',
            },
            lastRenderedAt: '刚刚实跑更新 (纯提示词)',
          },
        };
      });

      commitCommand(
        `AI 合成「${targetNode.data.title.split('·')[0]}」三套提示词`,
        {
          nodes: nextNodes,
          edges: beforeRenderSnap.edges,
          mountedSkillIds: beforeRenderSnap.mountedSkillIds,
          selectedNodeId,
        },
        beforeRenderSnap
      );
      showToast(
        `节点「${targetNode.data.title}」已实跑合成 Seedance 2.0 / 2.5 / MiniMax H3 提示词`
      );
    } catch {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, isRendering: false } } : n
        )
      );
    }
  };

  // Skill Mount / Unmount recorded in Command Pattern Undo/Redo
  const handleToggleMountSkill = (skillId: string) => {
    const skillObj = skills.find((s) => s.id === skillId);
    const isCurrentlyMounted = mountedSkillIds.includes(skillId);
    const nextSkillIds = isCurrentlyMounted
      ? mountedSkillIds.filter((id) => id !== skillId)
      : [...mountedSkillIds, skillId];

    commitCommand(
      `${isCurrentlyMounted ? '卸载' : '挂载'} Skill「${
        skillObj?.name.split(' ')[0] || skillId
      }」`,
      {
        nodes,
        edges,
        mountedSkillIds: nextSkillIds,
        selectedNodeId,
      }
    );
  };

  const handleSaveSkill = (skill: DramaSkill, autoMount = true) => {
    setSkills((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      if (exists) {
        return prev.map((s) => (s.id === skill.id ? skill : s));
      }
      return [...prev, skill];
    });
    if (autoMount && !mountedSkillIds.includes(skill.id)) {
      commitCommand(`新建并挂载 Skill「${skill.name}」`, {
        nodes,
        edges,
        mountedSkillIds: [...mountedSkillIds, skill.id],
        selectedNodeId,
      });
    }
  };

  const handleDeleteSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    setMountedSkillIds((prev) => prev.filter((id) => id !== skillId));
    showToast('自定义短剧 Skill 已删除');
  };

  const handleExecuteAgentPrompt = async (
    prompt: string,
    attachments: UploadedAttachment[] = []
  ) => {
    const startTimeMs = Date.now();
    const beforeAgentSnap = getCurrentSnapshot();
    const activeSkills = skills.filter((s) => mountedSkillIds.includes(s.id));

    const userMsg: AgentChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      mountedSkills: activeSkills.map((s) => s.name),
      attachments: attachments.map((a) => ({ name: a.name, kind: a.kind })),
      focusedNodeTitle: selectedNode?.data.title,
    };

    setAgentMessages((prev) => [...prev, userMsg]);
    setIsAgentRunning(true);

    try {
      const upstreamNodes = getUpstreamNodesFor(selectedNodeId);
      const allNodesSummary = nodes
        .filter((n) => n.type !== 'group')
        .map((n) => ({
          id: n.id,
          type: n.type,
          title: n.data.title,
        }));

      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          customProvider: activeCustomProvider,
          userPrompt: prompt,
          mountedSkills: activeSkills,
          attachments,
          selectedNode,
          upstreamNodes,
          allNodesSummary,
        }),
      });

      const json = await res.json();
      const payload = json?.data || {};
      const createdSpecs: any[] = payload.createdNodes || [];

      const spawnedNodes: CanvasNode[] = [];
      const spawnedEdges: CanvasEdge[] = [];

      const existingStoryboards = nodes.filter((n) => n.type === 'storyboard');
      const existingCharacters = nodes.filter((n) => n.type === 'character');
      const primaryScriptNode =
        (selectedNode?.type === 'script' ? selectedNode : null) ||
        nodes.find((n) => n.type === 'script');

      createdSpecs.forEach((spec, idx) => {
        const newId = `node-ai-${Date.now()}-${idx}`;
        const nodeType: NodeCategory =
          spec.type === 'character' ||
          spec.type === 'scene_asset' ||
          spec.type === 'script' ||
          spec.type === 'storyboard'
            ? spec.type
            : 'storyboard';

        let pos = { x: 860 + idx * 320, y: 520 };
        if (nodeType === 'character' || nodeType === 'scene_asset') {
          pos = { x: 50, y: 120 + (existingCharacters.length + idx + 1) * 260 };
        } else if (nodeType === 'script') {
          pos = { x: 420, y: 520 + idx * 300 };
        } else if (nodeType === 'storyboard') {
          const totalIdx = existingStoryboards.length + idx;
          pos = {
            x: 835 + (totalIdx % 3) * 325,
            y: 110 + Math.floor(totalIdx / 3) * 445,
          };
        }

        const targetVm: VideoModelTarget =
          spec.videoModelTarget === 'seedance_2_0' ||
          spec.videoModelTarget === 'seedance_2_5' ||
          spec.videoModelTarget === 'minimax_h3'
            ? spec.videoModelTarget
            : defaultVideoModel;

        const fallbackPrompts = {
          minimax_h3:
            spec.videoPrompts?.minimax_h3 ||
            spec.visualPrompt ||
            `[Push in] Subject_Lock: (Xie Changqing @Image1 on Vintage Lathe @Image2). At 00:00.000, ${
              spec.title || 'cinematic shot'
            }.`,
          seedance_2_0:
            spec.videoPrompts?.seedance_2_0 ||
            `[Xie Changqing (@Image1)] + [${
              spec.title || 'dramatic action'
            }] + in [Gobi Highway (@Image4)] + Camera: [${
              spec.cameraMove || 'Push in'
            } + Lock]; Lens: [${
              spec.focalLength || '35mm'
            }]; Stability: [Steadicam] + Style: [Wasteland cinema] + Avoid: [morphing]`,
          seedance_2_5:
            spec.videoPrompts?.seedance_2_5 ||
            `Refs: [@Image1, @Image2, @Audio1] | Shot 1 (0.0s - 1.8s) [Hook]: ${spec.title} -> Shot 2 (1.8s - 3.5s) [Climax]: Emotional close-up.`,
        };

        const newNode: CanvasNode = {
          id: newId,
          type: nodeType,
          position: pos,
          width: nodeType === 'script' ? 340 : 295,
          data: {
            title: spec.title || 'AI 新增节点',
            subtitle:
              spec.subtitle ||
              (nodeType === 'storyboard'
                ? `${spec.shotSize || '特写 (CU)'} · 竖屏 9:16`
                : 'Omni-Agent 纯提示词生成'),
            sceneNumber: spec.sceneNumber,
            location: spec.location,
            timeOfDay: spec.timeOfDay,
            hookPoint: spec.hookPoint,
            reversalPoint: spec.reversalPoint,
            scriptBody: spec.scriptBody,
            roleType: spec.roleType,
            consistencyPrompt: spec.consistencyPrompt,
            costumeDetails: spec.costumeDetails,
            lightingMood: spec.lightingMood,
            shotNumber:
              spec.shotNumber ||
              (nodeType === 'storyboard'
                ? `SHOT 0${existingStoryboards.length + idx + 1}`
                : undefined),
            aspectRatio: spec.aspectRatio === '16:9' ? '16:9' : '9:16',
            shotSize: spec.shotSize || '特写 (CU)',
            cameraMove: spec.cameraMove || '[Push in]',
            focalLength: spec.focalLength || '35mm f/1.4',
            videoModelTarget: targetVm,
            visualPrompt: fallbackPrompts[targetVm],
            videoPrompts: fallbackPrompts,
            dialogueSnippet: spec.dialogueSnippet,
            speakerName: spec.speakerName,
            durationSec: spec.durationSec || 3.5,
            customSvgElements: {
              primaryHue: spec.primaryHue || '#F59E0B',
              secondaryHue: spec.secondaryHue || '#18181B',
              keyLightAngle: spec.lightingMood || '45° 戈壁侧逆光',
              silhouetteType: spec.silhouetteType || 'single_closeup',
              cameraVectorLabel: `${spec.cameraMove || '[Push in]'} · ${
                spec.focalLength || '35mm'
              }`,
              focalCaption: 'Omni-Director Agent 实跑生成（纯提示词）',
            },
            lastRenderedAt: '实跑完成 (纯提示词)',
          },
        };

        spawnedNodes.push(newNode);

        if (nodeType === 'storyboard') {
          if (primaryScriptNode) {
            spawnedEdges.push({
              id: `edge-ai-script-${Date.now()}-${idx}`,
              sourceNodeId: primaryScriptNode.id,
              targetNodeId: newId,
              relationType: 'script_breakdown',
            });
          }
          if (existingCharacters[0]) {
            spawnedEdges.push({
              id: `edge-ai-char-${Date.now()}-${idx}`,
              sourceNodeId: existingCharacters[0].id,
              targetNodeId: newId,
              relationType: 'character_ref',
            });
          }
        } else if (nodeType === 'character' && primaryScriptNode) {
          spawnedEdges.push({
            id: `edge-ai-c2s-${Date.now()}-${idx}`,
            sourceNodeId: newId,
            targetNodeId: primaryScriptNode.id,
            relationType: 'character_ref',
          });
        }
      });

      if (spawnedNodes.length > 0) {
        commitCommand(
          `Agent 编排生成 ${spawnedNodes.length} 个画布节点`,
          {
            nodes: [...beforeAgentSnap.nodes, ...spawnedNodes],
            edges: [...beforeAgentSnap.edges, ...spawnedEdges],
            mountedSkillIds: beforeAgentSnap.mountedSkillIds,
            selectedNodeId: spawnedNodes[0].id,
          },
          beforeAgentSnap
        );
      }

      const elapsedSec = Math.max(
        1.2,
        Number(((Date.now() - startTimeMs) / 1000).toFixed(1))
      );

      const rawThinkingSteps: string[] = Array.isArray(payload.thinkingSteps)
        ? payload.thinkingSteps
        : [
            `解析导演指令，调度已挂载的 ${activeSkills.length} 个短剧专精 Skill（含漫剧老李文武双模与 Seedance 导演公式）。`,
            `读取当前焦点节点「${
              selectedNode?.data.title || '《公路求生》全局画布'
            }」及其上游 ${upstreamNodes.length} 个一致性资产锚点。`,
            `按照 180° 轴线规则、FACS 微表情六阶段与动作相位七态拆格生成 ${spawnedNodes.length} 个画布节点（纯提示词模式）。`,
          ];

      const toolCalls = [
        {
          id: `tc-skill-${Date.now()}`,
          toolName: 'mount_skills',
          target: `skills/${activeSkills[0]?.id || 'manju-laoli-director'}.md`,
          detail: `挂载 ${activeSkills.length} 个导演 Skill`,
          status: 'completed' as const,
        },
        {
          id: `tc-anchor-${Date.now()}`,
          toolName: 'read_upstream_anchors',
          target: `canvas/${selectedNode?.id || 'highway-survival'}.json`,
          detail: `解析 @Image1/@Image2 锚点`,
          status: 'completed' as const,
        },
        ...spawnedNodes.map((sn, i) => ({
          id: `tc-node-${Date.now()}-${i}`,
          toolName: 'create_canvas_node',
          target: `nodes/${sn.type}/${sn.data.shotNumber || sn.id}.prompt`,
          detail: sn.data.title,
          status: 'completed' as const,
        })),
        {
          id: `tc-edge-${Date.now()}`,
          toolName: 'connect_port_edges',
          target: `canvas/edges-port-sync.svg`,
          detail: `新增 ${spawnedEdges.length} 条圆心连线`,
          status: 'completed' as const,
        },
      ];

      const replyMsg: AgentChatMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        modelUsed: json?.modelUsed || selectedModelId,
        content:
          payload.agentReply ||
          `已根据挂载的 Skill 在画布上生成 ${spawnedNodes.length} 个新节点并编译完成全套视频与资产提示词。`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        spawnedNodeIds: spawnedNodes.map((n) => n.id),
        actionHistory: {
          durationLabel: `${elapsedSec}s`,
          summaryHeader: `Edited ${toolCalls.length} items`,
          thinkingSteps: rawThinkingSteps,
          toolCalls,
          builtStatus: 'Built · 纯提示词编译完成',
        },
      };
      setAgentMessages((prev) => [...prev, replyMsg]);
      showToast(
        `已通过 ${json?.modelUsed || selectedModelId} 在画布生成 ${
          spawnedNodes.length
        } 个节点（支持 Ctrl+Z 撤销）`
      );
    } catch {
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: 'Agent 节点编排请求超时，请重试或在设置中切换其他 AI 运营商。',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleExportProject = () => {
    const exportPayload = {
      studio: '帧界 FrameVerse AI Short Drama Canvas',
      exportedAt: new Date().toISOString(),
      activeTemplateId,
      selectedModelId,
      purePromptMode,
      edgeColor,
      mountedSkills: skills.filter((s) => mountedSkillIds.includes(s.id)),
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frameverse-highway-survival-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出完整 AI 短剧无限画布分镜与提示词工程文件 (.json)');
  };

  const lastUndoLabel =
    undoStack.length > 0 ? undoStack[undoStack.length - 1].label : undefined;
  const lastRedoLabel =
    redoStack.length > 0 ? redoStack[redoStack.length - 1].label : undefined;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        className={`w-screen h-screen flex flex-col overflow-hidden transition-colors ${
          darkMode
            ? 'bg-zinc-950 text-zinc-100'
            : 'bg-[#F8FAFC] text-slate-900'
        }`}
      >
        {/* Strict Top Bar Contract: Single Row, 3 Zones separated by gap-8 */}
        <header
          className={`h-14 px-6 border-b flex items-center justify-between gap-8 shrink-0 z-30 transition-colors ${
            darkMode
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Zone 1: Brand Title */}
          <a
            href="#canvas"
            onClick={(e) => e.preventDefault()}
            className="text-base font-bold tracking-tight whitespace-nowrap shrink-0 font-display"
          >
            帧界 FrameVerse
          </a>

          {/* Zone 2: 4 Concise Single-Line Navigation Links */}
          <nav
            className={`hidden md:flex items-center gap-7 text-xs font-medium ${
              darkMode ? 'text-zinc-400' : 'text-slate-600'
            }`}
          >
            <a
              href="#canvas"
              onClick={(e) => {
                e.preventDefault();
                setIsSkillStudioOpen(false);
                setIsStoryboardPlayerOpen(false);
                setIsSettingsOpen(false);
              }}
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                darkMode ? 'text-zinc-100' : 'text-slate-900'
              }`}
            >
              无限画布工作台
            </a>
            <a
              href="#project-manager"
              onClick={(e) => {
                e.preventDefault();
                setIsProjectManagerOpen(true);
              }}
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                darkMode ? 'hover:text-zinc-100' : 'hover:text-slate-900'
              }`}
            >
              项目管理 ({projects.length})
            </a>
            <a
              href="#skill-studio"
              onClick={(e) => {
                e.preventDefault();
                setSkillStudioTargetId('skill-seedance-director-suite');
                setIsSkillStudioOpen(true);
              }}
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                darkMode ? 'hover:text-zinc-100' : 'hover:text-slate-900'
              }`}
            >
              短剧与视频模型 Skill 库 ({skills.length})
            </a>
            <a
              href="#storyboard-preview"
              onClick={(e) => {
                e.preventDefault();
                setIsStoryboardPlayerOpen(true);
              }}
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                darkMode ? 'hover:text-zinc-100' : 'hover:text-slate-900'
              }`}
            >
              竖屏故事板连播
            </a>
            <a
              href="#settings-providers"
              onClick={(e) => {
                e.preventDefault();
                setIsSettingsOpen(true);
              }}
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                darkMode ? 'hover:text-zinc-100' : 'hover:text-slate-900'
              }`}
            >
              设置与 AI 运营商 ({allModels.length})
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportProject}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出短剧工程</span>
            </button>
          </div>
        </header>

        {/* Secondary Contextual Workspace Sub-Bar with Project Switcher, Undo/Redo & Settings */}
        <div
          className={`h-10 px-6 border-b flex items-center justify-between gap-4 text-xs shrink-0 z-20 transition-colors ${
            darkMode
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200'
              : 'bg-slate-50/90 border-slate-200/80 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsProjectManagerOpen(true)}
              className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="打开项目管理中心（新建 / 删除 / 复制画布）"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span>项目管理 ({projects.length})</span>
            </button>

            <div
              className={`flex items-center gap-1 p-0.5 rounded-lg border overflow-x-auto max-w-[460px] ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-800'
                  : 'bg-slate-200/70 border-slate-200'
              }`}
            >
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => handleSwitchTemplate(proj.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTemplateId === proj.id
                      ? darkMode
                        ? 'bg-zinc-800 text-zinc-100 shadow-2xs'
                        : 'bg-white text-slate-900 shadow-2xs'
                      : darkMode
                      ? 'text-zinc-400 hover:text-zinc-100'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {proj.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsProjectManagerOpen(true)}
                title="新建或管理短剧画布"
                className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  darkMode
                    ? 'text-emerald-400 hover:bg-zinc-800'
                    : 'text-emerald-700 hover:bg-white'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>新建/删改</span>
              </button>
            </div>

            {/* Command Pattern Undo / Redo Status in Sub-Bar */}
            <div
              className={`hidden lg:flex items-center gap-1 pl-2 border-l ${
                darkMode ? 'border-zinc-800' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleUndo}
                title={
                  lastUndoLabel
                    ? `撤销 (Ctrl+Z)：${lastUndoLabel}`
                    : '暂无可撤销操作'
                }
                className={`px-2 py-1 rounded-md flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-35 ${
                  darkMode
                    ? 'hover:bg-zinc-800 text-zinc-200'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>撤销 ({undoStack.length})</span>
              </button>

              <button
                type="button"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
                title={
                  lastRedoLabel
                    ? `重做 (Ctrl+Y)：${lastRedoLabel}`
                    : '暂无可重做操作'
                }
                className={`px-2 py-1 rounded-md flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-35 ${
                  darkMode
                    ? 'hover:bg-zinc-800 text-zinc-200'
                    : 'hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>重做 ({redoStack.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const sbIds = nodes
                  .filter((n) => n.type === 'storyboard')
                  .map((n) => n.id);
                sbIds.forEach((id) => handleRenderStoryboardNode(id));
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'text-amber-400 hover:bg-zinc-800'
                  : 'text-amber-700 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ 重新实跑全部分镜提示词 (纯提示词不出图)</span>
            </button>

            <span className={darkMode ? 'text-zinc-700' : 'text-slate-300'}>
              |
            </span>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>AI 运营商与设置</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700'
                  : 'bg-slate-200/70 border-slate-300 text-slate-800 hover:bg-slate-300/70'
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>浅色画布</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>暗房模式</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Split Workspace */}
        <main className="flex-1 flex min-h-0 relative">
          <InfiniteCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            darkMode={darkMode}
            edgeColor={edgeColor}
            isAgentPanelOpen={isAgentPanelOpen}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            undoLabel={lastUndoLabel}
            redoLabel={lastRedoLabel}
            models={allModels}
            selectedModelId={selectedModelId}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSelectModel={(mid) => {
              setSelectedModelId(mid);
              const found = allModels.find((m) => m.id === mid);
              if (found) {
                showToast(
                  `已切换模型引擎为：${found.providerLabel} · ${found.displayName}`
                );
              }
            }}
            onChangeEdgeColor={setEdgeColor}
            onToggleAgentPanel={() => setIsAgentPanelOpen((o) => !o)}
            onSelectNode={setSelectedNodeId}
            onNodeDragStart={handleNodeDragStart}
            onUpdateNodePosition={handleUpdateNodePosition}
            onNodeDragEnd={handleNodeDragEnd}
            onUpdateNodeData={handleUpdateNodeData}
            onSwitchNodeVideoModel={handleSwitchNodeVideoModel}
            onAddNode={handleAddNode}
            onAddConnectedNode={handleAddConnectedNode}
            onDeleteNode={handleDeleteNode}
            onAddEdge={handleAddEdge}
            onDeleteEdge={handleDeleteEdge}
            onRenderStoryboardNode={handleRenderStoryboardNode}
            onOpenNodeInspector={(id) => setInspectorNodeId(id)}
            onAutoLayout={handleAutoLayout}
          />

          {isAgentPanelOpen && (
            <OmniAgentPanel
              models={allModels}
              selectedModelId={selectedModelId}
              skills={skills}
              mountedSkillIds={mountedSkillIds}
              selectedNode={selectedNode}
              upstreamNodes={getUpstreamNodesFor(selectedNodeId)}
              messages={agentMessages}
              isRunning={isAgentRunning}
              darkMode={darkMode}
              onSelectModel={(mid) => {
                setSelectedModelId(mid);
                const found = allModels.find((m) => m.id === mid);
                if (found) {
                  showToast(
                    `已切换 Agent 引擎为：${found.providerLabel} · ${found.displayName}`
                  );
                }
              }}
              onToggleMountSkill={handleToggleMountSkill}
              onExecuteAgentPrompt={handleExecuteAgentPrompt}
              onCreateNodeFromAttachment={handleCreateNodeFromAttachment}
              onOpenSkillStudio={(targetId) => {
                setSkillStudioTargetId(targetId);
                setIsSkillStudioOpen(true);
              }}
              onFocusNode={(nodeId) => {
                setSelectedNodeId(nodeId);
              }}
              onToggleCollapse={() => setIsAgentPanelOpen(false)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {toastNotice && (
            <div
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl border text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{toastNotice}</span>
            </div>
          )}
        </main>

        <SettingsModal
          isOpen={isSettingsOpen}
          darkMode={darkMode}
          builtInModels={VERIFIED_AGENT_MODELS}
          customProviders={customProviders}
          selectedModelId={selectedModelId}
          purePromptMode={purePromptMode}
          defaultVideoModel={defaultVideoModel}
          edgeColor={edgeColor}
          onClose={() => setIsSettingsOpen(false)}
          onAddCustomProvider={(newProv) => {
            setCustomProviders((prev) => [...prev, newProv]);
            if (newProv.models.length > 0) {
              setSelectedModelId(`custom:${newProv.id}:${newProv.models[0]}`);
            }
            showToast(`已成功接入自定义 AI 运营商「${newProv.name}」`);
          }}
          onDeleteCustomProvider={(provId) => {
            setCustomProviders((prev) => prev.filter((p) => p.id !== provId));
            if (selectedModelId.startsWith(`custom:${provId}:`)) {
              setSelectedModelId(VERIFIED_AGENT_MODELS[0].id);
            }
            showToast('已移除自定义 AI 运营商');
          }}
          onSelectModel={(mid) => {
            setSelectedModelId(mid);
            showToast(`已切换当前激活模型为：${mid}`);
          }}
          onTogglePurePromptMode={setPurePromptMode}
          onChangeDefaultVideoModel={setDefaultVideoModel}
          onChangeEdgeColor={setEdgeColor}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
        />

        <SkillStudioModal
          isOpen={isSkillStudioOpen}
          skills={skills}
          initialSelectedSkillId={skillStudioTargetId}
          mountedSkillIds={mountedSkillIds}
          selectedModelId={selectedModelId}
          darkMode={darkMode}
          onClose={() => setIsSkillStudioOpen(false)}
          onSaveSkill={handleSaveSkill}
          onDeleteSkill={handleDeleteSkill}
          onToggleMountSkill={handleToggleMountSkill}
        />

        <NodeInspectorModal
          node={inspectorNode}
          upstreamNodes={getUpstreamNodesFor(inspectorNodeId)}
          darkMode={darkMode}
          onClose={() => setInspectorNodeId(null)}
          onUpdateNode={(nid, data) => handleUpdateNodeData(nid, data)}
          onRenderStoryboardNode={(nid) => handleRenderStoryboardNode(nid)}
        />

        <StoryboardPlayerModal
          isOpen={isStoryboardPlayerOpen}
          nodes={nodes}
          edges={edges}
          darkMode={darkMode}
          onClose={() => setIsStoryboardPlayerOpen(false)}
          onRenderShot={(id) => handleRenderStoryboardNode(id)}
        />

        <ProjectManagerModal
          isOpen={isProjectManagerOpen}
          darkMode={darkMode}
          projects={projects}
          activeProjectId={activeTemplateId}
          onClose={() => setIsProjectManagerOpen(false)}
          onSelectProject={handleSwitchTemplate}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onResetDefaultProjects={handleResetDefaultProjects}
        />
      </div>
    </div>
  );
}
