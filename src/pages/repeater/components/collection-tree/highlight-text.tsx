import { cn } from '@/lib/utils';
import { splitHighlight } from './utils';

interface HighlightTextProps {
  text: string;
  query: string;
}

/**
 * Renders `text` with the runs that matched `query` marked.
 *
 * The mark is a tinted background rather than a coloured run: the tree already spends colour on
 * method pills and the selection rail, so a wash reads as "this is why the row is here" without
 * competing with either. Keys are positional because the segments are a pure function of
 * (text, query) and can never reorder — only their contents change.
 */
export function HighlightText({ text, query }: Readonly<HighlightTextProps>) {
  return (
    <>
      {splitHighlight(text, query).map((segment, index) =>
        segment.match ? (
          <span
            key={index}
            data-slot="tree-match"
            className={cn(
              // Sizing & Spacing
              'rounded-[3px]',

              // Backgrounds & Borders
              'bg-primary/25',

              // Typography
              'text-foreground'
            )}
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}
