import * as React from 'react';
import { cn } from '@/lib/utils';
import { renderInlineFormatting } from '../notes-preview/inline-formatter';
import type { ListSectionProps } from './types';

export const ListSection = React.memo(function ListSection({
  block,
  ordered = false,
}: ListSectionProps) {
  const items = block.data?.items || [];

  if (ordered) {
    return (
      <ol
        className={cn(
          // Sizing & Spacing
          "space-y-1 my-1 ps-2",

          // Typography
          "list-decimal list-inside"
        )}
      >
        {items.map((item: string, idx: number) => (
          <li key={idx} className="text-xs sm:text-sm">
            {renderInlineFormatting(item)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul
      className={cn(
        // Sizing & Spacing
        "space-y-1 my-1 ps-2",

        // Typography
        "list-disc list-inside"
      )}
    >
      {items.map((item: string, idx: number) => (
        <li key={idx} className="text-xs sm:text-sm">
          {renderInlineFormatting(item)}
        </li>
      ))}
    </ul>
  );
});
