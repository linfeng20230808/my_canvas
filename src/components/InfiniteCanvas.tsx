import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Move,
  UserCheck,
  FileText,
  Film,
  FolderPlus,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Trash2,
  SlidersHorizontal,
  Link2,
  MapPin,
  Copy,
  Check,
  Volume2,
  Table2,
  Type,
  Palette,
  PanelRightOpen,
  Undo2,
  Redo2,
  Plus,
  Pencil,
  Maximize2,
  X,
  Camera,
  ArrowUp,
  Grid,
  Wand2,
} from 'lucide-react';
import {
  CanvasNode,
  CanvasEdge,
  NodeCategory,
  EdgeRelationType,
  VideoModelTarget,
  AgentModelOption,
} from '../types/canvas';
import { CinematicArtRenderer } from './CinematicArtRenderer';

interface InfiniteCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  darkMode: boolean;
  edgeColor: string;
  isAgentPanelOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
  models: AgentModelOption[];
  selectedModelId: string;
  onUndo: () => void;
  onRedo: () => void;
  onSelectModel: (modelId: string) => void;
  onChangeEdgeColor: (color: string) => void;
  onToggleAgentPanel: () => void;
  onSelectNode: (id: string | null) => void;
  onNodeDragStart: (id: string) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onNodeDragEnd: (id: string) => void;
  onUpdateNodeData: (nodeId: string, updatedData: CanvasNode['data'], label?: string) => void;
  onSwitchNodeVideoModel: (nodeId: string, model: VideoModelTarget) => void;
  onAddNode: (type: NodeCategory, x?: number, y?: number) => void;
  onAddConnectedNode: (
    sourceNodeId: string,
    targetType: NodeCategory,
    x: number,
    y: number
  ) => void;
  onDeleteNode: (id: string) => void;
  onAddEdge: (sourceId: string, targetId: string, relationType: EdgeRelationType) => void;
  onDeleteEdge: (edgeId: string) => void;
  onRenderStoryboardNode: (nodeId: string) => void;
  onOpenNodeInspector: (nodeId: string) => void;
  onAutoLayout: () => void;
}

const VIDEO_MODEL_LABELS: Record<VideoModelTarget, string> = {
  minimax_h3: 'MiniMax H3',
  seedance_2_0: 'Seedance 2.0',
  seedance_2_5: 'Seedance 2.5',
};

const EDGE_COLOR_PRESETS = [
  { label: '极简银灰', value: '#A1A1AA' },
  { label: '赛博青蓝', value: '#38BDF8' },
  { label: '琥珀流金', value: '#F59E0B' },
  { label: '霓虹紫罗兰', value: '#818CF8' },
  { label: '翡翠信号绿', value: '#34D399' },
  { label: '珊瑚绯红', value: '#F87171' },
];

const STYLE_SNIPPETS = [
  'Wasteland Survival Cinema, 4500K desert sun vs 6500K holographic blue',
  'Chiaroscuro Film Noir, high-contrast warm amber & cold rain rim light',
  '3D Unreal Engine 5 Donghua CG, ultra-detailed metallic & skin subsurface scattering',
  'Anamorphic 2.39:1 Widescreen Cinema, subtle lens flare & film grain',
];

const PRESET_FORMULA_SNIPPETS: Record<string, string> = {
  storyboard:
    ' | [站位声明: 严格锁定180°轴线，左前景面向右] | [FACS微表情: AU5瞳孔骤缩→AU4眉心聚拢→AU12冷笑定格] | [动作七态: 起势→蓄力→突进→交锋→定格]',
  character:
    ' | [Asset_Board_Lock: 01.Front Full View | 02.90° Profile View | 03.Back View | 04.FACS Face Close-Up, Bone_Structure_Locked]',
  scene_asset:
    ' | [Spatial_Axis_Lock: 180-degree camera axis baseline, primary key light 4500K + rim light 6500K]',
  script:
    '\n【黄金前3秒爽点】：直接切入最高戏剧冲突！\n【结尾断章反转】：抛出关键底牌，驱动滑入下一集。',
};

// Zoom & Pan Boundary Constraints
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.85;
const MIN_PAN_X = -2400;
const MAX_PAN_X = 1100;
const MIN_PAN_Y = -1800;
const MAX_PAN_Y = 850;

const clampPan = (x: number, y: number) => ({
  x: Math.min(MAX_PAN_X, Math.max(MIN_PAN_X, x)),
  y: Math.min(MAX_PAN_Y, Math.max(MIN_PAN_Y, y)),
});

/**
 * Deterministic vertical offset (in world pixels from node.position.y)
 * for both the DOM Port circle and the SVG Bezier curve endpoint,
 * ensuring 100% pixel-perfect connection on the port center!
 */
const getPortOffsetY = (node: CanvasNode): number => {
  switch (node.type) {
    case 'text_note':
    case 'audio_clip':
      return 76;
    case 'storyboard_table':
      return 110;
    default:
      return 118;
  }
};

/**
 * Requirement 1: Z-index Stacking Priority & Micro Curvature Offset by Attribute-Injection Type
 * Prevents multiple crossing edges from overlapping and keeps complex topologies legible.
 */
const RELATION_Z_PRIORITY: Record<EdgeRelationType, number> = {
  shot_sequence: 1,
  script_breakdown: 2,
  scene_ref: 3,
  character_ref: 4,
};

