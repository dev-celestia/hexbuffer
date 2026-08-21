import { Button, Input } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import { CopySimple, DownloadSimple, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react';
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
    const text = results
      .map((r) => `${r.hash}:${r.plaintext}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${results.length} results to clipboard`);
  };

  const exportResults = () => {
    onExport();
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
          "flex items-center justify-between",
          
          // Sizing & Spacing
          "h-11 px-3 gap-2",
          
          // Backgrounds & Borders
          "border-b border-border bg-muted/20",
          
          // Typography
          "select-none"
        )}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
            Cracked Results
          </span>
          <span className="text-[10px] text-green-600 dark:text-green-400">
            {results.length} recovered
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {results.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="xs"
                onClick={copyAllResults}
                className="h-7 text-[11px] gap-1 px-2"
              >
                <CopySimple className="h-3.5 w-3.5" />
                Copy All
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={exportResults}
                className="h-7 text-[11px] gap-1 px-2"
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
            // Sizing & Spacing
            "p-3",
            
            // Backgrounds & Borders
            "border-b border-border/50 bg-muted/5"
          )}
        >
          <div className="relative">
            <MagnifyingGlass
              className={cn(
                // Layout & Positioning
                "absolute left-3 top-1/2 -translate-y-1/2",
                
                // Sizing & Spacing
                "h-3.5 w-3.5",
                
                // Typography
                "text-muted-foreground"
              )}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hash or plaintext..."
              className="h-9 pl-9 text-xs"
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
          "p-2 gap-1"
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
                "h-16 w-16 rounded-full",
                
                // Backgrounds & Borders
                "bg-muted/30"
              )}
            >
              <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-muted-foreground">
                No results yet
              </span>
              <span className="text-xs text-muted-foreground/70">
                Cracked passwords will appear here
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
            <span className="text-sm text-muted-foreground">
              No matches found for "{searchQuery}"
            </span>
          </div>
        ) : (
          filteredResults.map((result, index) => (
            <ResultCard key={result.id || index} result={result} onCopy={() => copyResult(result)} />
          ))
        )}
      </div>

      {/* Footer Stats */}
      {results.length > 0 && (
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center justify-between",
            
            // Sizing & Spacing
            "h-9 px-3 gap-2",
            
            // Backgrounds & Borders
            "border-t border-border bg-muted/10",
            
            // Typography
            "text-xs text-muted-foreground"
          )}
        >
          <span>
            {filteredResults.length === results.length
              ? `${results.length} total`
              : `${filteredResults.length} of ${results.length}`}
          </span>
          <span className="text-green-600 dark:text-green-400">
            Recovery rate: {((results.length / Math.max(1, results.length)) * 100).toFixed(1)}%
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
  const algorithmLabel = HASH_OPTIONS.find((h) => h.value === result.algorithm)?.label || result.algorithm.toUpperCase();
  
  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex flex-col",
        
        // Sizing & Spacing
        "p-3 gap-2",
        
        // Backgrounds & Borders
        "rounded-lg border border-green-500/30 bg-green-500/5",
        
        // Interactive & States
        "hover:bg-green-500/10 transition-colors group"
      )}
    >
      {/* Header with metadata */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {algorithmLabel}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {new Date(result.crackedAt).toLocaleTimeString()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCopy}
            className={cn(
              // Sizing & Spacing
              "h-6 w-6 shrink-0",
              
              // Interactive & States
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <CopySimple className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Hash value */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2",
          
          // Sizing & Spacing
          "p-2",
          
          // Backgrounds & Borders
          "bg-muted/30 rounded border border-border/50"
        )}
      >
        <span className="text-[10px] uppercase text-muted-foreground/70 shrink-0">
          Hash:
        </span>
        <code className="text-xs font-mono text-muted-foreground truncate flex-1">
          {result.hash}
        </code>
      </div>

      {/* Plaintext value */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center gap-2",
          
          // Sizing & Spacing
          "p-2",
          
          // Backgrounds & Borders
          "bg-green-500/10 rounded border border-green-500/30"
        )}
      >
        <span className="text-[10px] uppercase text-green-600/70 dark:text-green-400/70 shrink-0 font-semibold">
          Plain:
        </span>
        <code className="text-sm font-mono font-semibold text-green-600 dark:text-green-400 truncate flex-1">
          {result.plaintext}
        </code>
      </div>

      {/* Additional metadata */}
      {result.attempts && (
        <div className="text-[10px] text-muted-foreground/60">
          Cracked after {result.attempts.toLocaleString()} attempts
        </div>
      )}
    </div>
  );
}
