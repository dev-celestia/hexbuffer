import type { ParsedBlock } from '../notes-preview/types';

export interface BaseSectionProps {
  block: ParsedBlock;
  onUpdateContent?: (content: string) => void;
}

export interface HeadingSectionProps extends BaseSectionProps {
  level: 'h1' | 'h2' | 'h3';
}

export interface ParagraphSectionProps extends BaseSectionProps {}

export interface QuoteSectionProps extends BaseSectionProps {}

export interface TaskListSectionProps extends BaseSectionProps {
  onToggleTask: (lineIndex: number) => void;
}

export interface ListSectionProps extends BaseSectionProps {
  ordered?: boolean;
}

export interface ImageSectionProps extends BaseSectionProps {
  onOpenDrawingStudio?: () => void;
}

export interface CodeSectionProps extends BaseSectionProps {}

export interface NotesSectionRendererProps {
  block: ParsedBlock;
  onToggleTask: (lineIndex: number) => void;
  onUpdateContent?: (content: string) => void;
  onOpenDrawingStudio?: () => void;
}
