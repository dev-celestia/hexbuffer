import * as React from 'react';

export interface TaskItem {
  lineIndex: number;
  isChecked: boolean;
  text: string;
}

export interface ParsedBlock {
  id: string;
  startLine: number;
  endLine: number;
  type: 'h1' | 'h2' | 'h3' | 'quote' | 'task' | 'ul' | 'ol' | 'image' | 'code' | 'p';
  rawText: string;
  data?: {
    text?: string;
    code?: string;
    lang?: string;
    alt?: string;
    src?: string;
    tasks?: TaskItem[];
    items?: string[];
  };
}

export interface NotesPreviewPaneProps {
  content: string;
  onUpdateContent?: (newContent: string) => void;
  onOpenDrawingStudio?: () => void;
  className?: string;
}

export interface SortableBlockItemProps {
  block: ParsedBlock;
  isAnyDragging: boolean;
  isJustDropped?: boolean;
  onToggleTask: (lineIndex: number) => void;
  onStartEditing: () => void;
  onDeleteBlock?: () => void;
  onUpdateContent?: (content: string) => void;
  onOpenDrawingStudio?: () => void;
  canEdit: boolean;
}
