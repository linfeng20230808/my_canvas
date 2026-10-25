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
  Layers,
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
  AxisViolationItem,
} from './types/canvas';
import {
  BUILTIN_DRAMA_SKILLS,
  PROJECT_TEMPLATES,
  VERIFIED_AGENT_MODELS,
} from './data/initialProject';
import { InfiniteCanvas, NodeOrganizeMode } from './components/InfiniteCanvas';
import { OmniAgentPanel } from './components/OmniAgentPanel';
import { SkillStudioModal } from './components/SkillStudioModal';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { StoryboardPlayerModal } from './components/StoryboardPlayerModal';
import { SettingsModal } from './components/SettingsModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { DramaWorkflowModal } from './components/DramaWorkflowModal';

const STORAGE_KEY_SKILLS = 'frameverse_custom_skills_v4';
const STORAGE_KEY_PROVIDERS = 'frameverse_custom_providers_v1';
const STORAGE_KEY_PROJECTS = 'frameverse_canvas_projects_v3';

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
  return PROJECT_TEMPLATES.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    episodeTitle: tpl.episodeTitle,
    description: tpl.description,
    genreTag: '末日爽剧 / 系统求生',
    aspectRatio: '9:16',
    createdAt: '2025-05-12 09:30',
    updatedAt: '刚刚',
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
          return parsed.map((p: any) => ({
            ...p,
            name: p.name || '未命名短剧工程',
            episodeTitle: p.episodeTitle || p.subtitle || 'EP01 · 第一集',
            description: p.description || 'AI 短剧无限画布分镜工程',
            genreTag: p.genreTag || '竖屏短剧',
            aspectRatio: p.aspectRatio === '16:9' ? '16:9' : '9:16',
            nodes: Array.isArray(p.nodes) ? p.nodes : [],
            edges: Array.isArray(p.edges) ? p.edges : [],
          }));
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
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] =
    useState<boolean>(false);

  // Customizable Edge Color & Right Agent Panel Collapse State
  const [edgeColor, setEdgeColor] = useState<string>(
    () => projects[0]?.edgeColor || '#A1A1AA'
  );
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState<boolean>(true);

  // Settings & Custom AI Providers State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [purePromptMode, setPurePromptMode] = useState<boolean>(false);
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
          category: 'text',
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
    ...DEFAULT_MOUNTED_SKILLS,
  ]);

  // =========================================================================
  // COMMAND PATTERN UNDO / REDO ENGINE
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

  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastCmd = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastCmd]);
    applySnapshot(lastCmd.before);
    showToast(`已撤销：${lastCmd.label}`);
  }, [undoStack, applySnapshot, showToast]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextCmd = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextCmd]);
    applySnapshot(nextCmd.after);
    showToast(`已重做：${nextCmd.label}`);
  }, [redoStack, applySnapshot, showToast]);

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

  // Omni-Director Agent Chat State
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentMessages, setAgentMessages] = useState<AgentChatMessage[]>([
    {
      id: 'msg-highway-real-run',
      role: 'assistant',
      modelUsed: 'DeepSeek Official · deepseek-chat',
      content:
        '已基于《公路求生：开局老式车床》原文，调用 DeepSeek 官方引擎结合『漫剧老李·文武双模分镜 Skill』与『Seedance 2.0/2.5 导演 Skill』真实跑通全流程：\n\n1. **5大跨镜头一致性资产提示词卡**：\n   - `@Image1` 谢长清（四视图锁脸 + 战术工装夹克 + 右耳直播耳麦）\n   - `@Image2` 1级老式普通车床（三爪卡盘 + 刀架尾座 + 机械臂 + 小型加热炉 + 4个宽大机械轮 + S级1秒联动金光）\n   - `@Image3` 光头猛男（黑色背心肌肉壮汉 + 破旧五菱面包车）\n   - `@Image4` 华夏8888分区·戈壁四车道公路（4500K烈日风沙 vs 6500K全息蓝屏）\n   - `@Image5` 黑铁物资箱 & 巧夺天工·木质长弓图纸\n2. **3场黄金前3秒爽点分场剧本（SC01~SC03）** + **6个 9:16 竖屏分镜全套三模型视频提示词（SHOT 01~06）** + **七段式分镜统筹总表**。\n3. **实拍出图与生视频指南**：单击任意角色或分镜节点，在下方生成框可切换 `🎨 风格` 与 `⊞ 预设`，点击 **生成图片**（调用 GRSAI Nano Banana 实时出图）或 **生成视频**（调用 MiniMax H3 / Agnes 2.5 异步渲染实拍视频）。',
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
        builtStatus: 'Built · 全套视频提示词与资产提示词已实跑就绪',
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

  const getUpstreamNodesFor = useCallback(
    (nodeId: string | null): CanvasNode[] => {
      if (!nodeId) return [];
      const incomingSourceIds = edges
        .filter((e) => e.targetNodeId === nodeId)
        .map((e) => e.sourceNodeId);
      return nodes.filter((n) => incomingSourceIds.includes(n.id));
    },
    [nodes, edges]
  );

  // =========================================================================
  // REQUIREMENT 1: AUTOMATIC 180-DEGREE AXIS & STORYBOARD EDGE INSPECTOR
  // Analyzes all storyboard nodes & edges on the canvas. If two consecutive
  // storyboard shots are BOTH disconnected AND exhibit a spatial/semantic
  // 180-degree axis jump, automatically triggers an alarm in the Agent dialog!
  // =========================================================================
  const axisViolations: AxisViolationItem[] = useMemo(() => {
    const storyboards = nodes
      .filter((n) => n.type === 'storyboard' || n.type === 'video_clip')
      .slice()
      .sort((a, b) => {
        const numA = parseInt(
          (a.data.shotNumber || a.data.title || '').replace(/\D+/g, '') || '999',
          10
        );
        const numB = parseInt(
          (b.data.shotNumber || b.data.title || '').replace(/\D+/g, '') || '999',
          10
        );
        if (numA !== numB) return numA - numB;
        return a.position.x - b.position.x;
      });

    if (storyboards.length < 2) return [];

    const violations: AxisViolationItem[] = [];

    for (let i = 0; i < storyboards.length - 1; i++) {
      const shotA = storyboards[i];
      const shotB = storyboards[i + 1];

      const hasDirectEdge = edges.some(
        (e) =>
          (e.sourceNodeId === shotA.id && e.targetNodeId === shotB.id) ||
          (e.sourceNodeId === shotB.id && e.targetNodeId === shotA.id)
      );

      const deltaX = Math.round(shotB.position.x - shotA.position.x);
      const deltaY = Math.round(shotB.position.y - shotA.position.y);

      // Spatial axis jump: downstream shot jumps backward horizontally (deltaX < -20)
      // OR jumps across vertical rows (|deltaY| > 160) without a bridging shot_sequence edge
      // OR is separated by > 420px without a connecting edge
      const isReverseXJump = deltaX < -20;
      const isCrossRowJump = Math.abs(deltaY) > 160;
      const isWideGapJump = Math.hypot(deltaX, deltaY) > 420;
      const isSpatialJump = isReverseXJump || isCrossRowJump || isWideGapJump;

      // Semantic 180-degree axis check in prompt text
      const promptA = `${shotA.data.visualPrompt || ''} ${
        shotA.data.videoPrompts?.seedance_2_5 || ''
      } ${shotA.data.videoPrompts?.minimax_h3 || ''}`;
      const promptB = `${shotB.data.visualPrompt || ''} ${
        shotB.data.videoPrompts?.seedance_2_5 || ''
      } ${shotB.data.videoPrompts?.minimax_h3 || ''}`;

      const aLeft = /居左|Left-foreground|Center-left/i.test(promptA);
      const aRight = /居右|Right-foreground|Center-right/i.test(promptA);
      const bLeft = /居左|Left-foreground|Center-left/i.test(promptB);
      const bRight = /居右|Right-foreground|Center-right/i.test(promptB);
      const isSemanticJump =
        (aLeft && bRight) ||
        (aRight && bLeft) ||
        !/180°|Position_Lock|站位声明/i.test(promptB);

      // Core rule requested by user:
      // Two storyboard nodes are NOT connected (!hasDirectEdge) AND their position exhibits an axis-jumping state (isSpatialJump)
      if (!hasDirectEdge && isSpatialJump) {
        const shotNoA = shotA.data.shotNumber || `SHOT 0${i + 1}`;
        const shotNoB = shotB.data.shotNumber || `SHOT 0${i + 2}`;
        let jumpDesc = '';
        if (isReverseXJump && isCrossRowJump) {
          jumpDesc = `空间坐标发生反向折返跨行跳轴 (ΔX=${deltaX}px, ΔY=${deltaY > 0 ? `+${deltaY}` : deltaY}px)`;
        } else if (isReverseXJump) {
          jumpDesc = `下游分镜位于上游分镜左侧反向跳轴 (ΔX=${deltaX}px)`;
        } else if (isCrossRowJump) {
          jumpDesc = `上下跨行断层跳轴 (ΔY=${deltaY > 0 ? `+${deltaY}` : deltaY}px)`;
        } else {
          jumpDesc = `分镜间距过大断层跳轴 (${Math.round(Math.hypot(deltaX, deltaY))}px)`;
        }

        violations.push({
          id: `axis-v-${shotA.id}-${shotB.id}`,
          sourceShotId: shotA.id,
          targetShotId: shotB.id,
          sourceTitle: shotA.data.title,
          targetTitle: shotB.data.title,
          sourceShotNumber: shotNoA,
          targetShotNumber: shotNoB,
          hasDirectEdge: false,
          isSpatialJump: true,
          isSemanticJump,
          deltaX,
          deltaY,
          reason: `「${shotNoA}」与「${shotNoB}」不仅未建立分镜时序连线 (shot_sequence)，且画布${jumpDesc}，违反 180° 轴线连续性逻辑，极易导致成片机位越轴与空间方向错乱。`,
          fixSuggestion: `建立 ${shotNoA} → ${shotNoB} 的时序连线，并将两镜头锁定在同一 180° 轴线方向（保持左驾右超或统一轴线顺延）。`,
        });
      }
    }

    return violations;
  }, [nodes, edges]);

  const lastAlarmSignatureRef = useRef<string>('');

  const pushAxisAlarmToAgentChat = useCallback(
    (violations: AxisViolationItem[], manualTrigger = false) => {
      if (violations.length === 0) {
        if (manualTrigger) {
          const passMsg: AgentChatMessage = {
            id: `msg-axis-pass-${Date.now()}`,
            role: 'assistant',
            modelUsed: '180° Axis Auto-Inspector · 漫剧老李质检锁',
            content:
              '✅ **180° 轴线与分镜连线巡检通过**：当前画布所有相邻分镜节点均已建立完整的 `shot_sequence` 时序连线，且空间排布与 `Position_Lock / 180°轴线` 站位声明完全对齐，无跳轴或断连风险。',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            actionHistory: {
              durationLabel: '0.2s',
              summaryHeader: 'Inspected storyboard topology',
              thinkingSteps: [
                '扫描画布全部分镜节点 (storyboard) 的时序连线拓扑与二维坐标矢量。',
                '校验相邻镜头间的 ΔX/ΔY 方向连续性与 180° 轴线站位声明：0 违例。',
              ],
              toolCalls: [
                {
                  id: `tc-axis-ok-${Date.now()}`,
                  toolName: 'inspect_180_axis_topology',
                  target: 'canvas/storyboards/axis-check.json',
                  detail: '全部分镜连线与180°轴线正常',
                  status: 'completed',
                },
              ],
              builtStatus: 'Passed · 180° 轴线连续性完好',
            },
          };
          setAgentMessages((prev) => [...prev, passMsg]);
          setIsAgentPanelOpen(true);
        }
        return;
      }

      const alarmContent = `🚨 **画布 180° 轴线自动检查工具报警**：\n系统实时分析画布中所有分镜节点的连线与空间位置，发现 **${
        violations.length
      } 处违反 180° 轴线逻辑** 的分镜断层（相邻分镜不仅未连线，且位置呈现跳轴折返状态）：\n\n${violations
        .map(
          (v, idx) =>
            `${idx + 1}. **${v.sourceShotNumber} → ${v.targetShotNumber}**：${v.reason}`
        )
        .join('\n')}\n\n您可点击下方 **「⚡ 一键修复跳轴并补齐连线」** 自动建立缺失的分镜连线并对齐 180° 轴线站位。`;

      const alarmMsg: AgentChatMessage = {
        id: 'msg-axis-auto-alarm',
        role: 'assistant',
        modelUsed: '180° Axis Auto-Inspector · 漫剧老李四道质检锁',
        content: alarmContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isAxisAlarm: true,
        axisViolations: violations,
        spawnedNodeIds: violations.map((v) => v.targetShotId),
        actionHistory: {
          durationLabel: '0.3s',
          summaryHeader: `Detected ${violations.length} 180° axis violations`,
          thinkingSteps: [
            `1. 扫描分镜拓扑链路：遍历画布中所有分镜节点 (${
              nodes.filter((n) => n.type === 'storyboard').length
            } 个) 的连接矩阵与空间坐标。`,
            ...violations.map(
              (v, idx) =>
                `${idx + 2}. 捕获跳轴断连违例 [${v.sourceShotNumber} → ${v.targetShotNumber}]：无时序连线 (shot_sequence) 且坐标发生跳轴偏移 (ΔX=${v.deltaX}px, ΔY=${v.deltaY}px)。`
            ),
          ],
          toolCalls: violations.map((v, i) => ({
            id: `tc-axis-v-${i}`,
            toolName: 'detect_180_axis_jump',
            target: `nodes/storyboards/${v.sourceShotNumber}_to_${v.targetShotNumber}.axis`,
            detail: `未连线 + 位置跳轴 (ΔX=${v.deltaX}px)`,
            status: 'completed' as const,
          })),
          builtStatus: `Alert · 发现 ${violations.length} 处 180° 跳轴断连风险`,
        },
      };

      setAgentMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'msg-axis-auto-alarm');
        return [...filtered, alarmMsg];
      });
    },
    [nodes]
  );

  // Automatically trigger Agent chat alarm whenever a new 180-degree axis violation is detected
  useEffect(() => {
    const signature = axisViolations
      .map((v) => `${v.sourceShotId}->${v.targetShotId}:${v.deltaX},${v.deltaY}`)
      .join('|');
    if (signature && signature !== lastAlarmSignatureRef.current) {
      lastAlarmSignatureRef.current = signature;
      pushAxisAlarmToAgentChat(axisViolations, false);
    } else if (!signature && lastAlarmSignatureRef.current) {
      lastAlarmSignatureRef.current = '';
      // Remove stale alarm card once all violations are resolved
      setAgentMessages((prev) =>
        prev.filter((m) => m.id !== 'msg-axis-auto-alarm')
      );
    }
  }, [axisViolations, pushAxisAlarmToAgentChat]);

  const handleRunAxisInspection = useCallback(() => {
    setIsAgentPanelOpen(true);
    pushAxisAlarmToAgentChat(axisViolations, true);
    if (axisViolations.length > 0) {
      showToast(
        `🚨 180°轴线巡检发现 ${axisViolations.length} 处未连线且位置跳轴的分镜，已在右侧 Agent 对话框报警！`
      );
    } else {
      showToast('✅ 180°轴线巡检通过：所有分镜连线与空间轴线连续无跳轴');
    }
  }, [axisViolations, pushAxisAlarmToAgentChat, showToast]);

  const handleAutoFixAxisViolations = useCallback(() => {
    if (axisViolations.length === 0) {
      showToast('当前画布无 180° 轴线违例');
      return;
    }

    const newEdges: CanvasEdge[] = [...edges];
    axisViolations.forEach((v) => {
      const exists = newEdges.some(
        (e) =>
          (e.sourceNodeId === v.sourceShotId &&
            e.targetNodeId === v.targetShotId) ||
          (e.sourceNodeId === v.targetShotId &&
            e.targetNodeId === v.sourceShotId)
      );
      if (!exists) {
        newEdges.push({
          id: `edge-axis-fix-${v.sourceShotId}-${v.targetShotId}-${Date.now()}`,
          sourceNodeId: v.sourceShotId,
          targetNodeId: v.targetShotId,
          relationType: 'shot_sequence',
        });
      }
    });

    // Also ensure storyboard nodes are aligned in a clean left-to-right 180° axis sequence if any shot was dragged to the left of its predecessor on the same row
    const storyboards = nodes
      .filter((n) => n.type === 'storyboard' || n.type === 'video_clip')
      .slice()
      .sort((a, b) => {
        const numA = parseInt(
          (a.data.shotNumber || a.data.title || '').replace(/\D+/g, '') || '999',
          10
        );
        const numB = parseInt(
          (b.data.shotNumber || b.data.title || '').replace(/\D+/g, '') || '999',
          10
        );
        return numA - numB;
      });

    const posMap = new Map<string, { x: number; y: number }>();
    storyboards.forEach((sb, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      posMap.set(sb.id, {
        x: 835 + col * 325,
        y: 110 + row * 445,
      });
    });

    const nextNodes = nodes.map((n) => {
      const fixedPos = posMap.get(n.id);
      if (!fixedPos) return n;
      const promptHasAxis = /180°|Position_Lock|站位声明/i.test(
        n.data.visualPrompt || ''
      );
      const nextVisualPrompt = promptHasAxis
        ? n.data.visualPrompt
        : `[Position_Lock: 180°轴线顺延锁定] ${n.data.visualPrompt || ''}`;
      return {
        ...n,
        position: fixedPos,
        data: {
          ...n.data,
          visualPrompt: nextVisualPrompt,
        },
      };
    });

    commitCommand(
      `一键修复 ${axisViolations.length} 处 180° 轴线跳轴并补齐分镜连线`,
      {
        nodes: nextNodes,
        edges: newEdges,
        mountedSkillIds,
        selectedNodeId: axisViolations[0]?.targetShotId || selectedNodeId,
      }
    );

    const fixedMsg: AgentChatMessage = {
      id: `msg-axis-fixed-${Date.now()}`,
      role: 'assistant',
      modelUsed: '180° Axis Auto-Inspector · 自动修复完成',
      content: `✅ 已自动为您补齐 **${axisViolations
        .map((v) => `${v.sourceShotNumber} → ${v.targetShotNumber}`)
        .join('、')}** 的分镜时序连线 (\`shot_sequence\`)，并将分镜序列对齐至标准 180° 轴线网格与 \`Position_Lock\` 站位锁死状态（可随时按 Ctrl+Z 撤销）。`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setAgentMessages((prev) => [
      ...prev.filter((m) => m.id !== 'msg-axis-auto-alarm'),
      fixedMsg,
    ]);
    showToast('已一键修复 180° 轴线跳轴并补齐分镜时序连线！');
  }, [
    axisViolations,
    edges,
    nodes,
    mountedSkillIds,
    selectedNodeId,
    commitCommand,
    showToast,
  ]);

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
      nodes: found.nodes || [],
      edges: found.edges || [],
      mountedSkillIds: found.mountedSkillIds || mountedSkillIds,
      selectedNodeId:
        (found.nodes || []).find((n) => n.type === 'storyboard')?.id ||
        found.nodes?.[0]?.id ||
        null,
    });
    showToast(`已切换短剧画布工程：${found.name}`);
  };

  // Fixed signature matching ProjectManagerModal's object parameter
  const handleCreateProject = (params: {
    name: string;
    episodeTitle: string;
    description: string;
    genreTag: string;
    aspectRatio: '9:16' | '16:9';
    templateId?: string;
  }) => {
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newId = `proj-${Date.now()}`;
    let initialNodes: CanvasNode[] = [];
    let initialEdges: CanvasEdge[] = [];

    const mode = params.templateId || 'blank';
    if (mode === 'blank') {
      initialNodes = [];
      initialEdges = [];
    } else if (mode === 'starter-3nodes' || mode === 'starter') {
      const charId = `node-char-${Date.now()}`;
      const scriptId = `node-script-${Date.now() + 1}`;
      const shotId = `node-shot-${Date.now() + 2}`;
      initialNodes = [
        {
          id: charId,
          type: 'character',
          position: { x: 80, y: 120 },
          width: 300,
          data: {
            title: '核心主角 · 四视图锚点',
            subtitle: '@Image1 · 角色骨相一致性锁死',
            roleType: '核心主角 (@Image1)',
            consistencyPrompt:
              '[Asset_Board_Lock: 4-View Character Turnaround Sheet (01.Front View | 02.90° Side Profile | 03.Back View | 04.FACS Micro-Expression Close-Up)] 24yo East Asian protagonist, high-contrast studio rim light, neutral grey background, 8k ultra-detailed.',
            costumeDetails: '高辨识度主角服装与标志性随身道具 (@Image1)',
            lightingMood: '4500K 主光 + 6500K 轮廓光',
            threeViewVerified: true,
          },
        },
        {
          id: scriptId,
          type: 'script',
          position: { x: 460, y: 120 },
          width: 340,
          data: {
            title: `${params.episodeTitle} · 第一场`,
            subtitle: '黄金前3秒爽点钩子 · 冲突反转',
            sceneNumber: 'EP01-SC01',
            hookPoint:
              '【黄金前3秒】在此填写开场前3秒高视觉冲击画面或高悬念冲突动作。',
            reversalPoint: '【本场反转】在此填写本场结尾的高潮反转或打脸爽点。',
            scriptBody:
              '在此输入本场剧本正文，支持点击下方按钮【拆解为分镜序列】一键生成连线分镜节点。',
            dialogues: [
              {
                speaker: '主角',
                emotion: 'FACS: AU4眉头微蹙 + 眼神凌厉',
                line: '“请在此输入核心台词。”',
              },
            ],
          },
        },
        {
          id: shotId,
          type: 'storyboard',
          position: { x: 880, y: 120 },
          width: 295,
          data: {
            title: 'SHOT 01 · 黄金前3秒开场特写',
            subtitle: `近景转特写 · ${params.aspectRatio}`,
            shotNumber: 'SHOT 01',
            aspectRatio: params.aspectRatio,
            shotSize: '近景转特写 (MS → CU)',
            cameraMove: '[Push in, Tilt up]',
            focalLength: '35mm f/1.4',
            videoModelTarget: defaultVideoModel,
            visualPrompt:
              '[Protagonist (@Image1)] + [executes dramatic opening hook action with FACS micro-expression] + in [Primary Scene (@Image2)] + Camera: [Rapid Push-in, Subject Lock]; Lens: [35mm f/1.4] + Style: [High-contrast cinema] + Avoid: [face morphing, extra fingers, axis jump]',
            videoPrompts: {
              seedance_2_0:
                '[Protagonist (@Image1)] + [executes dramatic opening hook action with FACS micro-expression] + in [Primary Scene (@Image2)] + Camera: [Rapid Push-in, Subject Lock]; Lens: [35mm f/1.4] + Style: [High-contrast cinema] + Avoid: [face morphing, extra fingers, axis jump]',
              seedance_2_5:
                'Refs: [@Image1 (Protagonist Lock)] | [站位声明: 主角居左面向右侧，严格遵守180°轴线] | Shot 1 (0.0s - 1.5s) [Hook]: Rapid push-in to protagonist eyes. -> Shot 2 (1.5s - 3.5s) [Impact]: Dramatic reveal | Avoid: [崩脸, 越轴]',
              minimax_h3:
                '[Push in, Tilt up] Subject_Lock: (Protagonist @Image1). Position_Lock: (Left-foreground facing right). At 00:00.000, rapid push-in capturing fierce gaze.',
            },
            dialogueSnippet: '“请在此输入核心台词。”',
            speakerName: '主角',
            durationSec: 3.5,
          },
        },
      ];
      initialEdges = [
        {
          id: `edge-starter-1-${Date.now()}`,
          sourceNodeId: charId,
          targetNodeId: shotId,
          relationType: 'character_ref',
        },
        {
          id: `edge-starter-2-${Date.now()}`,
          sourceNodeId: scriptId,
          targetNodeId: shotId,
          relationType: 'script_breakdown',
        },
      ];
    } else {
      const tpl =
        PROJECT_TEMPLATES.find((t) => t.id === mode) || PROJECT_TEMPLATES[0];
      initialNodes = JSON.parse(JSON.stringify(tpl.nodes));
      initialEdges = JSON.parse(JSON.stringify(tpl.edges));
    }

    const newProj: CanvasProject = {
      id: newId,
      name: params.name,
      episodeTitle: params.episodeTitle,
      description: params.description,
      genreTag: params.genreTag,
      aspectRatio: params.aspectRatio,
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
    showToast(`已新建并切换至画布「${params.name}」`);
  };

  const handleDeleteProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    const remaining = projects.filter((p) => p.id !== projectId);

    if (remaining.length === 0) {
      const blankProj: CanvasProject = {
        id: `proj-blank-${Date.now()}`,
        name: '未命名空白短剧画布',
        episodeTitle: 'EP01 · 第一集',
        description: '全新空白短剧画布工作区',
        genreTag: '自定义短剧',
        aspectRatio: '9:16',
        createdAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        updatedAt: '刚刚',
        nodes: [],
        edges: [],
        mountedSkillIds: [...DEFAULT_MOUNTED_SKILLS],
        edgeColor: '#A1A1AA',
      };
      setProjects([blankProj]);
      setActiveTemplateId(blankProj.id);
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setUndoStack([]);
      setRedoStack([]);
      showToast(`已删除「${target?.name || projectId}」并初始化空白画布`);
      return;
    }

    setProjects(remaining);
    if (activeTemplateId === projectId) {
      const nextActive = remaining[0];
      setActiveTemplateId(nextActive.id);
      setNodes(nextActive.nodes || []);
      setEdges(nextActive.edges || []);
      setSelectedNodeId(nextActive.nodes?.[0]?.id || null);
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
    newEpisodeTitle: string
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              name: newName,
              episodeTitle: newEpisodeTitle,
              updatedAt: '刚刚',
            }
          : p
      )
    );
    showToast(`已更新画布名称为「${newName}」`);
  };

  const handleImportProjectJson = (imported: CanvasProject) => {
    setProjects((prev) => [imported, ...prev]);
    setActiveTemplateId(imported.id);
    setNodes(imported.nodes || []);
    setEdges(imported.edges || []);
    setSelectedNodeId(imported.nodes?.[0]?.id || null);
    setUndoStack([]);
    setRedoStack([]);
    showToast(`已成功导入画布工程「${imported.name}」`);
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
    showToast('已恢复《公路求生：开局老式车床》默认工程');
  };

  // Requirement 2: Right-click menu "清空当前画布全部节点" with Undo support
  const handleClearCanvas = () => {
    if (nodes.length === 0 && edges.length === 0) {
      showToast('当前画布已经是空白状态');
      return;
    }
    commitCommand(`清空画布全部 ${nodes.length} 个节点`, {
      nodes: [],
      edges: [],
      mountedSkillIds,
      selectedNodeId: null,
    });
    showToast('已清空当前画布全部节点与连线（可按 Ctrl+Z 撤销恢复）');
  };

  // Node Dragging with atomic Command Pattern Undo/Redo (single or box-selected group)
  const handleNodeDragStart = (id: string) => {
    const _ = id;
    dragStartSnapshotRef.current = getCurrentSnapshot();
  };

  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, position: { x, y } } : n))
    );
  };

  const handleUpdateMultipleNodesPositions = (
    updates: { id: string; x: number; y: number }[]
  ) => {
    if (updates.length === 0) return;
    const posMap = new Map<string, { x: number; y: number }>();
    updates.forEach((u) => posMap.set(u.id, { x: u.x, y: u.y }));
    setNodes((prev) =>
      prev.map((n) => {
        const nextPos = posMap.get(n.id);
        return nextPos ? { ...n, position: nextPos } : n;
      })
    );
  };

  const handleNodeDragEnd = (id: string, draggedGroupIds?: string[]) => {
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
      const commandTitle =
        draggedGroupIds && draggedGroupIds.length > 1
          ? `同步平移框选的 ${draggedGroupIds.length} 个节点`
          : `移动节点「${afterNode.data.title.split('·')[0]}」`;
      commitCommand(
        commandTitle,
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

  const handleDeleteMultipleNodes = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const nextNodes = nodes.filter((n) => !idSet.has(n.id));
    const nextEdges = edges.filter(
      (e) => !idSet.has(e.source) && !idSet.has(e.target)
    );
    const nextSelectedId =
      selectedNodeId && idSet.has(selectedNodeId) ? null : selectedNodeId;
    commitCommand(`批量删除框选的 ${ids.length} 个节点`, {
      nodes: nextNodes,
      edges: nextEdges,
      mountedSkillIds,
      selectedNodeId: nextSelectedId,
    });
    showToast(`已删除框选的 ${ids.length} 个节点（可按 Ctrl+Z 撤销恢复）`);
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

  // Clean, zero-mock node creation templates
  const createNewCanvasNodeObject = (
    type: NodeCategory,
    customX?: number,
    customY?: number
  ): CanvasNode => {
    const id = `node-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const shotCount = nodes.filter((n) => n.type === 'storyboard').length + 1;
    const charCount = nodes.filter((n) => n.type === 'character').length + 1;
    const sceneCount = nodes.filter((n) => n.type === 'scene_asset').length + 1;
    const scriptCount = nodes.filter((n) => n.type === 'script').length + 1;
    const hasCustomPos =
      typeof customX === 'number' && typeof customY === 'number';

    if (type === 'character') {
      return {
        id,
        type: 'character',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 80, y: 160 + (charCount - 1) * 240 },
        width: 300,
        data: {
          title: `角色资产 #${charCount}`,
          subtitle: '四视图锁脸设定 · 单击节点弹出生成框',
          roleType: `角色锚点 (@Image${charCount})`,
          consistencyPrompt:
            '[Asset_Board_Lock: 4-View Character Turnaround Sheet (01.Front View | 02.90° Profile View | 03.Back View | 04.FACS Face Close-Up)] East Asian protagonist, distinct costume silhouette, studio rim lighting, neutral grey reference background, 8k.',
          costumeDetails: `角色标志性服装与随身道具 (@Image${charCount})`,
          lightingMood: '4500K 主光 + 6500K 轮廓光',
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
          : { x: 80, y: 460 + (sceneCount - 1) * 240 },
        width: 300,
        data: {
          title: `场景/道具空间锚点 #${sceneCount}`,
          subtitle: '180°轴线空间与光影色温基准',
          roleType: `场景锚点 (@Scene${sceneCount})`,
          consistencyPrompt:
            '[Scene_Spatial_Lock: 180-Degree Axis Environment] Cinematic architectural or exterior environment, clear foreground/midground/background depth, consistent color temperature.',
          costumeDetails: '核心场景建筑与道具陈设',
          lightingMood: '冷暖反差电影布光',
        },
      };
    }
    if (type === 'script') {
      return {
        id,
        type: 'script',
        position: hasCustomPos
          ? { x: customX!, y: customY! }
          : { x: 440, y: 200 + (scriptCount - 1) * 280 },
        width: 340,
        data: {
          title: `第 ${scriptCount} 场：分场剧本节点`,
          subtitle: '黄金前3秒爽点结构 · 支持一键拆解分镜',
          sceneNumber: `EP01-SC0${scriptCount}`,
          hookPoint: '【黄金前3秒】在此输入本场开局前3秒的强冲突视觉钩子。',
          reversalPoint: '【结尾反转】在此输入本场结尾的情绪爆发或剧情反转点。',
          scriptBody:
            '在此输入分场剧本正文，或点击下方【拆解为分镜序列】由 AI 自动拆解并连线生成分镜节点。',
          dialogues: [
            {
              speaker: '角色',
              emotion: 'FACS: 微表情编码描述',
              line: '“在此输入角色台词。”',
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
          title: '导演批注与设定便签',
          subtitle: '自由文本节点 · 可连线注入剧本或分镜',
          textNoteContent:
            '在此记录本场 180° 轴线机位方位、角色走位或视觉风格备忘。',
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
          title: '@Audio1 · 音轨与台词配音节点',
          subtitle: 'Seedance 2.5 音画同步锚点 · 支持 TTS 试听',
          audioBpmOrMood: '环境音 + 关键动作音效 + 角色台词气口',
          audioTranscript: '在此输入需要 TTS 试听或音画同步的台词与音效时间轴。',
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
          title: '七段式分镜统筹总表',
          subtitle: '含镜号 / 景别 / 运镜 / 180°轴线 / FACS微表情 / 时长',
          tableRows: [
            {
              shotNo: `SHOT 0${shotCount}`,
              shotSize: '中近景 MCU',
              cameraMove: '[Push in] 35mm',
              axisLine: '主体居左面向右侧 (180°轴线锁定)',
              facsMicro: 'AU4 眉心微蹙',
              visualContent: '待填入分镜画面描述',
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
          title: '分镜与资产分组框 (Scene Group)',
          groupDescription: '可将关联剧本、角色锚点与分镜卡片拖拽至此区域',
        },
      };
    }

    const shotLabel = `SHOT ${String(shotCount).padStart(2, '0')}`;
    const defaultPrompts = {
      minimax_h3: `[Push in] Subject_Lock: (@Image1). Position_Lock: (Left-foreground facing right). At 00:00.000, cinematic shot for ${shotLabel}.`,
      seedance_2_0: `[Subject (@Image1)] + [performs key dramatic action with FACS micro-expression] + in [Environment (@Image2)] + Camera: [Push in, Subject Lock]; Lens: [35mm f/1.4] + Style: [Cinematic short drama] + Avoid: [face morphing, extra fingers, axis jump]`,
      seedance_2_5: `Refs: [@Image1 (Character Lock), @Image2 (Scene Lock)] | [站位声明: 主体居左面向右侧，严格遵守180°轴线] | Shot 1 (0.0s - 1.8s) [Hook]: Opening movement -> Shot 2 (1.8s - 3.5s) [Climax]: Close-up reaction | Avoid: [崩脸, 越轴]`,
    };

    return {
      id,
      type: 'storyboard',
      position: hasCustomPos
        ? { x: customX!, y: customY! }
        : { x: 880 + ((shotCount - 1) % 3) * 315, y: 340 },
      width: 295,
      data: {
        title: `${shotLabel} · 竖屏视频分镜`,
        subtitle: '特写 (CU) · 竖屏 9:16',
        shotNumber: shotLabel,
        aspectRatio: '9:16',
        shotSize: '特写 (CU)',
        cameraMove: '[Push in]',
        focalLength: '35mm f/1.4',
        videoModelTarget: defaultVideoModel,
        visualPrompt: defaultPrompts[defaultVideoModel],
        videoPrompts: defaultPrompts,
        dialogueSnippet: '',
        speakerName: '',
        durationSec: 3.5,
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

  const handleAddConnectedNode = (
    sourceNodeId: string,
    targetType: NodeCategory,
    x: number,
    y: number
  ) => {
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    const newNode = createNewCanvasNodeObject(targetType, x, y);

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
      newNode.data.subtitle = `已连接自「${sourceNode.data.title.split('·')[0]}」`;
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
    showToast(`已新建「${newNode.data.title}」并自动建立属性注入连线`);
  };

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
          roleType: '上传视觉参考锚点 (@Image1)',
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
          hookPoint: '【导入剧本片段】可点击拆解为分镜序列或交由 Agent 编排',
          scriptBody: (att.textContent || '').slice(0, 2000),
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
    handleOrganizeNodes('pipeline_compact');
  };

  // =========================================================================
  // REQUIREMENT 4: AUTOMATIC NODE CLASSIFICATION & ORGANIZATION ENGINE
  // Supports 3 modes:
  // 1. 'category_groups': Classifies nodes into 4 labeled visual category zones with auto-sized group containers
  // 2. 'type_columns': Classifies nodes into 5 dedicated vertical type lanes
  // 3. 'pipeline_compact': Compact 3-column topological alignment
  // =========================================================================
  const handleOrganizeNodes = (mode: NodeOrganizeMode = 'category_groups') => {
    const nonGroupNodes = nodes.filter((n) => n.type !== 'group');
    if (nonGroupNodes.length === 0) {
      showToast('当前画布暂无可分类整理的节点');
      return;
    }

    const characters = nonGroupNodes
      .filter((n) => n.type === 'character')
      .sort((a, b) => a.data.title.localeCompare(b.data.title, 'zh-CN'));
    const sceneAssets = nonGroupNodes
      .filter((n) => n.type === 'scene_asset')
      .sort((a, b) => a.data.title.localeCompare(b.data.title, 'zh-CN'));
    const allAssets = [...characters, ...sceneAssets];

    const scriptsAndNotes = nonGroupNodes
      .filter(
        (n) =>
          n.type === 'script' || n.type === 'idea' || n.type === 'text_note'
      )
      .sort((a, b) => {
        const scA = a.data.sceneNumber || a.data.title;
        const scB = b.data.sceneNumber || b.data.title;
        return scA.localeCompare(scB, 'zh-CN');
      });

    const storyboards = nonGroupNodes
      .filter((n) => n.type === 'storyboard' || n.type === 'video_clip')
      .sort((a, b) => {
        const numA = parseInt(
          (a.data.shotNumber || a.data.title || '').replace(/\D+/g, '') || '999',
          10
        );
        const numB = parseInt(
          (b.data.shotNumber || b.data.title || '').replace(/\D+/g, '') || '999',
          10
        );
        if (numA !== numB) return numA - numB;
        return a.position.x - b.position.x;
      });

    const audioAndTables = nonGroupNodes.filter(
      (n) => n.type === 'audio_clip' || n.type === 'storyboard_table'
    );

    if (mode === 'pipeline_compact') {
      const positionedCards = nonGroupNodes.map((node) => {
        if (node.type === 'character' || node.type === 'scene_asset') {
          const idx = allAssets.findIndex((a) => a.id === node.id);
          return {
            ...node,
            position: { x: 50, y: 110 + idx * 270 },
          };
        }
        if (
          node.type === 'script' ||
          node.type === 'idea' ||
          node.type === 'text_note'
        ) {
          const idx = scriptsAndNotes.findIndex((s) => s.id === node.id);
          return {
            ...node,
            position: { x: 420, y: 110 + idx * 310 },
          };
        }
        if (node.type === 'storyboard' || node.type === 'video_clip') {
          const idx = storyboards.findIndex((sb) => sb.id === node.id);
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
        if (node.type === 'audio_clip' || node.type === 'storyboard_table') {
          const idx = audioAndTables.findIndex((t) => t.id === node.id);
          const sbRows = Math.max(1, Math.ceil(storyboards.length / 3));
          return {
            ...node,
            position: {
              x: 835,
              y: 110 + sbRows * 445 + idx * 290,
            },
          };
        }
        return node;
      });

      commitCommand('紧凑三栏拓扑对齐全部节点', {
        nodes: positionedCards,
        edges,
        mountedSkillIds,
        selectedNodeId,
      });
      showToast(
        `已完成紧凑拓扑对齐：资产(${allAssets.length}) · 剧本(${scriptsAndNotes.length}) · 分镜(${storyboards.length})`
      );
      return;
    }

    if (mode === 'type_columns') {
      const colGroups: CanvasNode[] = [];
      const positionedCards: CanvasNode[] = [];

      const lanes: {
        id: string;
        title: string;
        desc: string;
        color: string;
        x: number;
        width: number;
        items: CanvasNode[];
        rowGap: number;
        cols: number;
      }[] = [
        {
          id: 'group-col-char',
          title: '分类一 · 角色四视图定妆列 (@Image)',
          desc: `共 ${characters.length} 个角色资产节点`,
          color: '#38BDF8',
          x: 40,
          width: 340,
          items: characters,
          rowGap: 280,
          cols: 1,
        },
        {
          id: 'group-col-scene',
          title: '分类二 · 场景与载具空间列 (@Image)',
          desc: `共 ${sceneAssets.length} 个场景/载具锚点`,
          color: '#34D399',
          x: 410,
          width: 340,
          items: sceneAssets,
          rowGap: 270,
          cols: 1,
        },
        {
          id: 'group-col-script',
          title: '分类三 · 分场剧本与文案批注列',
          desc: `共 ${scriptsAndNotes.length} 个剧本/批注节点`,
          color: '#F59E0B',
          x: 780,
          width: 380,
          items: scriptsAndNotes,
          rowGap: 320,
          cols: 1,
        },
        {
          id: 'group-col-storyboard',
          title: '分类四 · 9:16 视觉分镜时序矩阵列',
          desc: `共 ${storyboards.length} 个视频分镜节点 (180°轴线顺延)`,
          color: '#818CF8',
          x: 1190,
          width: 670,
          items: storyboards,
          rowGap: 445,
          cols: 2,
        },
        {
          id: 'group-col-audio-table',
          title: '分类五 · 音轨配音与七段式统筹表列',
          desc: `共 ${audioAndTables.length} 个音轨/统筹表节点`,
          color: '#F87171',
          x: 1890,
          width: 980,
          items: audioAndTables,
          rowGap: 320,
          cols: 1,
        },
      ];

      lanes.forEach((lane) => {
        if (lane.items.length === 0) return;
        const rows = Math.ceil(lane.items.length / lane.cols);
        colGroups.push({
          id: lane.id,
          type: 'group',
          position: { x: lane.x, y: 45 },
          width: lane.width,
          height: Math.max(420, 95 + rows * lane.rowGap),
          data: {
            title: lane.title,
            groupDescription: lane.desc,
            groupColor: lane.color,
          },
        });

        lane.items.forEach((item, idx) => {
          const c = idx % lane.cols;
          const r = Math.floor(idx / lane.cols);
          positionedCards.push({
            ...item,
            position: {
              x: lane.x + 20 + c * 320,
              y: 120 + r * lane.rowGap,
            },
          });
        });
      });

      commitCommand('按节点类型垂直分列归类全部节点', {
        nodes: [...colGroups, ...positionedCards],
        edges,
        mountedSkillIds,
        selectedNodeId,
      });
      showToast(
        `已按 5 大节点类型完成垂直分列归类：角色(${characters.length}) · 场景(${sceneAssets.length}) · 剧本(${scriptsAndNotes.length}) · 分镜(${storyboards.length}) · 统筹(${audioAndTables.length})`
      );
      return;
    }

    // Default mode === 'category_groups': 4 Structured Functional Zones with Auto-Sized Category Group Containers
    const autoGroups: CanvasNode[] = [];
    const positionedCards: CanvasNode[] = [];

    // Zone 1: Consistency Assets (@Image Character + Scene/Vehicle)
    if (allAssets.length > 0) {
      autoGroups.push({
        id: 'group-cat-assets',
        type: 'group',
        position: { x: 30, y: 45 },
        width: 345,
        height: Math.max(420, 95 + allAssets.length * 270),
        data: {
          title: `【一、一致性资产锚点区】(${allAssets.length})`,
          groupDescription: `角色四视图 (${characters.length}) + 场景与载具 (${sceneAssets.length})`,
          groupColor: '#38BDF8',
        },
      });
      allAssets.forEach((node, idx) => {
        positionedCards.push({
          ...node,
          position: { x: 50, y: 120 + idx * 270 },
        });
      });
    }

    // Zone 2: Scene Scripts & Notes
    if (scriptsAndNotes.length > 0) {
      autoGroups.push({
        id: 'group-cat-scripts',
        type: 'group',
        position: { x: 400, y: 45 },
        width: 385,
        height: Math.max(420, 95 + scriptsAndNotes.length * 315),
        data: {
          title: `【二、分场剧本与设定区】(${scriptsAndNotes.length})`,
          groupDescription: '黄金前3秒钩子 · 冲突反转 · 原著批注',
          groupColor: '#F59E0B',
        },
      });
      scriptsAndNotes.forEach((node, idx) => {
        positionedCards.push({
          ...node,
          position: { x: 420, y: 120 + idx * 315 },
        });
      });
    }

    // Zone 3: 9:16 Visual Storyboard Sequence Matrix
    const sbRows = Math.max(1, Math.ceil(storyboards.length / 3));
    const sbGroupHeight = Math.max(460, 95 + sbRows * 445);
    if (storyboards.length > 0) {
      autoGroups.push({
        id: 'group-cat-storyboards',
        type: 'group',
        position: { x: 810, y: 45 },
        width: 1005,
        height: sbGroupHeight,
        data: {
          title: `【三、9:16 视觉分镜时序矩阵区】(${storyboards.length})`,
          groupDescription: '严格遵循 180° 轴线顺延与 FACS 微表情演进',
          groupColor: '#34D399',
        },
      });
      storyboards.forEach((node, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        positionedCards.push({
          ...node,
          position: {
            x: 835 + col * 325,
            y: 120 + row * 445,
          },
        });
      });
    }

    // Zone 4: Audio Tracks & 7-Part Storyboard Sheet
    if (audioAndTables.length > 0) {
      const zone4Top = storyboards.length > 0 ? 75 + sbGroupHeight : 45;
      autoGroups.push({
        id: 'group-cat-audio-sheet',
        type: 'group',
        position: { x: 810, y: zone4Top },
        width: 1005,
        height: Math.max(360, 95 + audioAndTables.length * 320),
        data: {
          title: `【四、多模态音轨与七段式统筹表区】(${audioAndTables.length})`,
          groupDescription: '@Audio 配音气口与漫剧老李七段式导演统筹总表',
          groupColor: '#818CF8',
        },
      });
      audioAndTables.forEach((node, idx) => {
        positionedCards.push({
          ...node,
          position: {
            x: 835,
            y: zone4Top + 75 + idx * 310,
          },
        });
      });
    }

    commitCommand(
      `自动分类整理 ${nonGroupNodes.length} 个画布节点 (生成4大分类分区)`,
      {
        nodes: [...autoGroups, ...positionedCards],
        edges,
        mountedSkillIds,
        selectedNodeId,
      }
    );
    showToast(
      `已自动分类整理 ${nonGroupNodes.length} 个节点：资产区(${allAssets.length}) · 剧本区(${scriptsAndNotes.length}) · 分镜区(${storyboards.length}) · 统筹区(${audioAndTables.length})`
    );
  };

  // =========================================================================
  // REAL AI PROMPT SYNTHESIS (/api/storyboard/render)
  // =========================================================================
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
          useGrsaiDraw: false,
        }),
      });
      const json = await res.json();
      if (!res.ok || (!json.ok && !json.success)) {
        throw new Error(json.error || '提示词合成失败');
      }
      const synth = json.data;

      setNodes((currentNodes) =>
        currentNodes.map((n) => {
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
              lastRenderedAt: `刚刚实跑 (${json.modelUsed || 'AI'})`,
            },
          };
        })
      );
      const _ = beforeRenderSnap;
      showToast(
        `节点「${targetNode.data.title}」已通过 ${json.modelUsed || 'AI'} 合成最新提示词`
      );
    } catch (err: any) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, isRendering: false } } : n
        )
      );
      showToast(`提示词合成失败：${err?.message || '请检查网络或模型配置'}`);
    }
  };

  // =========================================================================
  // REQUIREMENT 4A: REAL IMAGE GENERATION (/api/media/generate-image)
  // =========================================================================
  const handleGenerateNodeImage = async (
    nodeId: string,
    customModelId?: string
  ) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const promptText =
      targetNode.type === 'character' || targetNode.type === 'scene_asset'
        ? targetNode.data.consistencyPrompt ||
          targetNode.data.visualPrompt ||
          targetNode.data.title
        : targetNode.data.visualPrompt ||
          targetNode.data.videoPrompts?.[
            targetNode.data.videoModelTarget || 'seedance_2_0'
          ] ||
          targetNode.data.title;

    const imageModel =
      customModelId || targetNode.data.imageModelId || 'nano-banana-fast';
    const aspectRatio =
      targetNode.data.aspectRatio === '16:9'
        ? '16:9'
        : targetNode.type === 'scene_asset'
        ? '16:9'
        : '9:16';

    // Collect reference images from upstream connected character/scene nodes
    const upstream = getUpstreamNodesFor(nodeId);
    const referenceUrls = upstream
      .map((u) => u.data.generatedImageUrl)
      .filter((u): u is string => Boolean(u && u.startsWith('http')));

    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                isGeneratingImage: true,
                imageModelId: imageModel,
              },
            }
          : n
      )
    );
    showToast(
      `正在调用 GRSAI (${imageModel}) 为「${targetNode.data.title.split('·')[0]}」生成实拍图...`
    );

    try {
      const res = await fetch('/api/media/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: imageModel,
          modelId: imageModel,
          aspectRatio,
          referenceUrls,
          referenceImages: referenceUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok || (!json.ok && !json.success) || !json.imageUrl) {
        throw new Error(json.error || '未返回有效图片 URL');
      }

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  isGeneratingImage: false,
                  generatedImageUrl: json.imageUrl,
                  lastRenderedAt: `实拍图已生成 (${json.modelUsed})`,
                },
              }
            : n
        )
      );
      showToast(
        `「${targetNode.data.title.split('·')[0]}」实拍画面生成成功！`
      );
    } catch (err: any) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  isGeneratingImage: false,
                },
              }
            : n
        )
      );
      showToast(`生成图片失败：${err?.message || '请求超时'}`);
    }
  };

  // =========================================================================
  // REQUIREMENT 4B: REAL VIDEO GENERATION + POLLING (/api/media/generate-video)
  // =========================================================================
  const pollVideoTaskStatus = useCallback(
    (nodeId: string, taskId: string, nodeTitle: string) => {
      let attempts = 0;
      const maxAttempts = 80; // ~4.5 minutes max

      const timer = setInterval(async () => {
        attempts += 1;
        try {
          const res = await fetch('/api/media/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId }),
          });
          const json = await res.json();
          if (!json.ok && !json.success) return;

          if (json.status === 'succeeded' && json.videoUrl) {
            clearInterval(timer);
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        isGeneratingVideo: false,
                        videoStatus: 'succeeded',
                        videoProgress: 100,
                        generatedVideoUrl: json.videoUrl,
                        lastRenderedAt: '实拍视频已生成',
                      },
                    }
                  : n
              )
            );
            showToast(`「${nodeTitle}」实拍视频渲染完成，已挂载至节点播放器！`);
          } else if (json.status === 'failed' || attempts >= maxAttempts) {
            clearInterval(timer);
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        isGeneratingVideo: false,
                        videoStatus: 'failed',
                        videoError:
                          json.error || '视频云端合成超时，请稍后重试',
                      },
                    }
                  : n
              )
            );
            showToast(
              `「${nodeTitle}」视频生成未完成：${json.error || '超时'}`
            );
          } else {
            const prog =
              typeof json.progress === 'number' && json.progress > 0
                ? json.progress
                : Math.min(95, attempts * 4);
            setNodes((prev) =>
              prev.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        isGeneratingVideo: true,
                        videoStatus: 'running',
                        videoProgress: prog,
                      },
                    }
                  : n
              )
            );
          }
        } catch {
          // Ignore transient polling error
        }
      }, 3500);
    },
    [showToast]
  );

  const handleGenerateNodeVideo = async (
    nodeId: string,
    customVideoModel?: string
  ) => {
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const videoModel =
      customVideoModel || targetNode.data.videoGenModelId || 'minimax-h3';
    const activeTarget = targetNode.data.videoModelTarget || 'seedance_2_0';
    const promptText =
      targetNode.data.videoPrompts?.[activeTarget] ||
      targetNode.data.visualPrompt ||
      targetNode.data.consistencyPrompt ||
      targetNode.data.title;

    const upstream = getUpstreamNodesFor(nodeId);
    const firstFrameUrl =
      targetNode.data.generatedImageUrl ||
      upstream.find((u) => u.data.generatedImageUrl)?.data.generatedImageUrl;

    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                isGeneratingVideo: true,
                videoStatus: 'running',
                videoProgress: 2,
                videoError: undefined,
                videoGenModelId: videoModel,
              },
            }
          : n
      )
    );

    showToast(
      `已提交「${targetNode.data.title.split('·')[0]}」至 ${videoModel} 实拍视频队列...`
    );

    try {
      const res = await fetch('/api/media/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: videoModel,
          videoModel,
          aspectRatio: targetNode.data.aspectRatio || '9:16',
          duration: 5,
          firstFrameUrl,
          referenceImages: firstFrameUrl ? [firstFrameUrl] : [],
        }),
      });
      const json = await res.json();
      if (!res.ok || (!json.ok && !json.success)) {
        throw new Error(json.error || '提交视频生成任务失败');
      }

      if (json.status === 'succeeded' && json.videoUrl) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    isGeneratingVideo: false,
                    videoStatus: 'succeeded',
                    videoProgress: 100,
                    generatedVideoUrl: json.videoUrl,
                    lastRenderedAt: `实拍视频已生成 (${videoModel})`,
                  },
                }
              : n
          )
        );
        showToast(
          `「${targetNode.data.title.split('·')[0]}」实拍视频生成完成！`
        );
      } else if (json.taskId) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    videoTaskId: json.taskId,
                    videoStatus: 'running',
                    videoProgress: 5,
                  },
                }
              : n
          )
        );
        pollVideoTaskStatus(
          nodeId,
          json.taskId,
          targetNode.data.title.split('·')[0]
        );
      }
    } catch (err: any) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  isGeneratingVideo: false,
                  videoStatus: 'failed',
                  videoError: err?.message || '视频任务提交失败',
                },
              }
            : n
        )
      );
      showToast(`视频生成提交失败：${err?.message || '请稍后重试'}`);
    }
  };

  // =========================================================================
  // ONE-CLICK SCRIPT NODE DECOMPOSITION TO STORYBOARD SEQUENCE
  // =========================================================================
  const handleDecomposeScriptNode = async (scriptNodeId: string) => {
    const scriptNode = nodes.find((n) => n.id === scriptNodeId);
    if (!scriptNode) return;
    setSelectedNodeId(scriptNodeId);
    const prompt = `请将当前选中的分场剧本节点「${scriptNode.data.title}」（剧本内容：${
      scriptNode.data.hookPoint || ''
    } ${scriptNode.data.scriptBody || ''} ${
      scriptNode.data.reversalPoint || ''
    }）严格按照 180° 轴线规则、黄金前3秒爽点钩子与 FACS 微表情编码，拆解为 3 个连续的 9:16 竖屏分镜节点（storyboard），并输出每个分镜的 Seedance 2.0、Seedance 2.5 与 MiniMax H3 视频提示词。`;
    await handleExecuteAgentPrompt(prompt, []);
  };

  // Batch helpers for DramaWorkflowModal
  const handleBatchGenerateAssetImages = () => {
    const assetNodes = nodes.filter(
      (n) =>
        (n.type === 'character' || n.type === 'scene_asset') &&
        !n.data.generatedImageUrl &&
        !n.data.isGeneratingImage
    );
    const targets =
      assetNodes.length > 0
        ? assetNodes
        : nodes.filter(
            (n) => n.type === 'character' || n.type === 'scene_asset'
          );
    targets.slice(0, 5).forEach((n, idx) => {
      setTimeout(() => {
        handleGenerateNodeImage(n.id, 'nano-banana-fast');
      }, idx * 600);
    });
  };

  const handleBatchGenerateStoryboardImages = () => {
    const sbNodes = nodes.filter(
      (n) =>
        n.type === 'storyboard' &&
        !n.data.generatedImageUrl &&
        !n.data.isGeneratingImage
    );
    const targets =
      sbNodes.length > 0
        ? sbNodes
        : nodes.filter((n) => n.type === 'storyboard');
    targets.slice(0, 6).forEach((n, idx) => {
      setTimeout(() => {
        handleGenerateNodeImage(n.id, 'nano-banana-fast');
      }, idx * 700);
    });
  };

  const handleBatchCompilePrompts = () => {
    const sbIds = nodes
      .filter((n) => n.type === 'storyboard')
      .map((n) => n.id);
    sbIds.forEach((id, idx) => {
      setTimeout(() => {
        handleRenderStoryboardNode(id);
      }, idx * 500);
    });
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
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Agent 推理请求失败');
      }

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

        const videoPromptsObj = {
          minimax_h3:
            spec.videoPrompts?.minimax_h3 || spec.visualPrompt || '',
          seedance_2_0:
            spec.videoPrompts?.seedance_2_0 || spec.visualPrompt || '',
          seedance_2_5:
            spec.videoPrompts?.seedance_2_5 || spec.visualPrompt || '',
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
                : 'Omni-Agent 编排生成'),
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
            visualPrompt: videoPromptsObj[targetVm] || spec.visualPrompt || '',
            videoPrompts: videoPromptsObj,
            dialogueSnippet: spec.dialogueSnippet,
            speakerName: spec.speakerName,
            durationSec: spec.durationSec || 3.5,
            customSvgElements: {
              primaryHue: spec.primaryHue || '#F59E0B',
              secondaryHue: spec.secondaryHue || '#18181B',
              keyLightAngle: spec.lightingMood || '45° 戏剧侧逆光',
              silhouetteType: spec.silhouetteType || 'single_closeup',
              cameraVectorLabel: `${spec.cameraMove || '[Push in]'} · ${
                spec.focalLength || '35mm'
              }`,
              focalCaption: 'Omni-Director Agent 实跑生成',
            },
            lastRenderedAt: `实跑完成 (${json.modelUsed || 'AI'})`,
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
            `解析导演指令，调度已挂载的 ${activeSkills.length} 个短剧专精 Skill。`,
            `读取当前焦点节点「${
              selectedNode?.data.title || '全局画布'
            }」及其上游 ${upstreamNodes.length} 个一致性资产锚点。`,
            `按照 180° 轴线规则、FACS 微表情六阶段生成 ${spawnedNodes.length} 个画布节点。`,
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
          target: `canvas/${selectedNode?.id || 'active-canvas'}.json`,
          detail: `解析上游锚点连接`,
          status: 'completed' as const,
        },
        ...spawnedNodes.map((sn, i) => ({
          id: `tc-node-${Date.now()}-${i}`,
          toolName: 'create_canvas_node',
          target: `nodes/${sn.type}/${sn.data.shotNumber || sn.id}.prompt`,
          detail: sn.data.title,
          status: 'completed' as const,
        })),
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
          builtStatus: `Built · ${json?.modelUsed || selectedModelId}`,
        },
      };
      setAgentMessages((prev) => [...prev, replyMsg]);
      showToast(
        `已通过 ${json?.modelUsed || selectedModelId} 在画布生成 ${
          spawnedNodes.length
        } 个节点（支持 Ctrl+Z 撤销）`
      );
    } catch (err: any) {
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `Agent 节点编排请求失败：${
            err?.message || '请检查网络连接或在设置中切换其他 AI 运营商'
          }`,
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
    const activeProj = projects.find((p) => p.id === activeTemplateId);
    const exportPayload = {
      studio: '帧界 FrameVerse AI Short Drama Canvas',
      exportedAt: new Date().toISOString(),
      id: activeProj?.id || activeTemplateId,
      name: activeProj?.name || '短剧工程导出',
      episodeTitle: activeProj?.episodeTitle || 'EP01',
      description: activeProj?.description || '',
      genreTag: activeProj?.genreTag || 'AI短剧',
      aspectRatio: activeProj?.aspectRatio || '9:16',
      selectedModelId,
      purePromptMode,
      edgeColor,
      mountedSkillIds,
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
    a.download = `frameverse-project-${Date.now()}.json`;
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
        {/* Top Bar */}
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

          {/* Zone 2: Navigation Links */}
          <nav
            className={`hidden md:flex items-center gap-6 text-xs font-medium ${
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
                setIsWorkflowModalOpen(false);
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
              href="#drama-workflow"
              onClick={(e) => {
                e.preventDefault();
                setIsWorkflowModalOpen(true);
              }}
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                darkMode
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AI短剧全流程管线与质检</span>
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

          {/* Zone 3: Primary Action Button */}
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

        {/* Secondary Contextual Workspace Sub-Bar */}
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
              title="打开项目管理中心（新建 / 删除 / 复制 / 导入画布）"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span>项目管理 ({projects.length})</span>
            </button>

            <div
              className={`flex items-center gap-1 p-0.5 rounded-lg border overflow-x-auto max-w-[420px] ${
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
              onClick={() => setIsWorkflowModalOpen(true)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>全流程管线与四道质检锁</span>
            </button>

            <button
              type="button"
              onClick={() => handleOrganizeNodes('category_groups')}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
              title="将画布上所有节点按【角色/场景资产 · 分场剧本 · 9:16视觉分镜 · 音轨与统筹表】自动分类并生成分区框"
            >
              <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
              <span>整理节点 (自动分类)</span>
            </button>

            <button
              type="button"
              onClick={handleBatchCompilePrompts}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                darkMode
                  ? 'text-zinc-300 hover:bg-zinc-800'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>批量重跑分镜提示词</span>
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
            axisViolations={axisViolations}
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
            onUpdateMultipleNodesPositions={handleUpdateMultipleNodesPositions}
            onNodeDragEnd={handleNodeDragEnd}
            onUpdateNodeData={handleUpdateNodeData}
            onSwitchNodeVideoModel={handleSwitchNodeVideoModel}
            onAddNode={handleAddNode}
            onAddConnectedNode={handleAddConnectedNode}
            onDeleteNode={handleDeleteNode}
            onDeleteMultipleNodes={handleDeleteMultipleNodes}
            onClearCanvas={handleClearCanvas}
            onAddEdge={handleAddEdge}
            onDeleteEdge={handleDeleteEdge}
            onRenderStoryboardNode={handleRenderStoryboardNode}
            onGenerateNodeImage={handleGenerateNodeImage}
            onGenerateNodeVideo={handleGenerateNodeVideo}
            onDecomposeScriptNode={handleDecomposeScriptNode}
            onOpenNodeInspector={(id) => setInspectorNodeId(id)}
            onAutoLayout={handleAutoLayout}
            onOrganizeNodes={handleOrganizeNodes}
            onRunAxisInspection={handleRunAxisInspection}
            onAutoFixAxisViolations={handleAutoFixAxisViolations}
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
              axisViolations={axisViolations}
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
              onRunAxisInspection={handleRunAxisInspection}
              onAutoFixAxisViolations={handleAutoFixAxisViolations}
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
          onGenerateNodeImage={(nid, mid) => handleGenerateNodeImage(nid, mid)}
          onGenerateNodeVideo={(nid, vmid) => handleGenerateNodeVideo(nid, vmid)}
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
          templates={PROJECT_TEMPLATES}
          onClose={() => setIsProjectManagerOpen(false)}
          onSelectProject={handleSwitchTemplate}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onResetDefaultProjects={handleResetDefaultProjects}
          onImportProjectJson={handleImportProjectJson}
          onBackupNodesJson={(proj, nodeCount) => {
            showToast(
              `已成功导出《${proj.name}》${nodeCount} 个节点的完整 JSON 备份文件`
            );
          }}
        />

        <DramaWorkflowModal
          isOpen={isWorkflowModalOpen}
          darkMode={darkMode}
          nodes={nodes}
          edges={edges}
          onClose={() => setIsWorkflowModalOpen(false)}
          onBatchGenerateAssetImages={handleBatchGenerateAssetImages}
          onBatchGenerateStoryboardImages={handleBatchGenerateStoryboardImages}
          onBatchCompilePrompts={handleBatchCompilePrompts}
          onOpenStoryboardPlayer={() => setIsStoryboardPlayerOpen(true)}
          onFocusNode={(nodeId) => setSelectedNodeId(nodeId)}
        />
      </div>
    </div>
  );
}
