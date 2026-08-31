import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ImageSectionProps } from './types';

export const ImageSection = React.memo(function ImageSection({
  block,
}: ImageSectionProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        "group/img relative flex flex-col items-center",

        // Sizing & Spacing
        "my-3"
      )}
    >
      <img
        src={block.data?.src}
        loading="lazy"
        alt={block.data?.alt || 'Embedded Diagram'}
        className={cn(
          // Sizing & Spacing
          "max-w-full max-h-[500px] object-contain rounded-lg border shadow-sm",

          // Backgrounds & Borders
          "bg-card"
        )}
      />
      {block.data?.alt && (
        <span
          className={cn(
            // Sizing & Spacing
            "mt-1",

            // Typography
            "text-[11px] text-muted-foreground text-center italic"
          )}
        >
          {block.data.alt}
        </span>
      )}
    </div>
  );
});
