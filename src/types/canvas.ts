export type NodeCategory =
  | 'idea'
  | 'script'
  | 'character'
  | 'scene_asset'
  | 'storyboard'
  | 'text_note'
  | 'audio_clip'
  | 'video_clip'
  | 'storyboard_table'
  | 'group';

export type ShotAspectRatio = '9:16' | '16:9';

export type VideoModelTarget = 'minimax_h3' | 'seedance_2_0' | 'seedance_2_5';

export interface VideoPromptBundle {
  minimax_h3?: string;
  seedance_2_0?: string;
  seedance_2_5?: string;
}

export interface DialogueLine {
  speaker: string;
  emotion: string;
  line: string;
}

export interface StoryboardTableRow {
  shotNo: string;
  shotSize: string;
  cameraMove: string;
  axisLine?: string;
  facsMicro?: string;
  summary?: string;
  visualContent?: string;
  audioCue?: string;
  duration: string;
}

export interface CanvasNodeData {
  title: string;
  subtitle?: string;
  // For 'idea' | 'text_note'
  logline?: string;
  genre?: string;
  targetEpisodes?: string;
  noteText?: string;
  textNoteContent?: string;
  // For 'script'
  sceneNumber?: string;
  location?: string;
  timeOfDay?: string;
  hookPoint?: string;
  reversalPoint?: string;
  scriptBody?: string;
  dialogues?: DialogueLine[];
  // For 'character' | 'scene_asset'
  roleType?: string;
  consistencyPrompt?: string;
  costumeDetails?: string;
  lightingMood?: string;
  visualPreset?:
    | 'lu_chen'
    | 'su_wan'
    | 'villain_zhao'
    | 'pawnshop'
    | 'banquet_hall'
    | 'rain_alley'
    | 'custom';
  colorPalette?: string[];
  threeViewVerified?: boolean;
  // For 'storyboard' | 'video_clip'
  shotNumber?: string;
  aspectRatio?: ShotAspectRatio;
  shotSize?: string;
  cameraMove?: string;
  focalLength?: string;
  visualPrompt?: string;
  videoModelTarget?: VideoModelTarget;
  videoPrompts?: VideoPromptBundle;
  dialogueSnippet?: string;
  speakerName?: string;
  durationSec?: number;
  compositionType?:
    | 'rain_umbrella_cu'
    | 'counter_ots'
    | 'eyes_flashback_ecu'
    | 'pocket_watch_insert'
    | 'banquet_confrontation'
    | 'custom_ai';
  generatedImageUrl?: string;
  customSvgElements?: {
    primaryHue: string;
    secondaryHue: string;
    keyLightAngle: string;
    silhouetteType:
      | 'single_closeup'
      | 'two_person_ots'
      | 'dramatic_eyes'
      | 'wide_environment'
      | 'action_dynamic';
    cameraVectorLabel: string;
    focalCaption: string;
  };
  isRendering?: boolean;
  lastRenderedAt?: string;
  // For 'audio_clip'
  audioType?: 'dialogue' | 'bgm' | 'sfx';
  audioTag?: string;
  audioTranscript?: string;
  audioBpmOrMood?: string;
  voiceprintProfile?: string;
  // For 'storyboard_table'
  tableRows?: StoryboardTableRow[];
  // For 'group'
  groupColor?: string;
  groupDescription?: string;
}

export interface CanvasNode {
  id: string;
  type: NodeCategory;
  position: { x: number; y: number };
  width: number;
  height?: number;
  parentGroupId?: string;
  createdBySkillId?: string;
  data: CanvasNodeData;
}

export type EdgeRelationType =
  | 'character_ref'
  | 'scene_ref'
  | 'script_breakdown'
  | 'shot_sequence';

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: EdgeRelationType;
  label?: string;
}

export type SkillCategory =
  | 'script'
  | 'character'
  | 'scene'
  | 'storyboard'
  | 'camera'
  | 'video_model'
  | 'custom';

export interface DramaSkill {
  id: string;
  name: string;
  version: string;
  category: SkillCategory;
  sourceRepo?: string;
  targetVideoModel?: VideoModelTarget;
  promptSyntaxFormula?: string;
  description: string;
  systemInstruction: string;
  inputVariables: string[];
  outputNodeType: NodeCategory;
  exampleUserPrompt: string;
  isBuiltIn: boolean;
}

export type AIProviderType = 'deepseek' | 'grsai' | 'gemini' | 'custom';

export type ModelModality = 'text' | 'image' | 'video';

export interface CustomAIProviderConfig {
  id: string;
  name: string;
  protocol: 'openai_compatible';
  baseUrl: string;
  apiKey: string;
  models: string[];
  supportsVision: boolean;
  enabled: boolean;
}

export interface AgentModelOption {
  id: string; // e.g. 'deepseek:deepseek-chat' | 'grsai:gemini-3.5-flash' | 'custom:siliconflow:deepseek-v3'
  provider: AIProviderType;
  providerLabel: string;
  modelName: string;
  displayName: string;
  badge: string;
  modality?: ModelModality;
  resolutionInfo?: string;
  description?: string;
  supportsVision: boolean;
  verified: boolean;
  customProviderId?: string;
}

export interface GrsaiModelEntry {
  id: string; // e.g. 'grsai:nano-banana-2.1'
  modelName: string;
  displayName: string;
  modality: ModelModality;
  badge: string;
  resolutionOrDuration: string;
  description: string;
  supportsVision: boolean;
}

export interface UploadedAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'text' | 'image';
  textContent?: string;
  dataUrl?: string;
}

export interface AgentToolCallItem {
  id: string;
  toolName: string;
  target: string;
  detail?: string;
  status: 'completed' | 'running';
}

export interface AgentActionHistory {
  durationLabel: string;
  summaryHeader: string;
  thinkingSteps: string[];
  toolCalls: AgentToolCallItem[];
  builtStatus: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  mountedSkills?: string[];
  attachments?: { name: string; kind: 'text' | 'image' }[];
  focusedNodeTitle?: string;
  spawnedNodeIds?: string[];
  actionHistory?: AgentActionHistory;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  episodeTitle: string;
  description: string;
  genreTag?: string;
  aspectRatio?: ShotAspectRatio;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CanvasProject {
  id: string;
  name: string;
  episodeTitle: string;
  description: string;
  genreTag: string;
  aspectRatio: ShotAspectRatio;
  createdAt: string;
  updatedAt: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  mountedSkillIds?: string[];
  edgeColor?: string;
  isBuiltInOrigin?: boolean;
}

// Command Pattern State Snapshot & History Command for Undo/Redo
export interface CanvasStateSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  mountedSkillIds: string[];
  selectedNodeId: string | null;
}

export interface CanvasHistoryCommand {
  id: string;
  label: string;
  timestamp: string;
  before: CanvasStateSnapshot;
  after: CanvasStateSnapshot;
}
