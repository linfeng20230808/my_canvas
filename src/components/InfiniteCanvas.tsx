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
  ArrowUp,
  Grid,
  Wand2,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  FolderKanban,
  Layers,
  Scan,
} from 'lucide-react';
import {
  CanvasNode,
  CanvasEdge,
  NodeCategory,
  EdgeRelationType,
  VideoModelTarget,
  AgentModelOption,
  AxisViolationItem,
} from '../types/canvas';
import {
  DRAMA_STYLE_PRESETS,
  DIRECTOR_FORMULA_PRESETS,
  DramaStylePreset,
  DirectorFormulaPreset,
} from '../data/stylePresets';
import { CinematicArtRenderer } from './CinematicArtRenderer';

export type NodeOrganizeMode =
  | 'category_groups'
  | 'type_columns'
  | 'pipeline_compact';

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
  axisViolations?: AxisViolationItem[];
  onUndo: () => void;
  onRedo: () => void;
  onSelectModel: (modelId: string) => void;
  onChangeEdgeColor: (color: string) => void;
  onToggleAgentPanel: () => void;
  onSelectNode: (id: string | null) => void;
  onNodeDragStart: (id: string) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onUpdateMultipleNodesPositions?: (
    updates: { id: string; x: number; y: number }[]
  ) => void;
  onNodeDragEnd: (id: string, draggedGroupIds?: string[]) => void;
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
  onDeleteMultipleNodes?: (ids: string[]) => void;
  onClearCanvas: () => void;
  onAddEdge: (sourceId: string, targetId: string, relationType: EdgeRelationType) => void;
  onDeleteEdge: (edgeId: string) => void;
  onRenderStoryboardNode: (nodeId: string) => void;
  onGenerateNodeImage: (nodeId: string, imageModel?: string) => void;
  onGenerateNodeVideo: (nodeId: string, videoModel?: string) => void;
  onDecomposeScriptNode?: (nodeId: string) => void;
  onOpenNodeInspector: (nodeId: string) => void;
  onAutoLayout: () => void;
  onOrganizeNodes?: (mode: NodeOrganizeMode) => void;
  onRunAxisInspection?: () => void;
  onAutoFixAxisViolations?: () => void;
}

const VIDEO_MODEL_LABELS: Record<VideoModelTarget, string> = {
  minimax_h3: 'MiniMax H3',
  seedance_2_0: 'Seedance 2.0',
  seedance_2_5: 'Seedance 2.5',
};

