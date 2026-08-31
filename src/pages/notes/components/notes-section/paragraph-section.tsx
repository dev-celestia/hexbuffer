import * as React from 'react';
import { cn } from '@/lib/utils';
import { renderInlineFormatting } from '../notes-preview/inline-formatter';
import type { ParagraphSectionProps } from './types';

export const ParagraphSection = React.memo(function ParagraphSection({
  block,
}: ParagraphSectionProps) {
  return (
    <p
      className={cn(
        // Sizing & Spacing
        "my-1",

        // Typography
        "text-xs sm:text-sm text-foreground/90 leading-relaxed"
      )}
    >
      {renderInlineFormatting(block.data?.text || '')}
    </p>
  );
});
