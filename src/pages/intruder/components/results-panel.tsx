import React, { useEffect, useRef, useState } from 'react';
import { Button, Input } from '@celestia-project/ui';
import { useIntruderStore } from '@/stores/intruder';
import { formatPayloadValues, getResultUrl } from '../lib/utils';
import { useIntruderFilters } from '../hooks/use-filters';

import { TrashIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function IntruderResultsPanel() {
  const { filterSearch, filteredResults, resultsCount, setFilterSearch, clearResults } = useIntruderFilters();
  const isRunning = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.isRunning ?? false;
  });
  const selectedResult = useIntruderStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId);
    return tab?.selectedResult ?? null;
  });
  const setSelectedResult = useIntruderStore((s) => s.setSelectedResult);


  const [localSearch, setLocalSearch] = useState(filterSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(filterSearch);
  }, [filterSearch]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilterSearch(val);
    }, 200);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilterSearch('');
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-background">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-muted/40 px-3 py-1.5 border-b border-border shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Results ({filteredResults.length})
          </span>
          <div
            className={cn(
              // Layout & Positioning
              "relative flex items-center"
            )}
          >
            <MagnifyingGlassIcon
              className={cn(
                // Layout & Positioning
                "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none",

                // Sizing & Spacing
                "size-3.5",

                // Typography
                "text-muted-foreground"
              )}
            />
            <Input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search status or payload…"
              className={cn(
                // Sizing & Spacing
                "h-7 w-44 pl-7 pr-7 text-xs bg-background",

                // Backgrounds & Borders
                "border-input",

                // Interactive & States
                "focus:w-56 transition-all duration-150"
              )}
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={cn(
                  // Layout & Positioning
                  "absolute right-2 top-1/2 -translate-y-1/2",

                  // Typography
                  "text-muted-foreground",

                  // Interactive & States
                  "hover:text-foreground"
                )}
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearResults}
          disabled={resultsCount === 0}
        >
          <TrashIcon className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      </div>

      {/* Table Area */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-[12px] border-collapse">
          <thead className="bg-muted/50 sticky top-0 border-b border-border z-10">
            <tr className="select-none">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-1/3">Payload</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-1/3">URL</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-20">Status</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground w-20">Length</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground w-20">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {filteredResults.map((result, index) => {
              const isSelected = selectedResult?.id === result.id;
              const hasError = !!result.error;
              
              // Custom soft colors for HTTP statuses
              let statusClass = 'bg-muted text-muted-foreground border-muted-foreground/10';
              if (result.status) {
                if (result.status >= 200 && result.status < 300) {
                  statusClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                } else if (result.status >= 300 && result.status < 400) {
                  statusClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                } else if (result.status >= 400) {
                  statusClass = 'bg-destructive/10 text-destructive border-destructive/20';
                }
              }

              return (
                <tr
                  key={result.id}
                  className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20 text-foreground font-medium' 
                      : hasError 
                      ? 'bg-destructive/5 text-destructive hover:bg-destructive/10' 
                      : ''
                  }`}
                  onClick={() => setSelectedResult(result)}
                >
                  {/* Row Number */}
                  <td className="px-3 py-1.5 text-muted-foreground select-none">{index + 1}</td>
                  
                  {/* Payload values */}
                  <td className="px-3 py-1.5 max-w-0 truncate font-semibold" title={formatPayloadValues(result.payload_values)}>
                    {formatPayloadValues(result.payload_values)}
                  </td>
                  
                  {/* Result URL */}
                  <td className="px-3 py-1.5 max-w-0 truncate text-muted-foreground" title={getResultUrl(result)}>
                    {getResultUrl(result) || '-'}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-3 py-1.5">
                    {result.status ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusClass}`}>
                        {result.status}
                      </span>
                    ) : hasError ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-destructive/15 text-destructive border-destructive/20">
                        Error
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  
                  {/* Response Length */}
                  <td className="px-3 py-1.5 text-right text-muted-foreground">
                    {result.response_length !== undefined ? result.response_length.toLocaleString() : '-'}
                  </td>
                  
                  {/* Response Time */}
                  <td className="px-3 py-1.5 text-right text-muted-foreground">
                    {result.response_time_ms ? `${result.response_time_ms}ms` : '-'}
                  </td>
                </tr>
              );
            })}
            {filteredResults.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-muted-foreground font-sans">
                  {isRunning ? 'Running attack...' : 'No results available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const InvokerResultsPanel = IntruderResultsPanel;

