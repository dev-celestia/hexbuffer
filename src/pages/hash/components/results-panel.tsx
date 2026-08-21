import { Button, Input } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { Copy, DownloadSimple, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { CrackedResult } from '../types';
import { HASH_OPTIONS } from '../constants';

interface ResultsPanelProps {
  results: CrackedResult[];
  onExport: () => void;
}

export function ResultsPanel({ results, onExport }: ResultsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;

    const query = searchQuery.toLowerCase();
    return results.filter(
      (r) =>
        r.hash.toLowerCase().includes(query) ||
        r.plaintext.toLowerCase().includes(query) ||
        r.algorithm.toLowerCase().includes(query)
    );
  }, [results, searchQuery]);

  const copyResult = (result: CrackedResult) => {
    const text = `${result.hash}:${result.plaintext}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const copyAllResults = () => {
    const text = results.map((r) => `${r.hash}:${r.plaintext}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${results.length} results to clipboard`);
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col min-h-0",

        // Sizing & Spacing
        "h-full",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0",

          // Sizing & Spacing
          "h-10 px-3 gap-2",

          // Backgrounds & Borders
          "border-b border-border/40 bg-muted/15 backdrop-blur-md",

          // Typography
          "select-none"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-baseline",

            // Sizing & Spacing
            "gap-2.5"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            )}
          >
            Cracked Results
          </span>
          <span
            className={cn(
              // Typography
              "text-[10px] text-emerald-600 dark:text-emerald-400 font-mono"
            )}
          >
            {results.length} recovered
          </span>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          {results.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={copyAllResults}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy All
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={onExport}
              >
                <DownloadSimple className="h-3.5 w-3.5" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {results.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "p-3",

            // Backgrounds & Borders
            "border-b border-border/40 bg-muted/5"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "relative flex-1"
            )}
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hash or plaintext..."
            />
          </div>
        </div>
      )}

      {/* Results List */}
      <div
        className={cn(
          // Layout & Positioning
          "flex flex-col flex-1 min-h-0 overflow-y-auto",

          // Sizing & Spacing
          "p-2 gap-2"
        )}
      >
        {results.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center flex-1",

              // Sizing & Spacing
              "gap-3 p-8",

              // Typography
              "text-center"
            )}
          >
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-center",

                // Sizing & Spacing
                "h-12 w-12 rounded-full",

                // Backgrounds & Borders
                "bg-muted/30"
              )}
            >
              <CheckCircle className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col",

                // Sizing & Spacing
                "gap-0.5"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-xs font-semibold text-muted-foreground"
                )}
              >
                No results yet
              </span>
              <span
                className={cn(
                  // Typography
                  "text-[11px] text-muted-foreground/70"
                )}
              >
                Cracked passwords will appear here in real time
              </span>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-col items-center justify-center flex-1",

              // Sizing & Spacing
              "gap-2 p-8",

              // Typography
              "text-center"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-xs text-muted-foreground"
              )}
            >
              No matches found for &quot;{searchQuery}&quot;
            </span>
          </div>
        ) : (
          filteredResults.map((result, index) => (
            <ResultCard
              key={result.id || index}
              result={result}
              onCopy={() => copyResult(result)}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      {results.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between shrink-0",

            // Sizing & Spacing
            "h-8 px-3 gap-2",

            // Backgrounds & Borders
            "border-t border-border/40 bg-muted/10",

            // Typography
            "text-[11px] text-muted-foreground"
          )}
        >
          <span>
            {filteredResults.length === results.length
              ? `${results.length} total`
              : `${filteredResults.length} of ${results.length}`}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Recovery rate: 100%
          </span>
        </div>
      )}
    </div>
  );
}

interface ResultCardProps {
  result: CrackedResult;
  onCopy: () => void;
}

function ResultCard({ result, onCopy }: ResultCardProps) {
  const algorithmLabel =
    HASH_OPTIONS.find((h) => h.value === result.algorithm)?.label ||
    result.algorithm.toUpperCase();

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "p-3 gap-2",

        // Backgrounds & Borders
        "rounded-md border border-emerald-500/30 bg-emerald-500/5",

        // Interactive & States
        "hover:bg-emerald-500/10 transition-colors group"
      )}
    >
      {/* Header with metadata */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between gap-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-1.5"
          )}
        >
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
          <span
            className={cn(
              // Typography
              "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
            )}
          >
            {algorithmLabel}
          </span>
        </div>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center gap-2"
          )}
        >
          <span
            className={cn(
              // Typography
              "text-[10px] text-muted-foreground/70"
            )}
          >
            {new Date(result.crackedAt).toLocaleTimeString()}
          </span>
          <div
            className={cn(
              // Interactive & States
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <Button
              variant="ghost"
              size="xs"
              onClick={onCopy}
              title="Copy result"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hash value */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2",

          // Sizing & Spacing
          "px-2.5 py-1.5",

          // Backgrounds & Borders
          "bg-muted/30 rounded border border-border/40"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[10px] uppercase text-muted-foreground/70 shrink-0 font-medium"
          )}
        >
          Hash:
        </span>
        <code
          className={cn(
            // Typography
            "text-xs font-mono text-muted-foreground truncate flex-1"
          )}
        >
          {result.hash}
        </code>
      </div>

      {/* Plaintext value */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2",

          // Sizing & Spacing
          "px-2.5 py-1.5",

          // Backgrounds & Borders
          "bg-emerald-500/10 rounded border border-emerald-500/30"
        )}
      >
        <span
          className={cn(
            // Typography
            "text-[10px] uppercase text-emerald-600/80 dark:text-emerald-400/80 shrink-0 font-semibold"
          )}
        >
          Plain:
        </span>
        <code
          className={cn(
            // Typography
            "text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate flex-1"
          )}
        >
          {result.plaintext}
        </code>
      </div>

      {/* Additional metadata */}
      {result.attempts && (
        <div
          className={cn(
            // Typography
            "text-[10px] text-muted-foreground/60"
          )}
        >
          Cracked after {result.attempts.toLocaleString()} attempts
        </div>
      )}
    </div>
  );
}
