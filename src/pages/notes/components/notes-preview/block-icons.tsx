import * as React from 'react';
import {
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  QuotesIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  ImageIcon,
  CodeIcon,
  TextAlignLeftIcon,
  CheckSquareIcon,
} from '@phosphor-icons/react';
import type { ParsedBlock } from './types';

/**
 * Returns a short single-line summary string for minimized drag state
 */
export function getBlockSummaryText(block: ParsedBlock): string {
  switch (block.type) {
    case 'h1':
    case 'h2':
    case 'h3':
      return block.data?.text || 'Heading';
    case 'task':
      return `${block.data?.tasks?.length || 1} task(s): ${block.data?.tasks?.[0]?.text || ''}`;
    case 'ul':
    case 'ol':
      return `${block.data?.items?.length || 1} item(s): ${block.data?.items?.[0] || ''}`;
    case 'image':
      return block.data?.alt || 'Embedded Image';
    case 'code':
      return `${block.data?.lang || 'Code'} snippet`;
    case 'quote':
      return `"${(block.data?.text || '').slice(0, 40)}..."`;
    case 'p':
    default:
      return (block.data?.text || '').slice(0, 55) || 'Text paragraph';
  }
}

export function getBlockTypeLabel(type: ParsedBlock['type']): string {
  switch (type) {
    case 'h1':
      return 'H1';
    case 'h2':
      return 'H2';
    case 'h3':
      return 'H3';
    case 'task':
      return 'Tasks';
    case 'ul':
      return 'Bullet List';
    case 'ol':
      return 'Number List';
    case 'image':
      return 'Image';
    case 'code':
      return 'Code';
    case 'quote':
      return 'Quote';
    case 'p':
    default:
      return 'Text';
  }
}

export function getBlockIcon(type: ParsedBlock['type']): React.ReactNode {
  switch (type) {
    case 'h1':
      return <TextHOneIcon className="size-3.5 text-primary shrink-0" />;
    case 'h2':
      return <TextHTwoIcon className="size-3.5 text-primary shrink-0" />;
    case 'h3':
      return <TextHThreeIcon className="size-3.5 text-primary shrink-0" />;
    case 'task':
      return <CheckSquareIcon className="size-3.5 text-emerald-500 shrink-0" />;
    case 'ul':
      return <ListBulletsIcon className="size-3.5 text-sky-500 shrink-0" />;
    case 'ol':
      return <ListNumbersIcon className="size-3.5 text-sky-500 shrink-0" />;
    case 'image':
      return <ImageIcon className="size-3.5 text-amber-500 shrink-0" />;
    case 'code':
      return <CodeIcon className="size-3.5 text-purple-500 shrink-0" />;
    case 'quote':
      return <QuotesIcon className="size-3.5 text-muted-foreground shrink-0" />;
    case 'p':
    default:
      return <TextAlignLeftIcon className="size-3.5 text-muted-foreground shrink-0" />;
  }
}
