import * as React from 'react';
import type { NotesSectionRendererProps } from './types';
import { HeadingSection } from './heading-section';
import { ParagraphSection } from './paragraph-section';
import { QuoteSection } from './quote-section';
import { TaskListSection } from './task-list-section';
import { ListSection } from './list-section';
import { ImageSection } from './image-section';
import { CodeSection } from './code-section';

/**
 * Modular NotesSectionRenderer
 * Dispatches parsed markdown blocks to their dedicated presentational & interactive section renderers.
 * Architecture is designed to easily plug in executable automation sections in the future.
 */
export const NotesSectionRenderer = React.memo(function NotesSectionRenderer({
  block,
  onToggleTask,
  onUpdateContent,
  onOpenDrawingStudio,
}: NotesSectionRendererProps) {
  switch (block.type) {
    case 'h1':
    case 'h2':
    case 'h3':
      return <HeadingSection block={block} level={block.type} onUpdateContent={onUpdateContent} />;

    case 'quote':
      return <QuoteSection block={block} onUpdateContent={onUpdateContent} />;

    case 'task':
      return (
        <TaskListSection
          block={block}
          onToggleTask={onToggleTask}
          onUpdateContent={onUpdateContent}
        />
      );

    case 'ul':
      return <ListSection block={block} ordered={false} onUpdateContent={onUpdateContent} />;

    case 'ol':
      return <ListSection block={block} ordered={true} onUpdateContent={onUpdateContent} />;

    case 'image':
      return (
        <ImageSection
          block={block}
          onOpenDrawingStudio={onOpenDrawingStudio}
          onUpdateContent={onUpdateContent}
        />
      );

    case 'code':
      return <CodeSection block={block} onUpdateContent={onUpdateContent} />;

    case 'p':
    default:
      return <ParagraphSection block={block} onUpdateContent={onUpdateContent} />;
  }
});