const RELATION_CURVE_OFFSET: Record<EdgeRelationType, number> = {
  character_ref: -18,
  scene_ref: 18,
  script_breakdown: -7,
  shot_sequence: 7,
};

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  darkMode,
  edgeColor,
  isAgentPanelOpen,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  models,
  selectedModelId,
  onUndo,
  onRedo,
  onSelectModel,
  onChangeEdgeColor,
  onToggleAgentPanel,
  onSelectNode,
  onNodeDragStart,
  onUpdateNodePosition,
  onNodeDragEnd,
  onUpdateNodeData,
  onSwitchNodeVideoModel,
  onAddNode,
  onAddConnectedNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  onRenderStoryboardNode,
  onOpenNodeInspector,
  onAutoLayout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 18, y: 14 });
  const [zoom, setZoom] = useState<number>(0.76);
  const [activeTool, setActiveTool] = useState<'select' | 'connect'>('select');
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inertial Panning refs
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastMouseRef = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });
  const inertiaFrameRef = useRef<number | null>(null);

  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [connectStartWorldPos, setConnectStartWorldPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  const [styleCycleIndex, setStyleCycleIndex] = useState<number>(0);

  // Right-Click Context Menu OR Edge-Drop Node Creation Menu (open-ai-canvas style)
  const [contextMenu, setContextMenu] = useState<{
    clientX: number;
    clientY: number;
    worldX: number;
    worldY: number;
    sourceNodeId?: string; // If present, selecting a node type auto-connects from sourceNodeId!
  } | null>(null);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopInertia();
  }, [stopInertia]);

  // Compute Upstream & Downstream Logic Chain when hovering over a node
  const hoveredLogicChain = useMemo(() => {
    if (!hoveredNodeId) return null;
    const relatedNodes = new Set<string>([hoveredNodeId]);
    const relatedEdges = new Set<string>();

    // Traverse upstream (up to 3 hops)
    let frontierUp = new Set<string>([hoveredNodeId]);
    for (let step = 0; step < 3; step++) {
      const nextUp = new Set<string>();
      edges.forEach((e) => {
        if (frontierUp.has(e.targetNodeId)) {
          relatedEdges.add(e.id);
          if (!relatedNodes.has(e.sourceNodeId)) {
            relatedNodes.add(e.sourceNodeId);
            nextUp.add(e.sourceNodeId);
          }
        }
      });
      frontierUp = nextUp;
      if (frontierUp.size === 0) break;
    }

    // Traverse downstream (up to 3 hops)
    let frontierDown = new Set<string>([hoveredNodeId]);
    for (let step = 0; step < 3; step++) {
      const nextDown = new Set<string>();
      edges.forEach((e) => {
        if (frontierDown.has(e.sourceNodeId)) {
          relatedEdges.add(e.id);
          if (!relatedNodes.has(e.targetNodeId)) {
            relatedNodes.add(e.targetNodeId);
            nextDown.add(e.targetNodeId);
          }
        }
      });
      frontierDown = nextDown;
      if (frontierDown.size === 0) break;
    }

    return { relatedNodes, relatedEdges };
  }, [hoveredNodeId, edges]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Exact Mathematical Port Center Coordinates
  const getNodePortCoords = useCallback((node: CanvasNode, side: 'input' | 'output') => {
    const offsetY = getPortOffsetY(node);
    return {
      x: side === 'output' ? node.position.x + node.width : node.position.x,
      y: node.position.y + offsetY,
    };
  }, []);

  // Requirement 2: Detect when an actively dragged wire approaches a target node's input port / left edge
  const nearSnapTargetNode = useMemo(() => {
    if (!connectingSourceId) return null;
    let closestNode: CanvasNode | null = null;
    let minDist = 72; // Magnetic snap radius in world pixels

    for (const candidate of nodes) {
      if (candidate.type === 'group' || candidate.id === connectingSourceId) continue;
      const inputPort = getNodePortCoords(candidate, 'input');
      const dPort = Math.hypot(mouseCanvasPos.x - inputPort.x, mouseCanvasPos.y - inputPort.y);
      // Also check proximity to the left edge of the target node near the port
      const withinVerticalBand =
        mouseCanvasPos.y >= candidate.position.y - 16 &&
        mouseCanvasPos.y <= candidate.position.y + 240;
      const dLeftEdge = withinVerticalBand
        ? Math.hypot(mouseCanvasPos.x - candidate.position.x, (mouseCanvasPos.y - inputPort.y) * 0.45)
        : 999;

      const effectiveDist = Math.min(dPort, dLeftEdge);
      if (effectiveDist < minDist) {
        minDist = effectiveDist;
        closestNode = candidate;
      }
    }
    return closestNode;
  }, [connectingSourceId, nodes, mouseCanvasPos, getNodePortCoords]);

  // Requirement 1: Precompute sorted edges (Z-index stacking) & per-edge micro path offset
  const sortedAndOffsetEdges = useMemo(() => {
    // Group incoming edges per targetNodeId and outgoing per sourceNodeId to fan out siblings
    const incomingMap = new Map<string, string[]>();
    const outgoingMap = new Map<string, string[]>();

    edges.forEach((e) => {
      const inc = incomingMap.get(e.targetNodeId) || [];
      inc.push(e.id);
      incomingMap.set(e.targetNodeId, inc);

      const out = outgoingMap.get(e.sourceNodeId) || [];
      out.push(e.id);
      outgoingMap.set(e.sourceNodeId, out);
    });

    const enriched = edges.map((edge) => {
      const isEdgeHovered = hoveredEdgeId === edge.id;
      const isInHoveredChain = hoveredLogicChain
        ? hoveredLogicChain.relatedEdges.has(edge.id)
        : false;
      const isConnectedToSelected =
        selectedNodeId !== null &&
        (edge.sourceNodeId === selectedNodeId || edge.targetNodeId === selectedNodeId);
      const isDimmedByHover = Boolean(hoveredLogicChain && !isInHoveredChain);

      // Compute Z-rank so active/hovered edges stack on top, and crossing edges stack by relationType
      let zRank = RELATION_Z_PRIORITY[edge.relationType] || 1;
      if (isDimmedByHover) zRank = 0;
      else if (isEdgeHovered) zRank = 20;
      else if (isInHoveredChain) zRank = 15;
      else if (isConnectedToSelected) zRank = 10;

      // Micro curvature offset based on Attribute-Injection relationType + sibling fan index
      const baseTypeOffset = RELATION_CURVE_OFFSET[edge.relationType] || 0;
      const inSiblings = incomingMap.get(edge.targetNodeId) || [edge.id];
      const inIdx = inSiblings.indexOf(edge.id);
      const inSpread = (inIdx - (inSiblings.length - 1) / 2) * 11;

      const outSiblings = outgoingMap.get(edge.sourceNodeId) || [edge.id];
      const outIdx = outSiblings.indexOf(edge.id);
      const outSpread = (outIdx - (outSiblings.length - 1) / 2) * 9;

      return {
        edge,
        zRank,
        isEdgeHovered,
        isInHoveredChain,
        isConnectedToSelected,
        isDimmedByHover,
        cp1OffsetY: baseTypeOffset + outSpread,
        cp2OffsetY: baseTypeOffset + inSpread,
      };
    });

    return enriched.sort((a, b) => a.zRank - b.zRank);
  }, [edges, hoveredEdgeId, hoveredLogicChain, selectedNodeId]);

  const handleContextMenuCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    stopInertia();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldPos = screenToCanvas(e.clientX, e.clientY);
    setContextMenu({
      clientX: Math.min(e.clientX - rect.left, rect.width - 250),
      clientY: Math.min(e.clientY - rect.top, rect.height - 340),
      worldX: Math.round(worldPos.x / 10) * 10,
      worldY: Math.round(worldPos.y / 10) * 10,
      sourceNodeId: connectingSourceId || undefined,
    });
  };

  const handleMouseDownCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2) return; // Right-click handled by onContextMenu
    setContextMenu(null);
    setIsColorMenuOpen(false);

    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.canvasBg) {
      return;
    }
    stopInertia();
    onSelectNode(null);
    setConnectingSourceId(null);
    setConnectStartWorldPos(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    velocityRef.current = { vx: 0, vy: 0 };
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    const worldPos = screenToCanvas(e.clientX, e.clientY);
    setMouseCanvasPos(worldPos);

    if (isPanning) {
      const now = performance.now();
      const dt = Math.max(1, now - lastMouseRef.current.time);
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;

      velocityRef.current = {
        vx: (dx / dt) * 16,
        vy: (dy / dt) * 16,
      };
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };

      setPan(clampPan(e.clientX - panStart.x, e.clientY - panStart.y));
      return;
    }

    if (draggingNodeId) {
      const nextX = Math.round((worldPos.x - nodeDragOffset.x) / 5) * 5;
      const nextY = Math.round((worldPos.y - nodeDragOffset.y) / 5) * 5;
      onUpdateNodePosition(draggingNodeId, nextX, nextY);
    }
  };

  const handleMouseUpCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      const { vx, vy } = velocityRef.current;
      if (Math.hypot(vx, vy) > 0.8) {
        const stepInertia = () => {
          velocityRef.current.vx *= 0.92;
          velocityRef.current.vy *= 0.92;
          if (Math.hypot(velocityRef.current.vx, velocityRef.current.vy) < 0.35) {
            inertiaFrameRef.current = null;
            return;
          }
          setPan((prev) =>
            clampPan(prev.x + velocityRef.current.vx, prev.y + velocityRef.current.vy)
          );
          inertiaFrameRef.current = requestAnimationFrame(stepInertia);
        };
        inertiaFrameRef.current = requestAnimationFrame(stepInertia);
      }
    }

    if (draggingNodeId) {
      onNodeDragEnd(draggingNodeId);
      setDraggingNodeId(null);
    }

    // Requirement 2: If releasing while magnetically snapped near a target node edge, complete connection!
    if (connectingSourceId && nearSnapTargetNode) {
      completePortConnection(e, nearSnapTargetNode.id);
      return;
    }

    // Requirement 4 (open-ai-canvas style):
    // When dragging a connection line from a port and releasing on empty canvas,
    // pop up the Node Creation Menu right at the drop point to create & auto-connect!
    if (connectingSourceId && containerRef.current) {
      const worldPos = screenToCanvas(e.clientX, e.clientY);
      const dragDist = connectStartWorldPos
        ? Math.hypot(worldPos.x - connectStartWorldPos.x, worldPos.y - connectStartWorldPos.y)
        : 999;

      if (dragDist > 24) {
        const rect = containerRef.current.getBoundingClientRect();
        setContextMenu({
          clientX: Math.min(e.clientX - rect.left, rect.width - 250),
          clientY: Math.min(e.clientY - rect.top, rect.height - 340),
          worldX: Math.round(worldPos.x / 10) * 10,
          worldY: Math.round(worldPos.y / 10) * 10,
          sourceNodeId: connectingSourceId,
        });
        setConnectingSourceId(null);
        setConnectStartWorldPos(null);
        return;
      }
    }
  };

  const handleWheelCanvas = (e: React.WheelEvent<HTMLDivElement>) => {
    stopInertia();
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number((zoom * factor).toFixed(2)))
      );

      const scaleChange = nextZoom / zoom;
      const nextPanX = cursorX - (cursorX - pan.x) * scaleChange;
      const nextPanY = cursorY - (cursorY - pan.y) * scaleChange;

      setZoom(nextZoom);
      setPan(clampPan(nextPanX, nextPanY));
    } else {
      setPan((prev) =>
        clampPan(prev.x - e.deltaX * 0.75, prev.y - e.deltaY * 0.75)
      );
    }
  };

  const startNodeDrag = (e: React.MouseEvent, node: CanvasNode) => {
    if (e.button === 2) return;
    e.stopPropagation();
    stopInertia();
    setContextMenu(null);
    onSelectNode(node.id);
    if (activeTool === 'connect') {
      const portPos = getNodePortCoords(node, 'output');
      setConnectingSourceId(node.id);
      setConnectStartWorldPos(portPos);
      return;
    }
    onNodeDragStart(node.id);
    const worldPos = screenToCanvas(e.clientX, e.clientY);
    setDraggingNodeId(node.id);
    setNodeDragOffset({
      x: worldPos.x - node.position.x,
      y: worldPos.y - node.position.y,
    });
  };

  const startPortConnection = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setContextMenu(null);
    const portPos = getNodePortCoords(node, 'output');
    setConnectingSourceId(node.id);
    setConnectStartWorldPos(portPos);
    setMouseCanvasPos(portPos);
  };

  const completePortConnection = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!connectingSourceId || connectingSourceId === targetId) {
      setConnectingSourceId(null);
      setConnectStartWorldPos(null);
      return;
    }
    const sourceNode = nodes.find((n) => n.id === connectingSourceId);
    let relationType: EdgeRelationType = 'script_breakdown';
    if (sourceNode?.type === 'character') relationType = 'character_ref';
    else if (sourceNode?.type === 'scene_asset') relationType = 'scene_ref';
    else if (sourceNode?.type === 'storyboard') relationType = 'shot_sequence';

    onAddEdge(connectingSourceId, targetId, relationType);
    setConnectingSourceId(null);
    setConnectStartWorldPos(null);
  };

  const resetViewport = () => {
    stopInertia();
    setPan({ x: 18, y: 14 });
    setZoom(0.76);
  };

  const groupNodes = nodes.filter((n) => n.type === 'group');
  const cardNodes = nodes.filter((n) => n.type !== 'group');

  const getUpstreamAnchorsForNode = (nodeId: string) => {
    const incomingIds = edges
      .filter((e) => e.targetNodeId === nodeId)
      .map((e) => e.sourceNodeId);
    return nodes.filter((n) => incomingIds.includes(n.id));
  };

  const getTypeLabel = (type: NodeCategory) => {
    switch (type) {
      case 'character':
        return '图片 / 角色资产';
      case 'scene_asset':
        return '图片 / 载具场景资产';
      case 'script':
        return '分场剧本';
      case 'storyboard':
      case 'video_clip':
        return '视频分镜';
      case 'text_note':
        return '文本批注';
      case 'audio_clip':
        return '音频音轨';
      case 'storyboard_table':
        return '七段式分镜表';
      case 'idea':
        return '故事灵感';
      default:
        return '自由分组';
    }
  };

  const getGenBoxHeaderTitle = (type: NodeCategory) => {
    switch (type) {
      case 'character':
        return '角色四视图资产生成';
      case 'scene_asset':
        return '场景/载具资产生成';
      case 'storyboard':
      case 'video_clip':
        return '视频分镜提示词生成';
      case 'script':
        return '分场剧本扩写生成';
      case 'audio_clip':
        return '音轨与气口提示词生成';
      default:
        return '节点内容编辑与生成';
    }
  };

  const handleCopyPrompt = (e: React.MouseEvent, nodeId: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedNodeId(nodeId);
    setTimeout(() => setCopiedNodeId(null), 1800);
  };

  const handleUpdatePromptInGenBox = (node: CanvasNode, newText: string) => {
    if (node.type === 'storyboard' || node.type === 'video_clip') {
      const activeVm: VideoModelTarget = node.data.videoModelTarget || 'seedance_2_0';
      onUpdateNodeData(
        node.id,
        {
          ...node.data,
          visualPrompt: newText,
          videoPrompts: {
            ...(node.data.videoPrompts || {}),
            [activeVm]: newText,
          },
        },
        `编辑「${node.data.title}」视频提示词`
      );
    } else if (node.type === 'character' || node.type === 'scene_asset') {
      onUpdateNodeData(
        node.id,
        {
          ...node.data,
          consistencyPrompt: newText,
        },
        `编辑「${node.data.title}」资产提示词`
      );
    } else if (node.type === 'script') {
      onUpdateNodeData(
        node.id,
        {
          ...node.data,
          scriptBody: newText,
        },
        `编辑「${node.data.title}」剧本正文`
      );
    } else if (node.type === 'audio_clip') {
      onUpdateNodeData(
        node.id,
        {
          ...node.data,
          audioTranscript: newText,
        },
        `编辑「${node.data.title}」音轨词`
      );
    } else {
      onUpdateNodeData(
        node.id,
        {
          ...node.data,
          textNoteContent: newText,
          noteText: newText,
        },
        `编辑「${node.data.title}」批注`
      );
    }
  };

  const toolbarTooltipClass = `pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border z-40 ${
    darkMode
      ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
      : 'bg-slate-900 border-slate-800 text-white'
  }`;

  const defaultEdgeOpacity = darkMode ? 0.6 : 0.72;

  // Source node for active drag wire OR open edge-drop menu
  const activeWireSourceId = connectingSourceId || contextMenu?.sourceNodeId || null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMoveCanvas}
      onMouseUp={handleMouseUpCanvas}
      onWheel={handleWheelCanvas}
      onContextMenu={handleContextMenuCanvas}
      data-canvas-bg="true"
      className={`relative flex-1 h-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors ${
        darkMode ? 'canvas-grid-dark text-zinc-100' : 'canvas-grid-light text-slate-900'
      }`}
      style={{
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Top-Left Minimalist Canvas Status Banner */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
        <div
          className={`px-3.5 py-2 rounded-lg border text-xs flex items-center gap-2.5 backdrop-blur-md ${
            darkMode
              ? 'bg-zinc-900/95 border-zinc-800 text-zinc-200 shadow-lg'
              : 'bg-white/95 border-slate-200 text-slate-600 shadow-xs'
          }`}
        >
          <span className={`font-semibold ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
            无限画布 (单击节点弹出生成框 · 从右侧 ⊕ 拖出连线松手可新建并自动连接节点)
          </span>
          <span aria-hidden="true" className={darkMode ? 'text-zinc-500' : 'text-slate-400'}>
            ·
          </span>
          <span className="font-mono tabular-nums">
            {cardNodes.length} 节点 / {edges.length} 连线
          </span>
          {connectingSourceId && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-medium">
                拖至目标节点 ⊕ 连接，或在空白处松手弹出新建节点菜单...
              </span>
            </>
          )}
        </div>
      </div>

      {/* Floating Reopen Agent Panel Button when Right Panel is Hidden */}
      {!isAgentPanelOpen && (
        <button
          type="button"
          onClick={onToggleAgentPanel}
          className={`absolute top-4 right-4 z-30 px-3.5 py-2 rounded-xl border text-xs font-medium shadow-xl flex items-center gap-2 cursor-pointer transition-colors ${
            darkMode
              ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
              : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PanelRightOpen className="w-4 h-4" />
          <span>展开漫剧老李 Agent 面板</span>
        </button>
      )}

      {/* Right-Click OR Edge-Drop Node Creation Menu (open-ai-canvas style) */}
      {contextMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
          className={`absolute z-50 w-64 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md text-xs ${
            darkMode
              ? 'bg-zinc-900/98 border-zinc-700 text-zinc-100'
              : 'bg-white/98 border-slate-200 text-slate-900'
          }`}
        >
          <div
            className={`px-2.5 py-1.5 text-[10px] font-mono border-b mb-1 flex items-center justify-between ${
              darkMode ? 'text-zinc-300 border-zinc-800' : 'text-slate-600 border-slate-100'
            }`}
          >
            <span className="truncate font-semibold">
              {contextMenu.sourceNodeId
                ? `🔗 连线新建并自动连接自「${
                    nodes
                      .find((n) => n.id === contextMenu.sourceNodeId)
                      ?.data.title.split('·')[0] || '上一节点'
                  }」`
                : '在当前光标位置新建画布节点'}
            </span>
            <button
              type="button"
              onClick={() => setContextMenu(null)}
              className={`cursor-pointer ml-1 ${
                darkMode
                  ? 'text-zinc-400 hover:text-zinc-100'
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {[
            {
              type: 'storyboard' as NodeCategory,
              icon: Film,
              label: '视频生成 / 9:16 视觉分镜节点',
              tag: '@Video',
            },
            {
              type: 'character' as NodeCategory,
              icon: UserCheck,
              label: '图片生成 / 角色四视图资产',
              tag: '@Image1',
            },
            {
              type: 'scene_asset' as NodeCategory,
              icon: MapPin,
              label: '图片生成 / 场景与载具锚点',
              tag: '@Image2',
            },
            {
              type: 'script' as NodeCategory,
              icon: FileText,
              label: '分场剧本节点 (黄金前3秒)',
              tag: 'Script',
            },
            {
              type: 'audio_clip' as NodeCategory,
              icon: Volume2,
              label: '音频生成 / 台词音效节点',
              tag: '@Audio1',
            },
            {
              type: 'storyboard_table' as NodeCategory,
              icon: Table2,
              label: '漫剧老李·七段式分镜统筹表',
              tag: 'Table',
            },
            {
              type: 'text_note' as NodeCategory,
              icon: Type,
              label: '文本 / 原著文案批注节点',
              tag: 'Text',
            },
            {
              type: 'group' as NodeCategory,
              icon: FolderPlus,
              label: '添加自由场次分组框',
              tag: 'Group',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  if (contextMenu.sourceNodeId && item.type !== 'group') {
                    onAddConnectedNode(
                      contextMenu.sourceNodeId,
                      item.type,
                      contextMenu.worldX,
                      contextMenu.worldY
                    );
                  } else {
                    onAddNode(item.type, contextMenu.worldX, contextMenu.worldY);
                  }
                  setContextMenu(null);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                  darkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.tag}
                </span>
              </button>
            );
          })}

          <div
            className={`my-1 border-t ${
              darkMode ? 'border-zinc-800' : 'border-slate-100'
            }`}
          />
          <button
            type="button"
            onClick={() => {
              onAutoLayout();
              setContextMenu(null);
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors cursor-pointer ${
              darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>一键拓扑对齐全部节点</span>
          </button>
        </div>
      )}

      {/* Transformed Infinite World Layer */}
      <div
        data-canvas-bg="true"
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          width: 3400,
          height: 2400,
        }}
      >
        {/* 1. Freeform Group Containers */}
        {groupNodes.map((group) => {
          const isSelected = selectedNodeId === group.id;
          return (
            <div
              key={group.id}
              onMouseDown={(e) => startNodeDrag(e, group)}
              style={{
                left: group.position.x,
                top: group.position.y,
                width: group.width,
                height: group.height || 760,
              }}
              className={`absolute rounded-2xl border border-dashed transition-colors p-4 ${
                darkMode
                  ? isSelected
                    ? 'bg-zinc-900/65 border-zinc-500'
                    : 'bg-zinc-900/35 border-zinc-800'
                  : isSelected
                  ? 'bg-slate-100/80 border-slate-400'
                  : 'bg-slate-100/50 border-slate-300/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`text-xs font-semibold tracking-tight ${
                      darkMode ? 'text-zinc-100' : 'text-slate-800'
                    }`}
                  >
                    {group.data.title}
                  </h3>
                  {group.data.groupDescription && (
                    <p
                      className={`text-[11px] mt-0.5 ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      {group.data.groupDescription}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode(group.id);
                  }}
                  title="移除分组框"
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    darkMode
                      ? 'text-zinc-400 hover:text-zinc-100'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* 2. SVG Cubic Bezier Data-Flow Edges Layer (Z-Index Ordered + Micro Path Offsets + Injection Snap Endpoint Rings) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-15"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow-custom"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 1.5 L 8 5 L 0 8.5 z"
                fill={edgeColor}
                fillOpacity={defaultEdgeOpacity}
              />
            </marker>
            <filter id="particle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {sortedAndOffsetEdges.map(
            ({
              edge,
              isEdgeHovered,
              isInHoveredChain,
              isConnectedToSelected,
              isDimmedByHover,
              cp1OffsetY,
              cp2OffsetY,
            }) => {
              const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
              const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
              if (!sourceNode || !targetNode) return null;

              const start = getNodePortCoords(sourceNode, 'output');
              const end = getNodePortCoords(targetNode, 'input');
              const dx = Math.max(64, Math.abs(end.x - start.x) * 0.45);

              // Requirement 1: Apply Attribute-Injection micro curvature offset so crossing/sibling wires never overlap
              const cp1x = start.x + dx;
              const cp1y = start.y + cp1OffsetY;
              const cp2x = end.x - dx;
              const cp2y = end.y + cp2OffsetY;

              const pathD = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;

              const chordLength = Math.hypot(end.x - start.x, end.y - start.y);
              const dynamicPathLength = Math.max(
                120,
                Math.round(chordLength * 1.24 + Math.abs(cp1OffsetY))
              );

              const isElevated =
                isEdgeHovered || isInHoveredChain || isConnectedToSelected;
              const strokeW = isEdgeHovered || isInHoveredChain ? 2 : 1;
              const effectiveOpacity = isDimmedByHover
                ? 0.12
                : isEdgeHovered || isInHoveredChain
                ? 0.95
                : defaultEdgeOpacity;

              const durationSec =
                isEdgeHovered || isInHoveredChain ? '1.4s' : '2.4s';
              const halfOffsetSec =
                isEdgeHovered || isInHoveredChain ? '-0.7s' : '-1.2s';

              return (
                <g key={edge.id} className="pointer-events-auto">
                  {/* Invisible wider hit-area for hover & click */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEdge(edge.id);
                    }}
                  >
                    <title>点击断开此属性注入连线</title>
                  </path>

                  {/* Requirement 1: Subtle crossing bridge halo under-stroke so overlapping wires have clean Z-index separation */}
                  {!isDimmedByHover && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={darkMode ? '#09090B' : '#FAFAFA'}
                      strokeOpacity={0.85}
                      strokeWidth={strokeW + 3}
                      className="pointer-events-none"
                    />
                  )}

                  {/* Base continuous guide rail */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={edgeColor}
                    strokeOpacity={isDimmedByHover ? 0.06 : 0.22}
                    strokeWidth={strokeW}
                    style={{
                      transition: 'stroke-width 150ms ease, stroke-opacity 200ms ease',
                    }}
                  />

                  {/* Animated attribute-injection stream line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={edgeColor}
                    strokeOpacity={effectiveOpacity}
                    strokeWidth={strokeW}
                    style={
                      {
                        '--edge-path-length': `${dynamicPathLength}px`,
                      } as React.CSSProperties
                    }
                    className={
                      isEdgeHovered || isInHoveredChain
                        ? 'edge-stream-line-fast'
                        : 'edge-stream-line'
                    }
                    markerEnd="url(#arrow-custom)"
                  />

                  {/* Source Port Anchor Dot */}
                  <circle
                    cx={start.x}
                    cy={start.y}
                    r="2.5"
                    fill={edgeColor}
                    fillOpacity={effectiveOpacity}
                  />

                  {/* Requirement 2: Explicit Attribute-Injection Endpoint Snap Ring Animation at Target Node Edge */}
                  <g className="pointer-events-none">
                    {/* Soft translucent outer glow halo at target node boundary */}
                    {!isDimmedByHover && (
                      <circle
                        cx={end.x}
                        cy={end.y}
                        r={isElevated ? 7.5 : 5.5}
                        fill={edgeColor}
                        fillOpacity={isElevated ? 0.28 : 0.14}
                        filter="url(#particle-glow)"
                      />
                    )}

                    {/* Animated semi-transparent glowing ring expanding at target node injection point */}
                    {!isDimmedByHover && (
                      <circle
                        cx={end.x}
                        cy={end.y}
                        r="4"
                        fill="none"
                        stroke={edgeColor}
                        strokeWidth={isElevated ? '1.6' : '1.1'}
                      >
                        <animate
                          attributeName="r"
                          values={isElevated ? '3.5;12.5;3.5' : '3.5;9.5;3.5'}
                          dur={isElevated ? '1.5s' : '2.4s'}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          values={isElevated ? '0.85;0.05;0.85' : '0.55;0.04;0.55'}
                          dur={isElevated ? '1.5s' : '2.4s'}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Crisp inner injection snap core dot */}
                    <circle
                      cx={end.x}
                      cy={end.y}
                      r={isElevated ? 3.4 : 2.8}
                      fill={edgeColor}
                      fillOpacity={effectiveOpacity}
                    />
                  </g>

                  {!isDimmedByHover && (
                    <>
                      <circle
                        r={isEdgeHovered || isInHoveredChain ? 3.5 : 2.6}
                        fill={edgeColor}
                        fillOpacity={0.95}
                        filter="url(#particle-glow)"
                        className="pointer-events-none"
                      >
                        <animateMotion
                          dur={durationSec}
                          repeatCount="indefinite"
                          path={pathD}
                        />
                      </circle>

                      <circle
                        r={isEdgeHovered || isInHoveredChain ? 2.6 : 2.0}
                        fill={edgeColor}
                        fillOpacity={0.75}
                        className="pointer-events-none"
                      >
                        <animateMotion
                          dur={durationSec}
                          begin={halfOffsetSec}
                          repeatCount="indefinite"
                          path={pathD}
                        />
                      </circle>
                    </>
                  )}
                </g>
              );
            }
          )}

          {/* Active Dragging Wire with Magnetic Target Snap & Semi-Transparent Glowing Ring Animation */}
          {activeWireSourceId &&
            (() => {
              const sourceNode = nodes.find((n) => n.id === activeWireSourceId);
              if (!sourceNode) return null;
              const start = getNodePortCoords(sourceNode, 'output');
              const snappedPort = nearSnapTargetNode
                ? getNodePortCoords(nearSnapTargetNode, 'input')
                : null;
              const targetPt = contextMenu?.sourceNodeId
                ? { x: contextMenu.worldX, y: contextMenu.worldY }
                : snappedPort || mouseCanvasPos;

              const dx = Math.max(40, Math.abs(targetPt.x - start.x) * 0.42);
              const d = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${
                targetPt.x - dx
              } ${targetPt.y}, ${targetPt.x} ${targetPt.y}`;
              const previewLen = Math.max(
                120,
                Math.round(
                  Math.hypot(targetPt.x - start.x, targetPt.y - start.y) * 1.2
                )
              );
              return (
                <g className="pointer-events-none">
                  <path
                    d={d}
                    fill="none"
                    stroke={snappedPort ? '#34D399' : edgeColor}
                    strokeOpacity={0.95}
                    strokeWidth="2"
                    style={
                      {
                        '--edge-path-length': `${previewLen}px`,
                      } as React.CSSProperties
                    }
                    className="edge-stream-line-fast"
                  />
                  <circle
                    r="3.8"
                    fill={snappedPort ? '#34D399' : edgeColor}
                    filter="url(#particle-glow)"
                  >
                    <animateMotion dur="0.85s" repeatCount="indefinite" path={d} />
                  </circle>

                  {/* Semi-transparent glowing injection snap ring when approaching target node edge */}
                  <g>
                    <circle
                      cx={targetPt.x}
                      cy={targetPt.y}
                      r={snappedPort ? 11 : 6}
                      fill={snappedPort ? '#34D399' : edgeColor}
                      fillOpacity={snappedPort ? 0.32 : 0.18}
                      filter="url(#particle-glow)"
                    />
                    <circle
                      cx={targetPt.x}
                      cy={targetPt.y}
                      r="5"
                      fill="none"
                      stroke={snappedPort ? '#34D399' : edgeColor}
                      strokeWidth="2"
                    >
                      <animate
                        attributeName="r"
                        values={snappedPort ? '5;18;5' : '4;12;4'}
                        dur="1.1s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.9;0.05;0.9"
                        dur="1.1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={targetPt.x}
                      cy={targetPt.y}
                      r={snappedPort ? 4.5 : 3}
                      fill={snappedPort ? '#34D399' : edgeColor}
                    />
                  </g>
                </g>
              );
            })()}
        </svg>

        {/* 3. Foreground Cards with open-ai-canvas (影策) Outside Header, (+) Ports & Bottom Floating Generation Box */}
        {cardNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const upstreamAnchors = getUpstreamAnchorsForNode(node.id);
          const activeVideoModel: VideoModelTarget =
            node.data.videoModelTarget || 'seedance_2_0';
          const currentPromptText =
            node.type === 'storyboard' || node.type === 'video_clip'
              ? node.data.videoPrompts?.[activeVideoModel] || node.data.visualPrompt || ''
              : node.type === 'character' || node.type === 'scene_asset'
              ? node.data.consistencyPrompt || ''
              : node.type === 'script'
              ? node.data.scriptBody || ''
              : node.type === 'audio_clip'
              ? node.data.audioTranscript || ''
              : node.data.textNoteContent || node.data.noteText || '';

          const isMediaNode =
            node.type === 'character' ||
            node.type === 'scene_asset' ||
            node.type === 'storyboard' ||
            node.type === 'video_clip';

          const isRelatedToHovered = hoveredLogicChain
            ? hoveredLogicChain.relatedNodes.has(node.id)
            : true;
          const isDimmed = hoveredLogicChain && !isRelatedToHovered;
          const isHighlightedChainMember =
            hoveredLogicChain &&
            isRelatedToHovered &&
            hoveredNodeId !== node.id;

          const portOffsetY = getPortOffsetY(node);

          return (
            <div
              key={node.id}
              onMouseDown={(e) => startNodeDrag(e, node)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: node.width,
              }}
              className={`absolute rounded-2xl border transition-all duration-200 ${
                isSelected ? 'z-40' : isRelatedToHovered && hoveredNodeId ? 'z-20' : 'z-10'
              } ${isDimmed ? 'opacity-25' : 'opacity-100'} ${
                darkMode
                  ? isSelected
                    ? 'bg-zinc-900 border-zinc-100 shadow-2xl ring-1 ring-zinc-100'
                    : isHighlightedChainMember
                    ? 'bg-zinc-900 border-zinc-400 shadow-xl ring-1 ring-zinc-500/60'
                    : 'bg-zinc-900/95 border-zinc-800 hover:border-zinc-600 shadow-lg'
                  : isSelected
                  ? 'bg-white border-slate-900 shadow-2xl ring-1 ring-slate-900'
                  : isHighlightedChainMember
                  ? 'bg-white border-slate-500 shadow-lg ring-1 ring-slate-400'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* OPEN-AI-CANVAS STYLE: Outside Top-Left Label ([Icon] 图片 / 视频分镜 ✎) */}
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                className={`absolute -top-6 left-1 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer select-none ${
                  darkMode ? 'text-zinc-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{getTypeLabel(node.type)}</span>
                <Pencil className="w-2.5 h-2.5 opacity-70" />
              </div>

              {/* Left Input Port (+) Circle — Matching user screenshot */}
              <button
                type="button"
                title="左侧输入连接点 (⊕)：点击接收上游连线"
                onMouseUp={(e) => completePortConnection(e, node.id)}
                onClick={(e) => completePortConnection(e, node.id)}
                style={{ top: `${portOffsetY}px`, left: '-12px' }}
                className={`absolute -translate-y-1/2 w-6 h-6 rounded-full border flex items-center justify-center transition-transform hover:scale-125 z-20 cursor-pointer shadow-md ${
                  connectingSourceId && connectingSourceId !== node.id
                    ? 'bg-emerald-400 border-white text-zinc-950 scale-125'
                    : darkMode
                    ? 'bg-zinc-900 border-zinc-500 text-zinc-200 hover:border-zinc-100 hover:bg-zinc-800'
                    : 'bg-white border-slate-400 text-slate-700 hover:border-slate-900'
                }`}
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>

              {/* Right Output Port (+) Circle — Dragging out and releasing on blank canvas opens Node Creation Menu */}
              <button
                type="button"
                title="右侧输出连接点 (⊕)：按住拖出连线，在空白处松手可弹出菜单新建并自动连接下游节点"
                onMouseDown={(e) => startPortConnection(e, node)}
                onClick={(e) => startPortConnection(e, node)}
                style={{ top: `${portOffsetY}px`, right: '-12px' }}
                className={`absolute -translate-y-1/2 w-6 h-6 rounded-full border flex items-center justify-center transition-transform hover:scale-125 z-20 cursor-pointer shadow-md ${
                  connectingSourceId === node.id
                    ? 'bg-amber-400 border-white text-zinc-950 scale-125'
                    : darkMode
                    ? 'bg-zinc-900 border-zinc-500 text-zinc-200 hover:border-zinc-100 hover:bg-zinc-800'
                    : 'bg-white border-slate-400 text-slate-700 hover:border-slate-900'
                }`}
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>

              {/* Card Body */}
              <div className="p-3.5 flex flex-col gap-2.5">
                {/* Compact Header Bar */}
                <div
                  className={`flex items-center justify-between text-[11px] ${
                    darkMode ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {node.data.shotNumber && (
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          darkMode ? 'text-zinc-100' : 'text-slate-900'
                        }`}
                      >
                        {node.data.shotNumber}
                      </span>
                    )}
                    {node.data.sceneNumber && (
                      <span className="font-mono tabular-nums font-semibold">
                        {node.data.sceneNumber}
                      </span>
                    )}
                    {!node.data.shotNumber && !node.data.sceneNumber && (
                      <span className="truncate">{node.data.roleType || node.data.subtitle}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] opacity-80">
                      {node.type === 'storyboard' || node.type === 'video_clip'
                        ? `${node.data.aspectRatio || '9:16'} · ${node.data.durationSec ?? 3.5}s`
                        : node.type === 'character'
                        ? '4-VIEW PROMPT'
                        : node.type === 'scene_asset'
                        ? 'ASSET PROMPT'
                        : node.type === 'audio_clip'
                        ? '@AUDIO1'
                        : node.type === 'storyboard_table'
                        ? '7-PART SHEET'
                        : 'SCRIPT'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      title="删除节点 (支持 Ctrl+Z 撤销)"
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        darkMode
                          ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                          : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 1. Pure Visual Viewport for Image/Video Nodes */}
                {isMediaNode && (
                  <CinematicArtRenderer
                    nodeType={
                      node.type === 'video_clip'
                        ? 'storyboard'
                        : (node.type as 'character' | 'scene_asset' | 'storyboard')
                    }
                    data={node.data}
                    upstreamAnchorCount={upstreamAnchors.length}
                  />
                )}

                {/* 2. Audio Clip Node Content */}
                {node.type === 'audio_clip' && (
                  <div
                    className={`p-3 rounded-lg border space-y-2 ${
                      darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">
                          {node.data.audioBpmOrMood || 'FACS 情绪台词重音轨'}
                        </span>
                      </span>
                      <span>{node.data.durationSec ?? 3.5}s</span>
                    </div>
                    <div className="flex items-end gap-1 h-8 pt-1">
                      {[35, 65, 90, 45, 80, 100, 60, 75, 40, 85, 95, 50, 70, 30, 60, 85, 55, 40].map(
                        (h, idx) => (
                          <div
                            key={idx}
                            style={{ height: `${h}%` }}
                            className={`flex-1 rounded-full ${
                              darkMode ? 'bg-zinc-400' : 'bg-slate-600'
                            }`}
                          />
                        )
                      )}
                    </div>
                    {node.data.audioTranscript && (
                      <p className="text-[11px] line-clamp-2 opacity-85">
                        {node.data.audioTranscript}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Text Note Node Content */}
                {node.type === 'text_note' && (
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="line-clamp-6 whitespace-pre-line">
                      {node.data.textNoteContent ||
                        node.data.noteText ||
                        '在此记录原著文案、导演批注或分镜修改意见...'}
                    </p>
                  </div>
                )}

                {/* 4. Storyboard Table Node Content */}
                {node.type === 'storyboard_table' && (
                  <div
                    className={`rounded-lg border overflow-hidden text-[11px] ${
                      darkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div
                      className={`grid grid-cols-12 px-3 py-2 font-mono text-[10px] font-semibold border-b ${
                        darkMode
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="col-span-1">镜号</span>
                      <span className="col-span-2">景别/运镜</span>
                      <span className="col-span-2">180°轴线站位</span>
                      <span className="col-span-2">FACS微表情</span>
                      <span className="col-span-4">画面与爽点内容</span>
                      <span className="col-span-1 text-right">时长</span>
                    </div>
                    {(node.data.tableRows || []).map((row, rIdx) => (
                      <div
                        key={rIdx}
                        className={`grid grid-cols-12 px-3 py-2 items-center border-b last:border-b-0 gap-2 ${
                          darkMode ? 'border-zinc-900' : 'border-slate-200/60'
                        }`}
                      >
                        <span className="col-span-1 font-mono font-semibold text-amber-400">
                          {row.shotNo}
                        </span>
                        <span className="col-span-2 truncate text-[10px] font-mono">
                          {row.shotSize} · {row.cameraMove}
                        </span>
                        <span className="col-span-2 truncate text-[10px] opacity-85">
                          {row.axisLine || '严格锁定180°轴线'}
                        </span>
                        <span className="col-span-2 truncate text-[10px] opacity-85">
                          {row.facsMicro || 'AU5+AU12'}
                        </span>
                        <span className="col-span-4 truncate">
                          {row.visualContent || row.summary}
                        </span>
                        <span className="col-span-1 text-right font-mono text-[10px]">
                          {row.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Minimal Card Title & Metadata Footer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        darkMode ? 'text-zinc-100' : 'text-slate-900'
                      }`}
                    >
                      {node.data.title}
                    </h4>
                  </div>

                  {isMediaNode ? (
                    <div
                      className={`flex items-center justify-between text-[11px] ${
                        darkMode ? 'text-zinc-400' : 'text-slate-500'
                      }`}
                    >
                      <span className="truncate">
                        {node.type === 'storyboard' || node.type === 'video_clip'
                          ? `${node.data.shotSize || '特写 CU'} · ${node.data.cameraMove || '[Push in]'}`
                          : node.data.costumeDetails || node.data.subtitle}
                      </span>
                      <span
                        className={`font-mono text-[10px] shrink-0 ml-2 ${
                          isSelected ? 'text-emerald-400 font-semibold' : ''
                        }`}
                      >
                        {isSelected ? '生成框已展开 ▾' : '单击弹出生成框'}
                      </span>
                    </div>
                  ) : node.type === 'script' ? (
                    <div
                      className={`space-y-2 text-xs border-t pt-2 ${
                        darkMode ? 'border-zinc-800' : 'border-slate-100'
                      }`}
                    >
                      {node.data.hookPoint && (
                        <p
                          className={`font-medium leading-relaxed ${
                            darkMode ? 'text-zinc-100' : 'text-slate-800'
                          }`}
                        >
                          {node.data.hookPoint}
                        </p>
                      )}
                      {node.data.scriptBody && (
                        <p
                          className={`leading-relaxed line-clamp-3 ${
                            darkMode ? 'text-zinc-300' : 'text-slate-600'
                          }`}
                        >
                          {node.data.scriptBody}
                        </p>
                      )}
                      {node.data.dialogues && node.data.dialogues.length > 0 && (
                        <div
                          className={`pt-1.5 border-t space-y-1 ${
                            darkMode ? 'border-zinc-800' : 'border-slate-100'
                          }`}
                        >
                          {node.data.dialogues.slice(0, 2).map((d, i) => (
                            <p
                              key={i}
                              className={`text-[11px] truncate ${
                                darkMode ? 'text-zinc-200' : 'text-slate-700'
                              }`}
                            >
                              <span className="font-semibold">{d.speaker}</span>：{d.line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* =====================================================================
                  REQUIREMENT 3: OPEN-AI-CANVAS (影策) FLOATING GENERATION COMPOSER BOX
                  Appears directly below the selected node when clicked, matching the
                  user's reference screenshot `/public/assets/aistudio/image_b764d240.png`
                 ===================================================================== */}
              {isSelected && node.type !== 'storyboard_table' && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-3.5 w-[475px] z-50 p-4 rounded-2xl border shadow-2xl space-y-3 transition-all ${
                    darkMode
                      ? 'bg-[#141418]/98 border-zinc-700 text-zinc-100'
                      : 'bg-white/98 border-slate-200/90 text-slate-900'
                  }`}
                >
                  {/* Row 1: Header (Left: Icon + Generation Title + Format Switcher | Right: 风格 · 预设 · Expand · Close) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold tracking-tight whitespace-nowrap">
                        {getGenBoxHeaderTitle(node.type)}
                      </span>

                      {(node.type === 'storyboard' || node.type === 'video_clip') && (
                        <div
                          className={`flex items-center gap-0.5 p-0.5 rounded-lg border ml-1 ${
                            darkMode
                              ? 'bg-zinc-900 border-zinc-800'
                              : 'bg-slate-100 border-slate-200'
                          }`}
                        >
                          {(
                            ['seedance_2_0', 'seedance_2_5', 'minimax_h3'] as VideoModelTarget[]
                          ).map((vm) => (
                            <button
                              key={vm}
                              type="button"
                              onClick={() => onSwitchNodeVideoModel(node.id, vm)}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                                activeVideoModel === vm
                                  ? darkMode
                                    ? 'bg-zinc-100 text-zinc-950'
                                    : 'bg-slate-900 text-white'
                                  : darkMode
                                  ? 'text-zinc-400 hover:text-zinc-100'
                                  : 'text-slate-500 hover:text-slate-900'
                              }`}
                            >
                              {VIDEO_MODEL_LABELS[vm]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top-Right Controls matching screenshot: 🎨 风格 | ⊞ 预设 | ⤢ | ✕ */}
                    <div className="flex items-center gap-2 text-[11px] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const snippet =
                            STYLE_SNIPPETS[styleCycleIndex % STYLE_SNIPPETS.length];
                          setStyleCycleIndex((i) => i + 1);
                          handleUpdatePromptInGenBox(
                            node,
                            `${currentPromptText.trim()} | Style: [${snippet}]`
                          );
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          darkMode
                            ? 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="点击注入电影光影风格词"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>风格</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const preset =
                            PRESET_FORMULA_SNIPPETS[node.type] ||
                            PRESET_FORMULA_SNIPPETS.storyboard;
                          handleUpdatePromptInGenBox(
                            node,
                            `${currentPromptText.trim()}${preset}`
                          );
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          darkMode
                            ? 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="点击注入漫剧老李 180°轴线/FACS/四视图预设公式"
                      >
                        <Grid className="w-3.5 h-3.5" />
                        <span>预设</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenNodeInspector(node.id)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          darkMode
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="展开完整参数与三套提示词对照检视器"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectNode(null)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          darkMode
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="关闭生成框"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Editable Prompt Textarea */}
                  <div className="space-y-1.5">
                    <textarea
                      rows={4}
                      value={currentPromptText}
                      onChange={(e) => handleUpdatePromptInGenBox(node, e.target.value)}
                      placeholder="描述要生成的资产特征、分镜动作、运镜与提示词内容..."
                      className={`w-full p-2.5 rounded-xl border font-mono text-[11px] leading-relaxed resize-none focus:outline-none ${
                        darkMode
                          ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500'
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-slate-900'
                      }`}
                    />
                    {/* Subtle bottom handle bar matching screenshot */}
                    <div
                      className={`w-10 h-1 rounded-full mx-auto ${
                        darkMode ? 'bg-zinc-800' : 'bg-slate-200'
                      }`}
                    />
                  </div>

                  {/* Row 3: Bottom Bar matching screenshot (Model Selector Left | Icons + Spec Pill + Generate Button Right) */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {/* Left: AI Model Selector Pill */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <select
                        value={selectedModelId}
                        onChange={(e) => onSelectModel(e.target.value)}
                        className={`max-w-[185px] px-2.5 py-1.5 rounded-xl border text-[11px] font-medium truncate cursor-pointer focus:outline-none ${
                          darkMode
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                            : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {models.map((m) => (
                          <option
                            key={m.id}
                            value={m.id}
                            className={darkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-slate-900'}
                          >
                            {m.displayName}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={(e) => handleCopyPrompt(e, node.id, currentPromptText)}
                        className={`px-2 py-1.5 rounded-xl border text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                          darkMode
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                        title="一键复制当前提示词"
                      >
                        {copiedNodeId === node.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Right: Sliders · Camera Anchor Badge · Spec Pill · Submit Generate Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenNodeInspector(node.id)}
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          darkMode
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                            : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                        title="高级镜头与光影参数"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>

                      <div
                        title={
                          upstreamAnchors.length > 0
                            ? `已连线注入上游锚点：${upstreamAnchors
                                .map((a) => a.data.title)
                                .join('、')}`
                            : '可从左侧资产节点拖出连线注入一致性锚点'
                        }
                        className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 ${
                          darkMode
                            ? 'border-zinc-800 bg-zinc-900 text-zinc-300'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Camera className="w-3 h-3" />
                        <span>{upstreamAnchors.length}锚点</span>
                      </div>

                      {/* Aspect Ratio / Spec Toggle Pill */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextRatio =
                            node.data.aspectRatio === '16:9' ? '9:16' : '16:9';
                          onUpdateNodeData(
                            node.id,
                            { ...node.data, aspectRatio: nextRatio },
                            `切换画幅比例为 ${nextRatio}`
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono cursor-pointer transition-colors ${
                          darkMode
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                        }`}
                        title="点击切换 9:16 竖屏 / 16:9 横屏规格"
                      >
                        {node.data.aspectRatio || '9:16'} · 纯提示词 · 1条
                      </button>

                      {/* Primary Generate / Synthesize Action Pill matching screenshot's right pill */}
                      <button
                        type="button"
                        disabled={node.data.isRendering}
                        onClick={() => onRenderStoryboardNode(node.id)}
                        className={`pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          darkMode
                            ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                        title="调用当前大模型融合上游锚点，实时合成三套视频提示词与资产锁"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{node.data.isRendering ? '编译中' : '生成提示词'}</span>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            darkMode
                              ? 'bg-zinc-950 text-zinc-100'
                              : 'bg-white text-slate-900'
                          }`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Creator Toolbar with Command Pattern Undo/Redo & Edge Color Picker */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-2 rounded-2xl border shadow-2xl backdrop-blur-md ${
          darkMode
            ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100'
            : 'bg-white/95 border-slate-200/90 text-slate-800'
        }`}
      >
        {/* Command Pattern Undo / Redo Controls */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className={`group relative p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className={toolbarTooltipClass}>
            {canUndo ? `撤销 (Ctrl+Z)：${undoLabel}` : '暂无可撤销操作'}
          </span>
        </button>

        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className={`group relative p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className={toolbarTooltipClass}>
            {canRedo ? `重做 (Ctrl+Y)：${redoLabel}` : '暂无可重做操作'}
          </span>
        </button>

        <div className={`h-4 w-px mx-0.5 ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

        <button
          type="button"
          onClick={() => {
            setActiveTool('select');
            setConnectingSourceId(null);
          }}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTool === 'select'
              ? darkMode
                ? 'bg-zinc-100 text-zinc-950'
                : 'bg-slate-900 text-white'
              : darkMode
              ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>选择</span>
          <span className={toolbarTooltipClass}>选择或自由拖拽画布卡片 (支持惯性漫游)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('connect')}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTool === 'connect'
              ? darkMode
                ? 'bg-zinc-100 text-zinc-950'
                : 'bg-slate-900 text-white'
              : darkMode
              ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>连线</span>
          <span className={toolbarTooltipClass}>从节点 ⊕ 拖出连线松手可新建并连接下游节点</span>
        </button>

        {/* Custom Edge Color Picker Popover Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsColorMenuOpen((o) => !o);
            }}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              darkMode
                ? 'text-zinc-200 hover:bg-zinc-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full border border-white/40 shrink-0"
              style={{ backgroundColor: edgeColor }}
            />
            <Palette className="w-3.5 h-3.5" />
            <span>连线色</span>
          </button>

          {isColorMenuOpen && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className={`absolute bottom-12 left-1/2 -translate-x-1/2 p-3 rounded-2xl border shadow-2xl w-52 space-y-2.5 z-50 ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="text-[11px] font-semibold flex items-center justify-between">
                <span>自定义连线与粒子颜色</span>
                <span className="font-mono text-[10px] opacity-75">{edgeColor}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {EDGE_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onChangeEdgeColor(preset.value)}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] flex items-center gap-1.5 cursor-pointer ${
                      edgeColor.toLowerCase() === preset.value.toLowerCase()
                        ? darkMode
                          ? 'border-zinc-100 bg-zinc-800'
                          : 'border-slate-900 bg-slate-100'
                        : darkMode
                        ? 'border-zinc-800 hover:border-zinc-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="truncate">{preset.label.slice(2)}</span>
                  </button>
                ))}
              </div>
              <div
                className={`pt-1 border-t flex items-center justify-between gap-2 text-[11px] ${
                  darkMode ? 'border-zinc-800' : 'border-slate-200'
                }`}
              >
                <span>自由取色器：</span>
                <input
                  type="color"
                  value={edgeColor}
                  onChange={(e) => onChangeEdgeColor(e.target.value)}
                  className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>
          )}
        </div>

        <div className={`h-4 w-px mx-0.5 ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

        <button
          type="button"
          onClick={() => onAddNode('character')}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>+ 资产</span>
          <span className={toolbarTooltipClass}>新建 @Image 四视图角色/载具资产节点</span>
        </button>

        <button
          type="button"
          onClick={() => onAddNode('script')}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ 剧本</span>
          <span className={toolbarTooltipClass}>新建分场剧本节点</span>
        </button>

        <button
          type="button"
          onClick={() => onAddNode('storyboard')}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>+ 视频分镜</span>
          <span className={toolbarTooltipClass}>新建 9:16 视频分镜节点</span>
        </button>

        <button
          type="button"
          onClick={() => onAddNode('storyboard_table')}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>+ 分镜表</span>
          <span className={toolbarTooltipClass}>新建七段式分镜表格节点</span>
        </button>

        <div className={`h-4 w-px mx-0.5 ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

        <button
          type="button"
          onClick={onAutoLayout}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>拓扑对齐</span>
          <span className={toolbarTooltipClass}>按【资产锚点 → 剧本 → 分镜】自动拓扑对齐</span>
        </button>

        <div
          className={`flex items-center gap-1 pl-1 border-l font-mono tabular-nums text-xs ${
            darkMode ? 'border-zinc-800' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.max(MIN_ZOOM, Number((z - 0.1).toFixed(2))))
            }
            className={`group relative p-1.5 rounded transition-colors cursor-pointer ${
              darkMode
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span className={toolbarTooltipClass}>缩小画布 (最小 35%)</span>
          </button>
          <button
            type="button"
            onClick={resetViewport}
            className={`group relative px-1.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
              darkMode
                ? 'text-zinc-200 hover:text-white hover:bg-zinc-800'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {Math.round(zoom * 100)}%
            <span className={toolbarTooltipClass}>重置视口比例 (76%)</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => Math.min(MAX_ZOOM, Number((z + 0.1).toFixed(2))))
            }
            className={`group relative p-1.5 rounded transition-colors cursor-pointer ${
              darkMode
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className={toolbarTooltipClass}>放大画布 (最大 185%)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
