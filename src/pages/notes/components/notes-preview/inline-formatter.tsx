import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Inline markdown formatting parser
 */
export function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code
          key={idx}
          className={cn(
            // Sizing & Spacing
            "px-1.5 py-0.5 rounded font-mono text-[11px] sm:text-xs",

            // Backgrounds & Borders
            "bg-muted border text-primary"
          )}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      return (
        <img
          key={idx}
          src={imgMatch[2]}
          loading="lazy"
          alt={imgMatch[1] || 'Embedded Diagram'}
          className={cn(
            // Layout & Positioning
            "inline-block align-middle my-1",

            // Sizing & Spacing
            "max-h-48 rounded border"
          )}
        />
      );
    }

    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            // Typography
            "text-primary underline",

            // Interactive & States
            "hover:text-primary/80 transition-colors"
          )}
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}
