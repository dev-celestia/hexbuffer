import * as React from 'react';
import { PaintBrushIcon } from '@phosphor-icons/react';
import {
  BlockTextEditor,
  DEFAULT_SECTION_TEMPLATES,
  type SectionTemplateItem,
} from '@celestia-project/ui';

export interface NotesPreviewPaneProps {
  content: string;
  onUpdateContent?: (newContent: string) => void;
  onOpenDrawingStudio?: () => void;
  className?: string;
}

/**
 * Notes-specific wrapper around the reusable BlockTextEditor:
 * injects the Drawing Studio template and notes empty-state copy.
 */
export function NotesPreviewPane({
  content,
  onUpdateContent,
  onOpenDrawingStudio,
  className,
}: NotesPreviewPaneProps) {
  const sectionTemplates = React.useMemo<SectionTemplateItem[]>(() => {
    if (!onOpenDrawingStudio) return DEFAULT_SECTION_TEMPLATES;
    return [
      ...DEFAULT_SECTION_TEMPLATES,
      {
        id: 'drawing',
        category: 'Visual Media',
        label: 'Drawing Studio',
        description: 'Open visual canvas studio',
        icon: <PaintBrushIcon className="size-4 text-purple-500 shrink-0" />,
        action: onOpenDrawingStudio,
      },
    ];
  }, [onOpenDrawingStudio]);

  return (
    <BlockTextEditor
      content={content}
      onUpdateContent={onUpdateContent}
      className={className}
      sectionTemplates={sectionTemplates}
      emptyStateCopy={{
        title: 'Empty Note Canvas',
        description:
          'Add content sections, draw on the scratchpad, or drop images from your computer to get started.',
      }}
      dropHint="Drop image here to embed into note"
    />
  );
}
