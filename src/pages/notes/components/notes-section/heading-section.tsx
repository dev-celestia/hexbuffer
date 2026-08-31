import * as React from 'react';
import { cn } from '@/lib/utils';
import { renderInlineFormatting } from '../notes-preview/inline-formatter';
import type { HeadingSectionProps } from './types';

export const HeadingSection = React.memo(function HeadingSection({
  block,
  level,
}: HeadingSectionProps) {
  const text = block.data?.text || '';

  if (level === 'h1') {
    return (
      <h1
        className={cn(
          // Sizing & Spacing
          "pb-1 border-b",

          // Typography
          "text-xl sm:text-2xl font-bold tracking-tight text-foreground"
        )}
      >
        {renderInlineFormatting(text)}
      </h1>
    );
  }

  if (level === 'h2') {
    return (
      <h2
        className={cn(
          // Sizing & Spacing
          "pb-1 border-b border-border/50",

          // Typography
          "text-lg sm:text-xl font-semibold tracking-tight text-foreground"
        )}
      >
        {renderInlineFormatting(text)}
      </h2>
    );
  }

  return (
    <h3
      className={cn(
        // Typography
        "text-base font-semibold text-foreground"
      )}
    >
      {renderInlineFormatting(text)}
    </h3>
  );
});
