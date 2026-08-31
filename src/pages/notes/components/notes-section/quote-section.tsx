import * as React from 'react';
import { cn } from '@/lib/utils';
import { renderInlineFormatting } from '../notes-preview/inline-formatter';
import type { QuoteSectionProps } from './types';

export const QuoteSection = React.memo(function QuoteSection({
  block,
}: QuoteSectionProps) {
  return (
    <blockquote
      className={cn(
        // Sizing & Spacing
        "ps-3 py-1 border-s-2 my-1",

        // Typography
        "text-xs sm:text-sm text-muted-foreground italic",

        // Backgrounds & Borders
        "border-primary bg-primary/5 rounded-e"
      )}
    >
      {renderInlineFormatting(block.data?.text || '')}
    </blockquote>
  );
});