const IMAGE_GEN_MODELS = [
  { id: 'nano-banana-fast', label: 'Nano Banana Fast (极速出图)' },
  { id: 'nano-banana-2.1', label: 'Nano Banana 2.1 (1K/2K/4K)' },
  { id: 'nano-banana-2', label: 'Nano Banana 2 (四视图定妆)' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro (高精旗舰)' },
  { id: 'gpt-image-2.5', label: 'GPT Image 2.5 (写实电影)' },
  { id: 'gpt-image-2.5-sunburst', label: 'GPT Image 2.5 Sunburst' },
];

const VIDEO_GEN_MODELS = [
  { id: 'minimax-h3', label: 'MiniMax H3 (1080p·图/文生视频)' },
  { id: 'agnes-video-2.5', label: 'Agnes Video 2.5 (极速视频)' },
];

const EDGE_COLOR_PRESETS = [
  { label: '极简银灰', value: '#A1A1AA' },
  { label: '赛博青蓝', value: '#38BDF8' },
  { label: '琥珀流金', value: '#F59E0B' },
  { label: '霓虹紫罗兰', value: '#818CF8' },
  { label: '翡翠信号绿', value: '#34D399' },
  { label: '珊瑚绯红', value: '#F87171' },
];

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
 * for both the DOM Port circle and the SVG Bezier curve endpoint.
 */
const getPortOffsetY = (nodeType: NodeCategory): number => {
  switch (nodeType) {
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
 * Estimated bounding height of a node card in world pixels for accurate Marquee Box Selection intersection
 */
const getEstimatedNodeHeight = (node: CanvasNode): number => {
  if (node.height) return node.height;
  switch (node.type) {
    case 'storyboard':
    case 'video_clip':
      return (node.data.aspectRatio || '9:16') === '9:16' ? 355 : 255;
    case 'character':
      return 255;
    case 'scene_asset':
      return 240;
    case 'script':
      return 245;
    case 'storyboard_table':
      return 290;
    case 'audio_clip':
    case 'text_note':
    case 'idea':
      return 175;
    default:
      return 240;
  }
};

/**
 * Z-index Stacking Priority & Micro Curvature Offset by Attribute-Injection Type
 */
const RELATION_Z_PRIORITY: Record<EdgeRelationType, number> = {
  shot_sequence: 1,
  script_breakdown: 2,
  scene_ref: 3,
  character_ref: 4,
};

const RELATION_CURVE_OFFSET: Record<EdgeRelationType, number> = {
  character_ref: -16,
  scene_ref: 16,
  script_breakdown: -6,
  shot_sequence: 6,
};

/**
 * Unified Flowing Cubic Bezier Geometry Calculator
 */
function computeUnifiedFlowingBezier(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cp1OffsetY: number,
  cp2OffsetY: number
) {
  const spanX = endX - startX;
  const spanY = endY - startY;
  const dx = Math.max(82, Math.min(360, Math.abs(spanX) * 0.45));

  let bypassArcY = 0;
  if (Math.abs(spanX) > 480) {
    const midY = (startY + endY) * 0.5;
    bypassArcY = midY < 520 ? -56 : 56;
  } else if (spanX < -20) {
    bypassArcY = spanY >= 0 ? 130 : -130;
  }

  const cp1x = startX + dx;
  const cp1y = startY + cp1OffsetY + bypassArcY;
  const cp2x = endX - dx;
  const cp2y = endY + cp2OffsetY + bypassArcY;

  const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  const chordLength = Math.hypot(spanX, spanY);
  const dynamicPathLength = Math.max(
    120,
    Math.round(chordLength * 1.24 + Math.abs(cp1OffsetY) + Math.abs(bypassArcY) * 0.5)
  );

  return { pathD, dynamicPathLength };
}

// ============================================================================
// REACT.MEMO HIGH-PERFORMANCE UNIFIED BEZIER EDGE COMPONENT
// ============================================================================
interface MemoizedBezierEdgeProps {
  edgeId: string;
  relationType: EdgeRelationType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cp1OffsetY: number;
  cp2OffsetY: number;
  edgeColor: string;
  darkMode: boolean;
  defaultEdgeOpacity: number;
  isEdgeHovered: boolean;
  isInHoveredChain: boolean;
  isConnectedToSelected: boolean;
  isDimmedByHover: boolean;
  isActivelyDraggingEndpoint: boolean;
  onHoverEdge: (edgeId: string | null) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const BezierEdgeComponent: React.FC<MemoizedBezierEdgeProps> = ({
  edgeId,
  relationType,
  startX,
  startY,
  endX,
  endY,
  cp1OffsetY,
  cp2OffsetY,
  edgeColor,
  darkMode,
  defaultEdgeOpacity,
  isEdgeHovered,
  isInHoveredChain,
  isConnectedToSelected,
  isDimmedByHover,
  isActivelyDraggingEndpoint,
  onHoverEdge,
  onDeleteEdge,
}) => {
  const { pathD, dynamicPathLength } = useMemo(
    () =>
      computeUnifiedFlowingBezier(
        startX,
        startY,
        endX,
        endY,
        cp1OffsetY,
        cp2OffsetY
      ),
    [startX, startY, endX, endY, cp1OffsetY, cp2OffsetY]
  );

  const isElevated =
    isEdgeHovered || isInHoveredChain || isConnectedToSelected;
  const strokeW = isEdgeHovered || isInHoveredChain ? 2 : 1.15;
  const effectiveOpacity = isDimmedByHover
    ? 0.12
    : isEdgeHovered || isInHoveredChain
    ? 0.96
    : defaultEdgeOpacity;

  const durationSec =
    isEdgeHovered || isInHoveredChain
      ? '1.35s'
      : relationType === 'shot_sequence'
      ? '2.1s'
      : '2.4s';
  const halfOffsetSec =
    isEdgeHovered || isInHoveredChain
      ? '-0.67s'
      : relationType === 'shot_sequence'
      ? '-1.05s'
      : '-1.2s';

  return (
    <g className="pointer-events-auto" data-relation={relationType}>
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="14"
        className="cursor-pointer"
        onMouseEnter={() => onHoverEdge(edgeId)}
        onMouseLeave={() => onHoverEdge(null)}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteEdge(edgeId);
        }}
      >
        <title>点击断开此属性注入连线</title>
      </path>

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

      <path
        d={pathD}
        fill="none"
        stroke={edgeColor}
        strokeOpacity={isDimmedByHover ? 0.06 : 0.24}
        strokeWidth={strokeW}
        style={
          isActivelyDraggingEndpoint
            ? undefined
            : {
                transition: 'stroke-width 150ms ease, stroke-opacity 200ms ease',
              }
        }
      />

      <path
        d={pathD}
        fill="none"
        stroke={edgeColor}
        strokeOpacity={effectiveOpacity}
        strokeWidth={strokeW}
        style={
          {
            '--edge-path-length': `${dynamicPathLength}px`,
            ...(isActivelyDraggingEndpoint ? { transition: 'none' } : {}),
          } as React.CSSProperties
        }
        className={
          isEdgeHovered || isInHoveredChain
            ? 'edge-stream-line-fast'
            : 'edge-stream-line'
        }
        markerEnd="url(#arrow-custom)"
      />

      {/* Source Node Output Port Emitter Ring + Core Dot */}
      <g className="pointer-events-none">
        {!isDimmedByHover && (
          <circle
            cx={startX}
            cy={startY}
            r={isElevated ? 5.2 : 4.0}
            fill={edgeColor}
            fillOpacity={isElevated ? 0.22 : 0.12}
          />
        )}
        <circle
          cx={startX}
          cy={startY}
          r={isElevated ? 3.0 : 2.5}
          fill={edgeColor}
          fillOpacity={effectiveOpacity}
        />
      </g>

      {/* Smooth "Attribute-Injection" Endpoint Snap Ring Animation at Target Node Port */}
      <g className="pointer-events-none">
        {!isDimmedByHover && (
          <>
            <circle
              cx={endX}
              cy={endY}
              r={isElevated ? 8.5 : 6.2}
              fill={edgeColor}
              fillOpacity={isElevated ? 0.3 : 0.15}
              filter="url(#particle-glow)"
            />

            <circle
              cx={endX}
              cy={endY}
              r="11"
              fill="none"
              stroke={edgeColor}
              strokeWidth={isElevated ? '1.5' : '1.15'}
            >
              <animate
                attributeName="r"
                values={isElevated ? '13.5;3.6' : '11.5;3.4'}
                dur={isElevated ? '1.35s' : '2.1s'}
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values={isElevated ? '0.06;0.9;0.0' : '0.04;0.65;0.0'}
                dur={isElevated ? '1.35s' : '2.1s'}
                repeatCount="indefinite"
              />
            </circle>

            <circle
              cx={endX}
              cy={endY}
              r="4"
              fill="none"
              stroke={edgeColor}
              strokeWidth={isElevated ? '1.6' : '1.1'}
            >
              <animate
                attributeName="r"
                values={isElevated ? '3.5;11.5;3.5' : '3.4;9.2;3.4'}
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
          </>
        )}

        <circle
          cx={endX}
          cy={endY}
          r={isElevated ? 3.5 : 2.9}
          fill={edgeColor}
          fillOpacity={effectiveOpacity}
        />
      </g>

      {!isDimmedByHover && (
        <>
          <circle
            r={isEdgeHovered || isInHoveredChain ? 3.5 : 2.7}
            fill={edgeColor}
            fillOpacity={0.96}
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
            fillOpacity={0.78}
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
};

function areEdgePropsEqual(
  prev: MemoizedBezierEdgeProps,
  next: MemoizedBezierEdgeProps
): boolean {
  return (
    prev.edgeId === next.edgeId &&
    prev.relationType === next.relationType &&
    prev.startX === next.startX &&
    prev.startY === next.startY &&
    prev.endX === next.endX &&
    prev.endY === next.endY &&
    prev.cp1OffsetY === next.cp1OffsetY &&
    prev.cp2OffsetY === next.cp2OffsetY &&
    prev.edgeColor === next.edgeColor &&
    prev.darkMode === next.darkMode &&
    prev.defaultEdgeOpacity === next.defaultEdgeOpacity &&
    prev.isEdgeHovered === next.isEdgeHovered &&
    prev.isInHoveredChain === next.isInHoveredChain &&
    prev.isConnectedToSelected === next.isConnectedToSelected &&
    prev.isDimmedByHover === next.isDimmedByHover &&
    prev.isActivelyDraggingEndpoint === next.isActivelyDraggingEndpoint
  );
}

const MemoizedBezierEdge = React.memo(BezierEdgeComponent, areEdgePropsEqual);

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
  axisViolations = [],
  onUndo,
  onRedo,
  onSelectModel,
  onChangeEdgeColor,
  onToggleAgentPanel,
  onSelectNode,
  onNodeDragStart,
  onUpdateNodePosition,
  onUpdateMultipleNodesPositions,
  onNodeDragEnd,
  onUpdateNodeData,
  onSwitchNodeVideoModel,
  onAddNode,
  onAddConnectedNode,
  onDeleteNode,
  onDeleteMultipleNodes,
  onClearCanvas,
  onAddEdge,
  onDeleteEdge,
  onRenderStoryboardNode,
  onGenerateNodeImage,
  onGenerateNodeVideo,
  onDecomposeScriptNode,
  onOpenNodeInspector,
  onAutoLayout,
  onOrganizeNodes,
  onRunAxisInspection,
  onAutoFixAxisViolations,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 18, y: 14 });
  const [zoom, setZoom] = useState<number>(0.76);
  const [activeTool, setActiveTool] = useState<
    'select' | 'box_select' | 'connect'
  >('select');
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isOrganizeMenuOpen, setIsOrganizeMenuOpen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ==========================================================================
  // REQUIREMENT 2: MARQUEE BOX SELECTION & SYNCHRONIZED MULTI-NODE GROUP DRAG
  // ==========================================================================
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Refs for synchronized multi-node group dragging
  const isDraggingGroupRef = useRef<boolean>(false);
  const groupDragStartPositionsRef = useRef<
    Map<string, { x: number; y: number }>
  >(new Map());
  const groupDragMouseOriginRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // High-frequency 60FPS rAF Dragging Position Buffer (supports single node OR multi-node group)
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{ id: string; x: number; y: number } | null>(
    null
  );
  const pendingGroupUpdatesRef = useRef<
    { id: string; x: number; y: number }[] | null
  >(null);

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

  const [activeGenPopover, setActiveGenPopover] = useState<'style' | 'preset' | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    clientX: number;
    clientY: number;
    worldX: number;
    worldY: number;
    sourceNodeId?: string;
  } | null>(null);

  // Track pointer world coordinates & cascade offset for keyboard shortcuts (C / S / V / Delete)
  const lastPointerWorldPosRef = useRef<{ x: number; y: number }>({
    x: 260,
    y: 180,
  });
  const shortcutCascadeRef = useRef<number>(0);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopInertia();
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, [stopInertia]);

  // O(1) Node Lookup Map for 60FPS Edge Endpoint Recalculation
  const nodeMap = useMemo(() => {
    const map = new Map<string, CanvasNode>();
    for (let i = 0; i < nodes.length; i++) {
      map.set(nodes[i].id, nodes[i]);
    }
    return map;
  }, [nodes]);

  const selectedGroupSet = useMemo(
    () => new Set(selectedGroupIds),
    [selectedGroupIds]
  );

  // ==========================================================================
  // REQUIREMENT 1: KEYBOARD SHORTCUTS FOR HIGH-SPEED NODE OPERATIONS
  // - Delete / Backspace: Delete selected node or box-selected node group
  // - C: Create Character Anchor Node ('character') at selected/pointer position
  // - S: Create Script Node ('script') at selected/pointer position
  // - V: Create 9:16 Storyboard Shot Node ('storyboard') at selected/pointer position
  // - Escape: Clear active selection / menus
  // ==========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore if a modal overlay is currently open in the DOM
      if (document.querySelector('.fixed.inset-0.z-50')) {
        return;
      }

      // 1. Delete / Backspace -> Delete selected node(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedGroupIds.length > 1) {
          e.preventDefault();
          if (onDeleteMultipleNodes) {
            onDeleteMultipleNodes(selectedGroupIds);
          } else {
            selectedGroupIds.forEach((id) => onDeleteNode(id));
          }
          setSelectedGroupIds([]);
          return;
        }
        if (selectedNodeId) {
          e.preventDefault();
          onDeleteNode(selectedNodeId);
          setSelectedGroupIds([]);
          return;
        }
      }

      // 2. Escape -> Clear active wire, menus, or selection
      if (e.key === 'Escape') {
        setContextMenu(null);
        setIsColorMenuOpen(false);
        setIsOrganizeMenuOpen(false);
        setConnectingSourceId(null);
        setConnectStartWorldPos(null);
        setSelectedGroupIds([]);
        onSelectNode(null);
        return;
      }

      // Ignore modified keys (Ctrl+C, Cmd+S, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const getSpawnPosition = () => {
        const step = (shortcutCascadeRef.current % 5) * 28;
        shortcutCascadeRef.current += 1;

        if (selectedNodeId) {
          const selNode = nodeMap.get(selectedNodeId);
          if (selNode) {
            return {
              x:
                Math.round(
                  (selNode.position.x + (selNode.width || 300) + 56 + step) / 10
                ) * 10,
              y: Math.round((selNode.position.y + step) / 10) * 10,
            };
          }
        }
        return {
          x: Math.round((lastPointerWorldPosRef.current.x + step) / 10) * 10,
          y: Math.round((lastPointerWorldPosRef.current.y + step) / 10) * 10,
        };
      };

      const keyLower = e.key.toLowerCase();

      // Press 'C' -> Quick-create Character Anchor Node (角色锚点节点)
      if (keyLower === 'c') {
        e.preventDefault();
        const pos = getSpawnPosition();
        onAddNode('character', pos.x, pos.y);
        return;
      }

      // Press 'S' -> Quick-create Script Node (剧本节点)
      if (keyLower === 's') {
        e.preventDefault();
        const pos = getSpawnPosition();
        onAddNode('script', pos.x, pos.y);
        return;
      }

      // Press 'V' -> Quick-create 9:16 Storyboard Node (视频分镜节点)
      if (keyLower === 'v') {
        e.preventDefault();
        const pos = getSpawnPosition();
        onAddNode('storyboard', pos.x, pos.y);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeId,
    selectedGroupIds,
    nodeMap,
    onAddNode,
    onDeleteNode,
    onDeleteMultipleNodes,
    onSelectNode,
  ]);

  const handleHoverEdgeStable = useCallback((edgeId: string | null) => {
    setHoveredEdgeId(edgeId);
  }, []);

  const handleDeleteEdgeStable = useCallback(
    (edgeId: string) => {
      onDeleteEdge(edgeId);
    },
    [onDeleteEdge]
  );

  // Compute Upstream & Downstream Logic Chain when hovering over a node
  const hoveredLogicChain = useMemo(() => {
    if (!hoveredNodeId) return null;
    const relatedNodes = new Set<string>([hoveredNodeId]);
    const relatedEdges = new Set<string>();

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

  const getNodePortCoords = useCallback((node: CanvasNode, side: 'input' | 'output') => {
    const offsetY = getPortOffsetY(node.type);
    return {
      x: side === 'output' ? node.position.x + node.width : node.position.x,
      y: node.position.y + offsetY,
    };
  }, []);

  const nearSnapTargetNode = useMemo(() => {
    if (!connectingSourceId) return null;
    let closestNode: CanvasNode | null = null;
    let minDist = 76;

    for (const candidate of nodes) {
      if (candidate.type === 'group' || candidate.id === connectingSourceId) continue;
      const inputPort = getNodePortCoords(candidate, 'input');
      const dPort = Math.hypot(mouseCanvasPos.x - inputPort.x, mouseCanvasPos.y - inputPort.y);
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

  const sortedAndOffsetEdges = useMemo(() => {
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
        (selectedNodeId !== null &&
          (edge.sourceNodeId === selectedNodeId ||
            edge.targetNodeId === selectedNodeId)) ||
        selectedGroupSet.has(edge.sourceNodeId) ||
        selectedGroupSet.has(edge.targetNodeId);
      const isDimmedByHover = Boolean(hoveredLogicChain && !isInHoveredChain);

      let zRank = RELATION_Z_PRIORITY[edge.relationType] || 1;
      if (isDimmedByHover) zRank = 0;
      else if (isEdgeHovered) zRank = 20;
      else if (isInHoveredChain) zRank = 15;
      else if (isConnectedToSelected) zRank = 10;

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
  }, [edges, hoveredEdgeId, hoveredLogicChain, selectedNodeId, selectedGroupSet]);

  const groupNodes = useMemo(
    () => nodes.filter((n) => n.type === 'group'),
    [nodes]
  );
  const cardNodes = useMemo(
    () => nodes.filter((n) => n.type !== 'group'),
    [nodes]
  );

  // Bounding Box of the Multi-Selected Node Group (when selectedGroupIds.length > 1)
  const selectedGroupBounds = useMemo(() => {
    if (selectedGroupIds.length < 2) return null;
    const selectedObjs = cardNodes.filter((n) => selectedGroupSet.has(n.id));
    if (selectedObjs.length < 2) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedObjs.forEach((n) => {
      const h = getEstimatedNodeHeight(n);
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + n.width);
      maxY = Math.max(maxY, n.position.y + h);
    });

    return {
      x: minX - 18,
      y: minY - 34,
      width: maxX - minX + 36,
      height: maxY - minY + 52,
    };
  }, [selectedGroupIds, selectedGroupSet, cardNodes]);

  const handleContextMenuCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    stopInertia();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldPos = screenToCanvas(e.clientX, e.clientY);
    setContextMenu({
      clientX: Math.min(e.clientX - rect.left, rect.width - 260),
      clientY: Math.min(e.clientY - rect.top, rect.height - 390),
      worldX: Math.round(worldPos.x / 10) * 10,
      worldY: Math.round(worldPos.y / 10) * 10,
      sourceNodeId: connectingSourceId || undefined,
    });
  };

  const handleMouseDownCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2) return;
    setContextMenu(null);
    setIsColorMenuOpen(false);
    setIsOrganizeMenuOpen(false);

    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.canvasBg) {
      return;
    }
    stopInertia();
    setConnectingSourceId(null);
    setConnectStartWorldPos(null);

    // Requirement 2: Start Marquee Box Selection when activeTool === 'box_select' OR holding Shift key
    if (activeTool === 'box_select' || e.shiftKey) {
      const worldPos = screenToCanvas(e.clientX, e.clientY);
      onSelectNode(null);
      setMarqueeBox({
        startX: worldPos.x,
        startY: worldPos.y,
        currentX: worldPos.x,
        currentY: worldPos.y,
      });
      if (!e.shiftKey) {
        setSelectedGroupIds([]);
      }
      return;
    }

    onSelectNode(null);
    setSelectedGroupIds([]);
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    velocityRef.current = { vx: 0, vy: 0 };
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    // Record pointer world coordinates for keyboard shortcuts (C / S / V)
    const currentWorldPos = screenToCanvas(e.clientX, e.clientY);
    lastPointerWorldPosRef.current = currentWorldPos;

    // 1. Marquee Box Selection Live Intersection
    if (marqueeBox) {
      const worldPos = currentWorldPos;
      setMarqueeBox((prev) =>
        prev
          ? {
              ...prev,
              currentX: worldPos.x,
              currentY: worldPos.y,
            }
          : null
      );

      const minX = Math.min(marqueeBox.startX, worldPos.x);
      const maxX = Math.max(marqueeBox.startX, worldPos.x);
      const minY = Math.min(marqueeBox.startY, worldPos.y);
      const maxY = Math.max(marqueeBox.startY, worldPos.y);

      const hitIds: string[] = [];
      for (let i = 0; i < cardNodes.length; i++) {
        const n = cardNodes[i];
        const nh = getEstimatedNodeHeight(n);
        const intersects =
          n.position.x < maxX &&
          n.position.x + n.width > minX &&
          n.position.y < maxY &&
          n.position.y + nh > minY;
        if (intersects) {
          hitIds.push(n.id);
        }
      }
      setSelectedGroupIds(hitIds);
      return;
    }

    // 2. Canvas Inertial Panning
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

    // 3. Single Node OR Synchronized Multi-Node Group Dragging (60FPS rAF)
    if (draggingNodeId) {
      const worldPos = screenToCanvas(e.clientX, e.clientY);

      if (
        isDraggingGroupRef.current &&
        groupDragStartPositionsRef.current.size > 1
      ) {
        const deltaX =
          Math.round((worldPos.x - groupDragMouseOriginRef.current.x) / 5) * 5;
        const deltaY =
          Math.round((worldPos.y - groupDragMouseOriginRef.current.y) / 5) * 5;

        const batchUpdates: { id: string; x: number; y: number }[] = [];
        groupDragStartPositionsRef.current.forEach((initPos, nodeId) => {
          batchUpdates.push({
            id: nodeId,
            x: initPos.x + deltaX,
            y: initPos.y + deltaY,
          });
        });

        pendingGroupUpdatesRef.current = batchUpdates;
        if (dragRafRef.current === null) {
          dragRafRef.current = requestAnimationFrame(() => {
            dragRafRef.current = null;
            const updates = pendingGroupUpdatesRef.current;
            if (updates && updates.length > 0) {
              if (onUpdateMultipleNodesPositions) {
                onUpdateMultipleNodesPositions(updates);
              } else {
                updates.forEach((u) => onUpdateNodePosition(u.id, u.x, u.y));
              }
            }
          });
        }
        return;
      }

      const nextX = Math.round((worldPos.x - nodeDragOffset.x) / 5) * 5;
      const nextY = Math.round((worldPos.y - nodeDragOffset.y) / 5) * 5;

      pendingDragPosRef.current = { id: draggingNodeId, x: nextX, y: nextY };
      if (dragRafRef.current === null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          if (pendingDragPosRef.current) {
            onUpdateNodePosition(
              pendingDragPosRef.current.id,
              pendingDragPosRef.current.x,
              pendingDragPosRef.current.y
            );
          }
        });
      }
      return;
    }

    if (connectingSourceId) {
      const worldPos = screenToCanvas(e.clientX, e.clientY);
      setMouseCanvasPos(worldPos);
    }
  };

  const handleMouseUpCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (marqueeBox) {
      setMarqueeBox(null);
      if (selectedGroupIds.length === 1) {
        onSelectNode(selectedGroupIds[0]);
      } else if (selectedGroupIds.length > 1) {
        onSelectNode(null);
      }
      return;
    }

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
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (isDraggingGroupRef.current && pendingGroupUpdatesRef.current) {
        if (onUpdateMultipleNodesPositions) {
          onUpdateMultipleNodesPositions(pendingGroupUpdatesRef.current);
        } else {
          pendingGroupUpdatesRef.current.forEach((u) =>
            onUpdateNodePosition(u.id, u.x, u.y)
          );
        }
        pendingGroupUpdatesRef.current = null;
        onNodeDragEnd(draggingNodeId, selectedGroupIds);
      } else {
        if (pendingDragPosRef.current) {
          onUpdateNodePosition(
            pendingDragPosRef.current.id,
            pendingDragPosRef.current.x,
            pendingDragPosRef.current.y
          );
          pendingDragPosRef.current = null;
        }
        onNodeDragEnd(draggingNodeId);
      }
      isDraggingGroupRef.current = false;
      groupDragStartPositionsRef.current.clear();
      setDraggingNodeId(null);
    }

    if (connectingSourceId && nearSnapTargetNode) {
      completePortConnection(e, nearSnapTargetNode.id);
      return;
    }

    if (connectingSourceId && containerRef.current) {
      const worldPos = screenToCanvas(e.clientX, e.clientY);
      const dragDist = connectStartWorldPos
        ? Math.hypot(worldPos.x - connectStartWorldPos.x, worldPos.y - connectStartWorldPos.y)
        : 999;

      if (dragDist > 24) {
        const rect = containerRef.current.getBoundingClientRect();
        setContextMenu({
          clientX: Math.min(e.clientX - rect.left, rect.width - 260),
          clientY: Math.min(e.clientY - rect.top, rect.height - 390),
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
    setIsOrganizeMenuOpen(false);

    if (activeTool === 'connect') {
      const portPos = getNodePortCoords(node, 'output');
      setConnectingSourceId(node.id);
      setConnectStartWorldPos(portPos);
      setMouseCanvasPos(portPos);
      return;
    }

    const worldPos = screenToCanvas(e.clientX, e.clientY);

    // Shift + Click toggles node membership in multi-selection group
    if (e.shiftKey && node.type !== 'group') {
      setSelectedGroupIds((prev) => {
        const base =
          prev.length === 0 && selectedNodeId ? [selectedNodeId] : prev;
        const exists = base.includes(node.id);
        const next = exists
          ? base.filter((id) => id !== node.id)
          : [...base, node.id];
        if (next.length > 1) {
          onSelectNode(null);
        } else if (next.length === 1) {
          onSelectNode(next[0]);
        }
        return next;
      });
      return;
    }

    // Requirement 2: If clicking a node that belongs to the currently box-selected group (selectedGroupIds.length > 1),
    // initiate Synchronized Group Drag for all selected nodes simultaneously!
    if (selectedGroupSet.has(node.id) && selectedGroupIds.length > 1) {
      onNodeDragStart(node.id);
      isDraggingGroupRef.current = true;
      groupDragMouseOriginRef.current = { x: worldPos.x, y: worldPos.y };

      const initMap = new Map<string, { x: number; y: number }>();
      selectedGroupIds.forEach((gid) => {
        const found = nodeMap.get(gid);
        if (found) {
          initMap.set(gid, { x: found.position.x, y: found.position.y });
        }
      });
      groupDragStartPositionsRef.current = initMap;
      setDraggingNodeId(node.id);
      return;
    }

    // Standard single-node selection & drag
    setSelectedGroupIds([node.id]);
    onSelectNode(node.id);
    isDraggingGroupRef.current = false;
    onNodeDragStart(node.id);
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
    const sourceNode = nodeMap.get(connectingSourceId);
    let relationType: EdgeRelationType = 'script_breakdown';
    if (sourceNode?.type === 'character') relationType = 'character_ref';
    else if (sourceNode?.type === 'scene_asset') relationType = 'scene_ref';
    else if (sourceNode?.type === 'storyboard' || sourceNode?.type === 'video_clip') {
      relationType = 'shot_sequence';
    }

    onAddEdge(connectingSourceId, targetId, relationType);
    setConnectingSourceId(null);
    setConnectStartWorldPos(null);
  };

  const resetViewport = () => {
    stopInertia();
    setPan({ x: 18, y: 14 });
    setZoom(0.76);
  };

  const upstreamCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (let i = 0; i < edges.length; i++) {
      const tid = edges[i].targetNodeId;
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
    return counts;
  }, [edges]);

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
        return '分类分组';
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

  const triggerOrganize = (mode: NodeOrganizeMode) => {
    if (onOrganizeNodes) {
      onOrganizeNodes(mode);
    } else {
      onAutoLayout();
    }
    setIsOrganizeMenuOpen(false);
    setContextMenu(null);
  };

  const toolbarTooltipClass = `pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border z-40 ${
    darkMode
      ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
      : 'bg-slate-900 border-slate-800 text-white'
  }`;

  const defaultEdgeOpacity = darkMode ? 0.62 : 0.74;

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
      className={`relative flex-1 h-full overflow-hidden select-none transition-colors ${
        activeTool === 'box_select'
          ? 'cursor-crosshair'
          : 'cursor-grab active:cursor-grabbing'
      } ${darkMode ? 'canvas-grid-dark text-zinc-100' : 'canvas-grid-light text-slate-900'}`}
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
            无限画布
          </span>
          <span aria-hidden="true" className={darkMode ? 'text-zinc-500' : 'text-slate-400'}>
            ·
          </span>
          <span className="font-mono tabular-nums">
            {cardNodes.length} 节点 / {edges.length} 连线
          </span>
          <span aria-hidden="true" className={darkMode ? 'text-zinc-600' : 'text-slate-300'}>
            |
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]">
            <span>快捷键:</span>
            <kbd
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-amber-300'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              C
            </kbd>
            <span>角色锚点</span>
            <kbd
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-sky-300'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              S
            </kbd>
            <span>剧本节点</span>
            <kbd
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                darkMode
                  ? 'bg-zinc-950 border-zinc-700 text-rose-300'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              Delete
            </kbd>
            <span>删除选中</span>
          </span>
          {selectedGroupIds.length > 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-mono font-semibold">
                已框选 {selectedGroupIds.length} 个节点 (拖拽任一节点可整组同步移动)
              </span>
            </>
          )}
          {connectingSourceId && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-medium">
                拖至目标节点 ⊕ 吸附连接，或在空白处松手弹出新建节点菜单...
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

      {/* Right-Click OR Edge-Drop Node Creation & Auto-Classification Menu */}
      {contextMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
          className={`absolute z-50 w-68 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md text-xs ${
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
                    nodeMap
                      .get(contextMenu.sourceNodeId)
                      ?.data.title.split('·')[0] || '上一节点'
                  }」`
                : '在当前光标位置新建或分类整理节点'}
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
            onClick={() => triggerOrganize('category_groups')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
              darkMode
                ? 'hover:bg-zinc-800 text-amber-300'
                : 'hover:bg-amber-50 text-amber-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5 shrink-0" />
              <span>整理节点：自动分类并生成分区框</span>
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                darkMode
                  ? 'bg-amber-950/80 text-amber-300'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              4大分类
            </span>
          </button>

          <button
            type="button"
            onClick={() => triggerOrganize('type_columns')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors cursor-pointer ${
              darkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span>整理节点：按节点类型垂直分列归类</span>
          </button>

          <button
            type="button"
            onClick={() => triggerOrganize('pipeline_compact')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left transition-colors cursor-pointer ${
              darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>紧凑三栏拓扑对齐全部节点</span>
          </button>

          <button
            type="button"
            disabled={nodes.length === 0}
            onClick={() => {
              onClearCanvas();
              setContextMenu(null);
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-colors cursor-pointer disabled:opacity-35 ${
              darkMode
                ? 'hover:bg-red-950/60 text-red-400'
                : 'hover:bg-red-50 text-red-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>清空当前画布全部节点</span>
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                darkMode
                  ? 'bg-red-950/80 text-red-300'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {nodes.length} 节点
            </span>
          </button>
        </div>
      )}

      {/* Transformed Infinite World Layer */}
      <div
        data-canvas-bg="true"
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          width: 3600,
          height: 2600,
        }}
      >
        {/* 1. Freeform & Auto-Classified Category Group Containers */}
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
                    ? 'bg-zinc-900/65 border-zinc-400'
                    : 'bg-zinc-900/35 border-zinc-800'
                  : isSelected
                  ? 'bg-slate-100/80 border-slate-400'
                  : 'bg-slate-100/50 border-slate-300/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`text-xs font-semibold tracking-tight flex items-center gap-2 ${
                      darkMode ? 'text-zinc-100' : 'text-slate-800'
                    }`}
                  >
                    {group.data.groupColor && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.data.groupColor }}
                      />
                    )}
                    <span>{group.data.title}</span>
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
                  title="移除分类分组框"
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

        {/* 1B. Multi-Selected Node Group Bounding Box & Floating Group Action Bar */}
        {selectedGroupBounds && selectedGroupIds.length > 1 && (
          <div
            style={{
              left: selectedGroupBounds.x,
              top: selectedGroupBounds.y,
              width: selectedGroupBounds.width,
              height: selectedGroupBounds.height,
            }}
            className="absolute rounded-2xl border-2 border-dashed border-amber-400/80 bg-amber-500/[0.04] pointer-events-none z-15"
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="pointer-events-auto absolute -top-9 left-0 flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/95 border border-amber-400/70 text-amber-300 text-[11px] font-mono shadow-xl"
            >
              <Scan className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">
                已框选 {selectedGroupIds.length} 个节点 · 拖拽组内任一节点可整组同步平移
              </span>
              {onDeleteMultipleNodes && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMultipleNodes(selectedGroupIds);
                    setSelectedGroupIds([]);
                  }}
                  className="ml-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-300 text-[10px] cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>批量删除</span>
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGroupIds([]);
                }}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-[10px] cursor-pointer"
              >
                取消框选
              </button>
            </div>
          </div>
        )}

        {/* 2. SVG Unified Flowing Cubic Bezier Edges Layer (Strictly z-[5] < z-20 cards; cached with React.memo for 60FPS) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-[5]"
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
              const sourceNode = nodeMap.get(edge.sourceNodeId);
              const targetNode = nodeMap.get(edge.targetNodeId);
              if (!sourceNode || !targetNode) return null;

              const startX = sourceNode.position.x + sourceNode.width;
              const startY = sourceNode.position.y + getPortOffsetY(sourceNode.type);
              const endX = targetNode.position.x;
              const endY = targetNode.position.y + getPortOffsetY(targetNode.type);

              const isActivelyDraggingEndpoint =
                draggingNodeId !== null &&
                (edge.sourceNodeId === draggingNodeId ||
                  edge.targetNodeId === draggingNodeId ||
                  (selectedGroupIds.length > 1 &&
                    (selectedGroupSet.has(edge.sourceNodeId) ||
                      selectedGroupSet.has(edge.targetNodeId))));

              return (
                <MemoizedBezierEdge
                  key={edge.id}
                  edgeId={edge.id}
                  relationType={edge.relationType}
                  startX={startX}
                  startY={startY}
                  endX={endX}
                  endY={endY}
                  cp1OffsetY={cp1OffsetY}
                  cp2OffsetY={cp2OffsetY}
                  edgeColor={edgeColor}
                  darkMode={darkMode}
                  defaultEdgeOpacity={defaultEdgeOpacity}
                  isEdgeHovered={isEdgeHovered}
                  isInHoveredChain={isInHoveredChain}
                  isConnectedToSelected={isConnectedToSelected}
                  isDimmedByHover={isDimmedByHover}
                  isActivelyDraggingEndpoint={isActivelyDraggingEndpoint}
                  onHoverEdge={handleHoverEdgeStable}
                  onDeleteEdge={handleDeleteEdgeStable}
                />
              );
            }
          )}
        </svg>

        {/* 2B. Top Interactive Wire & 180-Degree Axis Violation Warning Overlay SVG (z-40, pointer-events-none) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          {axisViolations.map((v) => {
            const shotA = nodeMap.get(v.sourceShotId);
            const shotB = nodeMap.get(v.targetShotId);
            if (!shotA || !shotB) return null;
            const ptA = getNodePortCoords(shotA, 'output');
            const ptB = getNodePortCoords(shotB, 'input');
            const midX = (ptA.x + ptB.x) / 2;
            const midY = (ptA.y + ptB.y) / 2 - 22;
            const dWarn = `M ${ptA.x} ${ptA.y} Q ${midX} ${midY - 36}, ${ptB.x} ${ptB.y}`;
            return (
              <g key={v.id} className="pointer-events-none">
                <path
                  d={dWarn}
                  fill="none"
                  stroke="#EF4444"
                  strokeOpacity={0.75}
                  strokeWidth="1.8"
                  strokeDasharray="6 5"
                />
                <circle cx={ptA.x} cy={ptA.y} r="4.5" fill="#EF4444" fillOpacity={0.9} />
                <circle cx={ptB.x} cy={ptB.y} r="4.5" fill="#EF4444" fillOpacity={0.9} />
                <g transform={`translate(${midX}, ${midY - 18})`}>
                  <rect
                    x="-76"
                    y="-12"
                    width="152"
                    height="22"
                    rx="6"
                    fill="#450A0A"
                    stroke="#EF4444"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#FECACA"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ⚠ 180°跳轴断连: {v.sourceShotNumber}→{v.targetShotNumber}
                  </text>
                </g>
              </g>
            );
          })}

          {activeWireSourceId &&
            (() => {
              const sourceNode = nodeMap.get(activeWireSourceId);
              if (!sourceNode) return null;
              const start = getNodePortCoords(sourceNode, 'output');
              const snappedPort = nearSnapTargetNode
                ? getNodePortCoords(nearSnapTargetNode, 'input')
                : null;
              const targetPt = contextMenu?.sourceNodeId
                ? { x: contextMenu.worldX, y: contextMenu.worldY }
                : snappedPort || mouseCanvasPos;

              const { pathD: d, dynamicPathLength: previewLen } =
                computeUnifiedFlowingBezier(
                  start.x,
                  start.y,
                  targetPt.x,
                  targetPt.y,
                  0,
                  0
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
                  <g>
                    <circle
                      cx={targetPt.x}
                      cy={targetPt.y}
                      r={snappedPort ? 13 : 6}
                      fill={snappedPort ? '#34D399' : edgeColor}
                      fillOpacity={snappedPort ? 0.34 : 0.18}
                      filter="url(#particle-glow)"
                    />
                    {snappedPort && (
                      <circle
                        cx={targetPt.x}
                        cy={targetPt.y}
                        r="16"
                        fill="none"
                        stroke="#34D399"
                        strokeWidth="1.8"
                      >
                        <animate
                          attributeName="r"
                          values="16;4.2"
                          dur="0.85s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          values="0.15;0.95;0"
                          dur="0.85s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <circle
                      cx={targetPt.x}
                      cy={targetPt.y}
                      r={snappedPort ? 4.8 : 3.2}
                      fill={snappedPort ? '#34D399' : edgeColor}
                    />
                  </g>
                </g>
              );
            })()}
        </svg>

        {/* 2C. Live Marquee Selection Rectangle Overlay */}
        {marqueeBox && (
          <div
            style={{
              left: Math.min(marqueeBox.startX, marqueeBox.currentX),
              top: Math.min(marqueeBox.startY, marqueeBox.currentY),
              width: Math.abs(marqueeBox.currentX - marqueeBox.startX),
              height: Math.abs(marqueeBox.currentY - marqueeBox.startY),
            }}
            className="absolute z-50 pointer-events-none rounded-xl border-2 border-amber-400 bg-amber-400/15 shadow-lg"
          >
            <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-zinc-900/95 border border-amber-400/60 text-amber-300 text-[10px] font-mono whitespace-nowrap">
              区域框选中：{selectedGroupIds.length} 个节点
            </div>
          </div>
        )}

        {/* 3. Foreground Cards */}
        {cardNodes.map((node) => {
          const isSingleSelected = selectedNodeId === node.id;
          const isInSelectedGroup =
            selectedGroupIds.length > 1 && selectedGroupSet.has(node.id);
          const isSelected = isSingleSelected || isInSelectedGroup;

          const upstreamAnchorCount = upstreamCountMap.get(node.id) || 0;
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
          const isDimmed = hoveredLogicChain && !isRelatedToHovered && !isSelected;
          const isHighlightedChainMember =
            hoveredLogicChain &&
            isRelatedToHovered &&
            hoveredNodeId !== node.id;

          const hasAxisViolation = axisViolations.some(
            (v) => v.sourceShotId === node.id || v.targetShotId === node.id
          );

          const portOffsetY = getPortOffsetY(node.type);

          const isBeingDragged =
            draggingNodeId === node.id ||
            (draggingNodeId !== null && isInSelectedGroup);

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
              className={`absolute rounded-2xl border ${
                isBeingDragged ? '' : 'transition-opacity duration-150'
              } ${
                isSingleSelected
                  ? 'z-50'
                  : isInSelectedGroup
                  ? 'z-40'
                  : isRelatedToHovered && hoveredNodeId
                  ? 'z-30'
                  : 'z-20'
              } ${isDimmed ? 'opacity-25' : 'opacity-100'} ${
                darkMode
                  ? isInSelectedGroup
                    ? 'bg-zinc-900 border-amber-400 shadow-2xl ring-2 ring-amber-400/90'
                    : isSingleSelected
                    ? 'bg-zinc-900 border-zinc-100 shadow-2xl ring-1 ring-zinc-100'
                    : hasAxisViolation
                    ? 'bg-zinc-900 border-red-500/80 shadow-xl ring-1 ring-red-500/40'
                    : isHighlightedChainMember
                    ? 'bg-zinc-900 border-zinc-400 shadow-xl ring-1 ring-zinc-500/60'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 shadow-lg'
                  : isInSelectedGroup
                  ? 'bg-white border-amber-500 shadow-2xl ring-2 ring-amber-500'
                  : isSingleSelected
                  ? 'bg-white border-slate-900 shadow-2xl ring-1 ring-slate-900'
                  : hasAxisViolation
                  ? 'bg-white border-red-500 shadow-lg ring-1 ring-red-400'
                  : isHighlightedChainMember
                  ? 'bg-white border-slate-500 shadow-lg ring-1 ring-slate-400'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Outside Top-Left Label */}
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

              {/* Group Selection Badge on Top-Right when part of Multi-Selection */}
              {isInSelectedGroup && (
                <div className="absolute -top-6 right-1 px-2 py-0.5 rounded bg-amber-400 text-zinc-950 text-[10px] font-mono font-bold shadow">
                  已框选 · 组内联动
                </div>
              )}

              {/* Left Input Port (+) Circle */}
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

              {/* Right Output Port (+) Circle */}
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

                {isMediaNode && (
                  <CinematicArtRenderer
                    nodeType={
                      node.type === 'video_clip'
                        ? 'storyboard'
                        : (node.type as 'character' | 'scene_asset' | 'storyboard')
                    }
                    data={node.data}
                    upstreamAnchorCount={upstreamAnchorCount}
                  />
                )}

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

                {(node.type === 'text_note' || node.type === 'idea') && (
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
                        node.data.logline ||
                        '在此记录原著文案、导演批注或分镜修改意见...'}
                    </p>
                  </div>
                )}

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
                          isSingleSelected ? 'text-emerald-400 font-semibold' : ''
                        }`}
                      >
                        {isSingleSelected ? '生成框已展开 ▾' : '单击生成 · 双击看图'}
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

              {/* OPEN-AI-CANVAS FLOATING GENERATION COMPOSER BOX (Only shown when a single node is selected) */}
              {isSingleSelected &&
                selectedGroupIds.length <= 1 &&
                node.type !== 'storyboard_table' && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-3.5 w-[520px] z-50 p-4 rounded-2xl border shadow-2xl space-y-3 transition-all ${
                      darkMode
                        ? 'bg-[#141418]/98 border-zinc-700 text-zinc-100'
                        : 'bg-white/98 border-slate-200/90 text-slate-900'
                    }`}
                  >
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

                      <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveGenPopover((prev) =>
                              prev === 'style' ? null : 'style'
                            )
                          }
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                            activeGenPopover === 'style' || node.data.stylePresetName
                              ? darkMode
                                ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                              : darkMode
                              ? 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800'
                              : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                          title="展开短剧画风与电影光影风格选择器"
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>
                            {node.data.stylePresetName
                              ? node.data.stylePresetName.split(' ')[0]
                              : '风格'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setActiveGenPopover((prev) =>
                              prev === 'preset' ? null : 'preset'
                            )
                          }
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                            activeGenPopover === 'preset' || node.data.directorPresetName
                              ? darkMode
                                ? 'bg-sky-950/70 border-sky-700 text-sky-300'
                                : 'bg-sky-50 border-sky-300 text-sky-800'
                              : darkMode
                              ? 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800'
                              : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                          }`}
                          title="展开漫剧老李 180°轴线/FACS/景别运镜导演预设库"
                        >
                          <Grid className="w-3.5 h-3.5" />
                          <span>
                            {node.data.directorPresetName
                              ? node.data.directorPresetName.split('·')[0]
                              : '预设'}
                          </span>
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
                          onClick={() => {
                            setActiveGenPopover(null);
                            onSelectNode(null);
                          }}
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

                    {activeGenPopover === 'style' && (
                      <div
                        className={`p-3 rounded-xl border space-y-2 max-h-60 overflow-y-auto ${
                          darkMode
                            ? 'bg-zinc-950 border-zinc-800'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold">
                            选择短剧视觉风格 (自动注入光影、材质与负向约束)
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveGenPopover(null)}
                            className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          >
                            收起 ▴
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {DRAMA_STYLE_PRESETS.map((st: DramaStylePreset) => {
                            const isCurrent = node.data.stylePresetId === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  const cleanBase = currentPromptText
                                    .replace(/\s*\|\s*Style:\s*\[[^\]]*\]/gi, '')
                                    .replace(/\s*\|\s*Lighting:\s*\[[^\]]*\]/gi, '')
                                    .replace(/\s*\|\s*Avoid:\s*\[[^\]]*\]/gi, '')
                                    .trim();
                                  const nextPrompt = `${
                                    cleanBase ? `${cleanBase} | ` : ''
                                  }Style: [${st.stylePrompt}] | Lighting: [${
                                    st.lightingPrompt
                                  }] | Avoid: [${st.negativeAvoid}]`;

                                  onUpdateNodeData(
                                    node.id,
                                    {
                                      ...node.data,
                                      stylePresetId: st.id,
                                      stylePresetName: st.name,
                                      lightingMood: st.lightingPrompt,
                                      colorPalette: st.colorSwatches,
                                      ...(node.type === 'character' ||
                                      node.type === 'scene_asset'
                                        ? { consistencyPrompt: nextPrompt }
                                        : {
                                            visualPrompt: nextPrompt,
                                            videoPrompts: {
                                              ...(node.data.videoPrompts || {}),
                                              [activeVideoModel]: nextPrompt,
                                            },
                                          }),
                                    },
                                    `应用视觉风格「${st.name}」`
                                  );
                                  setActiveGenPopover(null);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isCurrent
                                    ? darkMode
                                      ? 'bg-zinc-800 border-amber-400 text-zinc-100'
                                      : 'bg-white border-slate-900 text-slate-900 shadow-xs'
                                    : darkMode
                                    ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 text-zinc-200'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[11px] font-bold truncate">
                                    {st.name}
                                  </span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {st.colorSwatches.map((hex, i) => (
                                      <span
                                        key={i}
                                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                                        style={{ backgroundColor: hex }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p
                                  className={`text-[10px] line-clamp-2 leading-snug ${
                                    darkMode ? 'text-zinc-400' : 'text-slate-500'
                                  }`}
                                >
                                  {st.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeGenPopover === 'preset' && (
                      <div
                        className={`p-3 rounded-xl border space-y-2.5 max-h-64 overflow-y-auto ${
                          darkMode
                            ? 'bg-zinc-950 border-zinc-800'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold">
                            导演公式与镜头运镜预设库 (点击即刻应用)
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveGenPopover(null)}
                            className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          >
                            收起 ▴
                          </button>
                        </div>

                        {(node.type === 'storyboard' || node.type === 'video_clip') && (
                          <div className="space-y-1.5 pb-2 border-b border-zinc-800/80">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-mono text-zinc-400 mr-1">
                                景别：
                              </span>
                              {[
                                '极特写 (ECU)',
                                '大特写 (CU)',
                                '中近景 (MCU)',
                                '越肩镜头 (OTS)',
                                '全身全景 (WS)',
                              ].map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() =>
                                    onUpdateNodeData(
                                      node.id,
                                      { ...node.data, shotSize: sz },
                                      `切换景别为 ${sz}`
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                                    node.data.shotSize === sz
                                      ? 'bg-amber-400 text-zinc-950 border-amber-400 font-semibold'
                                      : darkMode
                                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-mono text-zinc-400 mr-1">
                                运镜：
                              </span>
                              {[
                                '[Push in]',
                                '[Pull out]',
                                '[Orbit 180]',
                                '[Pan right]',
                                '[Tracking shot]',
                                '[Whip pan]',
                              ].map((mv) => (
                                <button
                                  key={mv}
                                  type="button"
                                  onClick={() =>
                                    onUpdateNodeData(
                                      node.id,
                                      { ...node.data, cameraMove: mv },
                                      `切换运镜为 ${mv}`
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
                                    node.data.cameraMove === mv
                                      ? 'bg-sky-400 text-zinc-950 border-sky-400 font-semibold'
                                      : darkMode
                                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {mv}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {DIRECTOR_FORMULA_PRESETS.map((pr: DirectorFormulaPreset) => (
                            <button
                              key={pr.id}
                              type="button"
                              onClick={() => {
                                const nextText = currentPromptText.trim()
                                  ? `${currentPromptText.trim()} | ${pr.formulaBlock}`
                                  : pr.formulaBlock;

                                onUpdateNodeData(
                                  node.id,
                                  {
                                    ...node.data,
                                    directorPresetName: pr.name,
                                    ...(pr.shotSize ? { shotSize: pr.shotSize } : {}),
                                    ...(pr.cameraMove
                                      ? { cameraMove: pr.cameraMove }
                                      : {}),
                                    ...(pr.focalLength
                                      ? { focalLength: pr.focalLength }
                                      : {}),
                                    ...(pr.aspectRatio
                                      ? { aspectRatio: pr.aspectRatio }
                                      : {}),
                                    ...(node.type === 'character' ||
                                    node.type === 'scene_asset'
                                      ? { consistencyPrompt: nextText }
                                      : node.type === 'script'
                                      ? { scriptBody: nextText }
                                      : {
                                          visualPrompt: nextText,
                                          videoPrompts: {
                                            ...(node.data.videoPrompts || {}),
                                            [activeVideoModel]: nextText,
                                          },
                                        }),
                                  },
                                  `应用导演预设「${pr.name}」`
                                );
                                setActiveGenPopover(null);
                              }}
                              className={`w-full p-2 rounded-xl border text-left transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                                darkMode
                                  ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 text-zinc-200'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold flex items-center gap-1.5">
                                  <span>{pr.name}</span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                    {pr.badge}
                                  </span>
                                </div>
                                <p
                                  className={`text-[10px] mt-0.5 line-clamp-1 ${
                                    darkMode ? 'text-zinc-400' : 'text-slate-500'
                                  }`}
                                >
                                  {pr.description}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <textarea
                        rows={3}
                        value={currentPromptText}
                        onChange={(e) => handleUpdatePromptInGenBox(node, e.target.value)}
                        placeholder="输入或点击下方「合成提示词」，随后可一键「生成图片」或「生成视频」..."
                        className={`w-full p-2.5 rounded-xl border font-mono text-[11px] leading-relaxed resize-none focus:outline-none ${
                          darkMode
                            ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-slate-900'
                        }`}
                      />
                    </div>

                    {isMediaNode && (
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[10px] font-mono shrink-0 ${
                              darkMode ? 'text-zinc-400' : 'text-slate-500'
                            }`}
                          >
                            绘图引擎:
                          </span>
                          <select
                            value={node.data.imageModelId || 'nano-banana-fast'}
                            onChange={(e) =>
                              onUpdateNodeData(node.id, {
                                ...node.data,
                                imageModelId: e.target.value,
                              })
                            }
                            className={`px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer focus:outline-none ${
                              darkMode
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                : 'bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                          >
                            {IMAGE_GEN_MODELS.map((im) => (
                              <option
                                key={im.id}
                                value={im.id}
                                className={
                                  darkMode
                                    ? 'bg-zinc-900 text-zinc-100'
                                    : 'bg-white text-slate-900'
                                }
                              >
                                {im.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(node.type === 'storyboard' || node.type === 'video_clip') && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[10px] font-mono shrink-0 ${
                                darkMode ? 'text-zinc-400' : 'text-slate-500'
                              }`}
                            >
                              视频引擎:
                            </span>
                            <select
                              value={node.data.videoGenModelId || 'minimax-h3'}
                              onChange={(e) =>
                                onUpdateNodeData(node.id, {
                                  ...node.data,
                                  videoGenModelId: e.target.value,
                                })
                              }
                              className={`px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer focus:outline-none ${
                                darkMode
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                  : 'bg-slate-100 border-slate-200 text-slate-800'
                              }`}
                            >
                              {VIDEO_GEN_MODELS.map((vm) => (
                                <option
                                  key={vm.id}
                                  value={vm.id}
                                  className={
                                    darkMode
                                      ? 'bg-zinc-900 text-zinc-100'
                                      : 'bg-white text-slate-900'
                                  }
                                >
                                  {vm.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <select
                          value={selectedModelId}
                          onChange={(e) => onSelectModel(e.target.value)}
                          className={`max-w-[140px] px-2 py-1.5 rounded-xl border text-[10px] font-medium truncate cursor-pointer focus:outline-none ${
                            darkMode
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                              : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300'
                          }`}
                          title="用于合成提示词的文本推理模型"
                        >
                          {models
                            .filter((m) => !m.modality || m.modality === 'text')
                            .map((m) => (
                              <option
                                key={m.id}
                                value={m.id}
                                className={
                                  darkMode
                                    ? 'bg-zinc-900 text-zinc-100'
                                    : 'bg-white text-slate-900'
                                }
                              >
                                {m.displayName}
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          onClick={(e) => handleCopyPrompt(e, node.id, currentPromptText)}
                          className={`p-1.5 rounded-xl border text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                            darkMode
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                          }`}
                          title="复制当前提示词"
                        >
                          {copiedNodeId === node.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {isMediaNode && (
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
                            className={`px-2 py-1 rounded-xl border text-[10px] font-mono cursor-pointer transition-colors ${
                              darkMode
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                            title="点击切换 9:16 竖屏 / 16:9 横屏画幅"
                          >
                            {node.data.aspectRatio || '9:16'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(node.type === 'audio_clip' ||
                          Boolean(node.data.dialogueSnippet)) && (
                          <button
                            type="button"
                            onClick={() => {
                              const speechText =
                                node.data.audioTranscript ||
                                node.data.dialogueSnippet ||
                                node.data.title;
                              if ('speechSynthesis' in window && speechText) {
                                window.speechSynthesis.cancel();
                                const utter = new SpeechSynthesisUtterance(
                                  speechText
                                );
                                utter.lang = 'zh-CN';
                                utter.rate = 1.05;
                                window.speechSynthesis.speak(utter);
                              }
                            }}
                            className={`px-2 py-1.5 rounded-xl border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                              darkMode
                                ? 'bg-zinc-900 border-zinc-800 text-amber-300 hover:bg-zinc-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                            }`}
                            title="使用浏览器 TTS 语音引擎试听台词对白"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>试听配音</span>
                          </button>
                        )}

                        {node.type === 'script' && onDecomposeScriptNode && (
                          <button
                            type="button"
                            onClick={() => onDecomposeScriptNode(node.id)}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                              darkMode
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                            }`}
                            title="将本场剧本一键拆解为下游自动连线的 9:16 视频分镜节点序列"
                          >
                            <Film className="w-3 h-3" />
                            <span>拆解为分镜序列</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={node.data.isRendering}
                          onClick={() => onRenderStoryboardNode(node.id)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 ${
                            darkMode
                              ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white'
                              : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                          }`}
                          title="调用大模型融合上游锚点与当前画风，合成结构化提示词"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{node.data.isRendering ? '合成中...' : '合成提示词'}</span>
                        </button>

                        {isMediaNode && (
                          <button
                            type="button"
                            disabled={Boolean(node.data.isGeneratingImage)}
                            onClick={() =>
                              onGenerateNodeImage(
                                node.id,
                                node.data.imageModelId || 'nano-banana-fast'
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 ${
                              node.type === 'character' || node.type === 'scene_asset'
                                ? darkMode
                                  ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                                : darkMode
                                ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300 hover:bg-sky-500/30'
                                : 'bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100'
                            }`}
                            title="调用 GRSAI 图像生成接口真实绘制角色定妆图或分镜首帧图"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>
                              {node.data.isGeneratingImage
                                ? '出图中...'
                                : node.type === 'storyboard' || node.type === 'video_clip'
                                ? '生成首帧图'
                                : '生成图片'}
                            </span>
                          </button>
                        )}

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
                                node.data.videoGenModelId || 'minimax-h3'
                              )
                            }
                            className={`pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${
                              darkMode
                                ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                            title="调用 GRSAI MiniMax H3 / Agnes Video 2.5 真实生成分镜视频"
                          >
                            <Video className="w-3 h-3" />
                            <span>
                              {node.data.isGeneratingVideo ||
                              node.data.videoStatus === 'running'
                                ? `视频 ${node.data.videoProgress ?? 5}%`
                                : '生成视频'}
                            </span>
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
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Creator Toolbar */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-2 rounded-2xl border shadow-2xl backdrop-blur-md ${
          darkMode
            ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100'
            : 'bg-white/95 border-slate-200/90 text-slate-800'
        }`}
      >
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
          <span>漫游/选择</span>
          <span className={toolbarTooltipClass}>
            自由拖拽漫游画布或移动节点 (按住 Shift 拖拽可直接区域框选)
          </span>
        </button>

        {/* Requirement 2: Dedicated Marquee Box Selection Tool Button */}
        <button
          type="button"
          onClick={() => {
            setActiveTool('box_select');
            setConnectingSourceId(null);
          }}
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTool === 'box_select'
              ? 'bg-amber-400 text-zinc-950 font-semibold'
              : darkMode
              ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          <span>
            框选{selectedGroupIds.length > 1 ? ` (${selectedGroupIds.length})` : ''}
          </span>
          <span className={toolbarTooltipClass}>
            区域框选模式：在画布空白处拖拽划定矩形框选多个节点，点击任一选中节点可同步平移整组
          </span>
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
              setIsOrganizeMenuOpen(false);
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
          onClick={() =>
            onAddNode(
              'character',
              Math.round(lastPointerWorldPosRef.current.x / 10) * 10,
              Math.round(lastPointerWorldPosRef.current.y / 10) * 10
            )
          }
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>+ 角色锚点</span>
          <kbd
            className={`ml-0.5 px-1 py-0.2 rounded text-[9px] font-mono border ${
              darkMode
                ? 'bg-zinc-950 border-zinc-700 text-amber-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            C
          </kbd>
          <span className={toolbarTooltipClass}>
            新建 @Image 角色锚点节点 (快捷键: C)
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onAddNode(
              'script',
              Math.round(lastPointerWorldPosRef.current.x / 10) * 10,
              Math.round(lastPointerWorldPosRef.current.y / 10) * 10
            )
          }
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ 剧本</span>
          <kbd
            className={`ml-0.5 px-1 py-0.2 rounded text-[9px] font-mono border ${
              darkMode
                ? 'bg-zinc-950 border-zinc-700 text-sky-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            S
          </kbd>
          <span className={toolbarTooltipClass}>
            新建分场剧本节点 (快捷键: S)
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onAddNode(
              'storyboard',
              Math.round(lastPointerWorldPosRef.current.x / 10) * 10,
              Math.round(lastPointerWorldPosRef.current.y / 10) * 10
            )
          }
          className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            darkMode
              ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>+ 视频分镜</span>
          <kbd
            className={`ml-0.5 px-1 py-0.2 rounded text-[9px] font-mono border ${
              darkMode
                ? 'bg-zinc-950 border-zinc-700 text-purple-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            V
          </kbd>
          <span className={toolbarTooltipClass}>
            新建 9:16 视频分镜节点 (快捷键: V)
          </span>
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

        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsColorMenuOpen(false);
              setIsOrganizeMenuOpen((o) => !o);
            }}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isOrganizeMenuOpen
                ? darkMode
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                  : 'bg-amber-50 border border-amber-300 text-amber-800'
                : darkMode
                ? 'text-amber-300 hover:bg-zinc-800 hover:text-amber-200'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>整理节点</span>
            <span className={toolbarTooltipClass}>
              自动将画布节点按【资产 / 剧本 / 分镜 / 音轨表】分类归档与对齐
            </span>
          </button>

          {isOrganizeMenuOpen && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className={`absolute bottom-12 left-1/2 -translate-x-1/2 p-2.5 rounded-2xl border shadow-2xl w-72 space-y-1.5 z-50 ${
                darkMode
                  ? 'bg-zinc-950/98 border-zinc-700 text-zinc-100'
                  : 'bg-white/98 border-slate-200 text-slate-900'
              }`}
            >
              <div
                className={`px-2 py-1 text-[11px] font-semibold border-b flex items-center justify-between ${
                  darkMode ? 'border-zinc-800 text-zinc-200' : 'border-slate-100 text-slate-800'
                }`}
              >
                <span>选择节点自动分类整理模式</span>
                <span className="text-[10px] font-mono text-amber-400">支持 Ctrl+Z 撤销</span>
              </div>

              <button
                type="button"
                onClick={() => triggerOrganize('category_groups')}
                className={`w-full p-2 rounded-xl text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                  darkMode
                    ? 'hover:bg-zinc-900 text-zinc-100'
                    : 'hover:bg-slate-100 text-slate-900'
                }`}
              >
                <FolderKanban className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>智能四大分区自动分类</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      推荐
                    </span>
                  </div>
                  <p
                    className={`text-[10px] mt-0.5 leading-snug ${
                      darkMode ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    自动归入【角色与场景资产区】【分场剧本区】【9:16 分镜矩阵区】【音轨与统筹表区】并生成虚线分类框
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => triggerOrganize('type_columns')}
                className={`w-full p-2 rounded-xl text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                  darkMode
                    ? 'hover:bg-zinc-900 text-zinc-100'
                    : 'hover:bg-slate-100 text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">按节点类型垂直分列归类</div>
                  <p
                    className={`text-[10px] mt-0.5 leading-snug ${
                      darkMode ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    按【角色定妆列 → 场景载具列 → 剧本批注列 → 视觉分镜列 → 音轨统筹列】5 列严格归类
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => triggerOrganize('pipeline_compact')}
                className={`w-full p-2 rounded-xl text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                  darkMode
                    ? 'hover:bg-zinc-900 text-zinc-100'
                    : 'hover:bg-slate-100 text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">紧凑三栏拓扑流水线对齐</div>
                  <p
                    className={`text-[10px] mt-0.5 leading-snug ${
                      darkMode ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    按【上游资产锚点 → 中游剧本 → 下游 180° 分镜网格】紧凑排布
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {onRunAxisInspection && (
          <button
            type="button"
            onClick={onRunAxisInspection}
            className={`group relative px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              axisViolations.length > 0
                ? 'bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30'
                : darkMode
                ? 'text-emerald-400 hover:bg-zinc-800'
                : 'text-emerald-700 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              180°轴线巡检
              {axisViolations.length > 0 ? ` (${axisViolations.length}警报)` : ' (正常)'}
            </span>
            <span className={toolbarTooltipClass}>
              检查分镜节点是否存在未连线且位置跳轴的 180° 轴线逻辑违例
            </span>
          </button>
        )}

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
