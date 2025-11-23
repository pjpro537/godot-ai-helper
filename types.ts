export enum ToolMode {
  CODE_GEN = 'CODE_GEN',
  ASSET_GEN = 'ASSET_GEN',
  PHYSICS = 'PHYSICS',
  LOGIC = 'LOGIC',
  DEBUGGER = 'DEBUGGER',
  CHAT = 'CHAT'
}

export type GodotContextType = '2D' | '3D' | 'UI' | 'Logic' | 'Shader';

export type AssetOutputMode = 'script' | 'image';

export interface GenerationConfig {
  creativity: number; // 0.0 (Strict) to 1.0 (Creative)
  verbosity: 'minimal' | 'standard' | 'educational';
  typing: 'strict' | 'dynamic';
  architecture: 'default' | 'composition' | 'inheritance';
}

export interface ProjectFile {
  id: string;
  name: string;
  language: 'gdscript' | 'shader' | 'json';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  codeSnippet?: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface GeneratedCodeResponse {
  code: string;
  explanation: string;
}

export const GODOT_BLUE = '#478cbf';
export const GODOT_DARK = '#202531';