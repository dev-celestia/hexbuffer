import { type Change } from 'diff';
import { GitDiffIcon } from '@phosphor-icons/react';
import type { DiffMode } from '../types';
import { useComparerDiffView, type InlinePart } from './hooks/use-comparer-diff-view';
import { cn } from '@/lib/utils';

// ── Inline Renderer ─────────────────────────────────

function InlineRenderer({ parts }: { parts: InlinePart[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className={cn(
            // Backgrounds & Borders
            p.type === 'added'
              ? 'bg-green-400/30 rounded-sm'
              : p.type === 'removed'
                ? 'bg-red-400/30 rounded-sm'
                : ''
          )}
        >
          {p.text}
        </span>
      ))}
    </>
  );
}

// ── Main Component ──────────────────────────────────

interface ComparerDiffViewProps {
  diffResult: Change[];
  diffMode: DiffMode;
}

export function ComparerDiffView({ diffResult, diffMode }: ComparerDiffViewProps) {
  const { lines, isEmpty } = useComparerDiffView(diffResult, diffMode);

  if (isEmpty) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-center",

          // Sizing & Spacing
          "h-full",

          // Typography
          "text-sm text-muted-foreground"
        )}
      >
        <div
          className={cn(
            // Typography
            "text-center"
          )}
        >
          <GitDiffIcon
            className={cn(
              // Layout & Positioning
              "mx-auto",

              // Sizing & Spacing
              "h-8 w-8 mb-2",

              // Typography
              "text-muted-foreground/50"
            )}
          />
          <p>Enter text in both panels to see the diff</p>
        </div>
      </div>
    );
  }

  let leftLineNum = 0;
  let rightLineNum = 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        "overflow-auto",

        // Sizing & Spacing
        "h-full",

        // Typography
        "font-mono text-xs"
      )}
    >
      <table
        className={cn(
          // Layout & Positioning
          "w-full",

          // Backgrounds & Borders
          "border-collapse"
        )}
      >
        <thead>
          <tr
            className={cn(
              // Layout & Positioning
              "sticky top-0 z-10",

              // Backgrounds & Borders
              "bg-muted/95 backdrop-blur"
            )}
          >
            <th
              className={cn(
                // Sizing & Spacing
                "w-12 px-2 py-1",

                // Typography
                "text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",

                // Backgrounds & Borders
                "border-r border-b"
              )}
            >
              A
            </th>
            <th
              className={cn(
                // Sizing & Spacing
                "px-2 py-1",

                // Typography
                "text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",

                // Backgrounds & Borders
                "border-b"
              )}
            >
              Original
            </th>
            <th
              className={cn(
                // Sizing & Spacing
                "w-12 px-2 py-1",

                // Typography
                "text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",

                // Backgrounds & Borders
                "border-x border-b"
              )}
            >
              B
            </th>
            <th
              className={cn(
                // Sizing & Spacing
                "px-2 py-1",

                // Typography
                "text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",

                // Backgrounds & Borders
                "border-b"
              )}
            >
              Modified
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => {
            const showLeftNum = line.leftType !== 'empty';
            const showRightNum = line.rightType !== 'empty';
            if (showLeftNum) leftLineNum++;
            if (showRightNum) rightLineNum++;

            const isRemoved = line.leftType === 'removed';
            const isAdded = line.rightType === 'added';

            return (
              <tr
                key={idx}
                className={cn(
                  // Backgrounds & Borders
                  isRemoved && isAdded
                    ? 'bg-yellow-500/[0.06]'
                    : isRemoved
                      ? 'bg-red-500/[0.07]'
                      : isAdded
                        ? 'bg-green-500/[0.07]'
                        : ''
                )}
              >
                {/* Left line number */}
                <td
                  className={cn(
                    // Layout & Positioning
                    "select-none align-top",

                    // Sizing & Spacing
                    "w-12 px-2 py-0.5",

                    // Typography
                    "text-right text-[10px] leading-[1.4] text-muted-foreground/60",

                    // Backgrounds & Borders
                    "border-r"
                  )}
                >
                  {showLeftNum ? leftLineNum : ''}
                </td>
                {/* Left content */}
                <td
                  className={cn(
                    // Layout & Positioning
                    "whitespace-pre-wrap break-all align-top",

                    // Sizing & Spacing
                    "px-2 py-0.5",

                    // Typography
                    "leading-[1.4]",
                    isRemoved
                      ? 'text-red-600/90 dark:text-red-400/90'
                      : line.leftType === 'empty'
                        ? 'opacity-30'
                        : 'text-foreground/80'
                  )}
                >
                  {line.inlineLeft ? (
                    <InlineRenderer parts={line.inlineLeft} />
                  ) : (
                    <span>{line.leftContent || '\u00A0'}</span>
                  )}
                </td>
                {/* Right line number */}
                <td
                  className={cn(
                    // Layout & Positioning
                    "select-none align-top",

                    // Sizing & Spacing
                    "w-12 px-2 py-0.5",

                    // Typography
                    "text-right text-[10px] leading-[1.4] text-muted-foreground/60",

                    // Backgrounds & Borders
                    "border-x"
                  )}
                >
                  {showRightNum ? rightLineNum : ''}
                </td>
                {/* Right content */}
                <td
                  className={cn(
                    // Layout & Positioning
                    "whitespace-pre-wrap break-all align-top",

                    // Sizing & Spacing
                    "px-2 py-0.5",

                    // Typography
                    "leading-[1.4]",
                    isAdded
                      ? 'text-green-600/90 dark:text-green-400/90'
                      : line.rightType === 'empty'
                        ? 'opacity-30'
                        : 'text-foreground/80'
                  )}
                >
                  {line.inlineRight ? (
                    <InlineRenderer parts={line.inlineRight} />
                  ) : (
                    <span>{line.rightContent || '\u00A0'}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

