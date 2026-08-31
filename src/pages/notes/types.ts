import type { Scratchpad } from '@/stores/scratchpad';

export type NoteSortOption = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc' | 'created-desc';

export type NoteFilterTab = 'all' | 'open' | 'closed';

export type EditorViewMode = 'editor' | 'code';

export interface SavedNotesManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface NoteCardProps {
  note: Scratchpad;
  isOpenInTab: boolean;
  isActiveTab: boolean;
  onOpen: (id: string) => void;
  onCloseTab: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (note: Scratchpad) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

// Drawing Canvas Types
export type DrawingTool =
  | 'select'
  | 'pen'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'text'
  | 'eraser';

export type StrokeWidthOption = 2 | 4 | 6 | 8;

export type CanvasGridType = 'dots' | 'lines' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: DrawingTool;
  points?: Point[];
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  text?: string;
  fontSize?: number;
}

export interface DrawingTemplate {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
}

