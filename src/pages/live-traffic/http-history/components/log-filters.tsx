import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Input,
} from '@celestia-project/ui';
import { useEffect, useRef, useState } from 'react';
import { XIcon, TrashIcon, SpinnerGapIcon, PlayIcon, PauseIcon, TargetIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrawlStatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';

import { openTargetSelector } from '@/triggers';

import { invoke } from '@tauri-apps/api/core';
import {
  type HistoryFilterState,
  useHttpHistoryQueryStore,
  useBlacklistStore,
  useHighlightStore,
} from '@/stores/history';
import { useShallow } from 'zustand/react/shallow';
import { METHOD_FILTERS, STATUS_FILTERS } from './log-table/utils';

interface LogFiltersProps {
  filter?: HistoryFilterState;
  onFilterChange?: (filter: HistoryFilterState) => void;
  onClearFilters?: () => void;
  clearCalls?: () => void;
}

export function LogFilters({
  filter: filterProp,
  onFilterChange,
  onClearFilters,
  clearCalls: clearCallsProp,
}: LogFiltersProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const isStreamManuallyPaused = useHttpHistoryQueryStore((s) => s.isStreamManuallyPaused);

  const {
    filter: storeFilter,
    clearFilters: storeClearFilters,
    triggerRefresh,
    setSelectedCallId: storeSetSelectedCallId,
  } = useHttpHistoryQueryStore(
    useShallow((state) => ({
      filter: state.filter,
      clearFilters: state.clearFilters,
      triggerRefresh: state.triggerRefresh,
      setSelectedCallId: state.setSelectedCallId,
    }))
  );

  const setFilter = onFilterChange ?? useHttpHistoryQueryStore.getState().setFilter;
  const filter = filterProp ?? storeFilter;
  const clearFilters = onClearFilters ?? storeClearFilters;

  const [localSearch, setLocalSearch] = useState(filter.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(filter.search);
  }, [filter.search]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter({ ...filter, search: val });
    }, 200);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilter({ ...filter, search: '' });
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearCalls = clearCallsProp ?? (async () => {
    setIsClearing(true);
    try {
      await invoke('clear_proxy_all');
      storeSetSelectedCallId(null);
      triggerRefresh();
      toast.success('History cleared successfully');
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setIsClearing(false);
      setClearDialogOpen(false);
    }
  });

  const hasActiveFilters =
    filter.search || filter.pathFilter || filter.methods.size > 0 || filter.statusCodes.size > 0;

  const blacklistRules = useBlacklistStore((s) => s.rules);
  const removeBlacklistRule = useBlacklistStore((s) => s.removeRule);

  const highlightedHosts = useHighlightStore((s) => s.highlightedHosts);
  const removeHighlight = useHighlightStore((s) => s.removeHighlight);

  return (
    <div className="bg-muted p-1 px-2">
      <div className="flex items-center gap-2 justify-between w-full">
        <div className='flex gap-2 items-center'>
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
              placeholder="Search URL, host, method, body…"
              className={cn(
                // Sizing & Spacing
                "h-7 w-48 pl-7 pr-7 text-xs bg-background",

                // Backgrounds & Borders
                "border-input",

                // Interactive & States
                "focus:w-64 transition-all duration-150"
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

          <span className="text-xs text-muted-foreground">Method:</span>
          <Combobox
            multiple
            value={Array.from(filter.methods)}
            onValueChange={(values) =>
              setFilter({ ...filter, methods: new Set(values as string[]) })
            }
          >
            <ComboboxInput
              placeholder="Method..."
              showTrigger
              showClear
              className="h-7 text-xs w-32 bg-background"
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No method</ComboboxEmpty>
                {METHOD_FILTERS.map((method) => (
                  <ComboboxItem key={method} value={method}>
                    {method}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          <span className="text-xs text-muted-foreground">Status:</span>
          <Combobox
            multiple
            value={Array.from(filter.statusCodes)}
            onValueChange={(values) =>
              setFilter({ ...filter, statusCodes: new Set(values as string[]) })
            }
          >
            <ComboboxInput
              placeholder="Status..."
              showTrigger
              showClear
              className="h-7 text-xs w-32 bg-background"
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No status</ComboboxEmpty>
                {STATUS_FILTERS.map((status) => (
                  <ComboboxItem key={status.label} value={status.label}>
                    {status.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className='flex gap-2 items-center'>
          {isStreamManuallyPaused && (
            <CrawlStatusBadge status="paused" />
          )}

          {hasActiveFilters && (
            <Button size="xs" variant="destructive" onClick={clearFilters}>
              <XIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          <Button
            size="xs"
            variant={"secondary"}
            onClick={() => {
              const store = useHttpHistoryQueryStore.getState();
              const wasPaused = store.isStreamManuallyPaused;
              store.setStreamManuallyPaused(!wasPaused);
              if (wasPaused) store.triggerRefresh();
            }}
          >
            {isStreamManuallyPaused
              ? <><PlayIcon className="size-3" /> Resume</>
              : <><PauseIcon className="size-3" /> Pause</>}
          </Button>

          <Button size="xs" variant={"secondary"} onClick={openTargetSelector}>
            <TargetIcon className="size-3" />
            Target
          </Button>

          <Button size="xs" variant={"destructive"} onClick={() => setClearDialogOpen(true)}>
            <TrashIcon className="size-3" />
          </Button>
        </div>
      </div>

      {blacklistRules.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground shrink-0">Hidden:</span>
          {blacklistRules.map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-600 dark:text-red-400"
            >
              <span className="max-w-[200px] truncate">
                {rule.host}{rule.path ? rule.path : '/*'}
              </span>
              <button
                className="ml-0.5 hover:text-red-800 dark:hover:text-red-200 shrink-0"
                onClick={() => removeBlacklistRule(rule.id)}
                title="Remove blacklist rule"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {Object.keys(highlightedHosts).length > 0 && (
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground shrink-0">Highlights:</span>
          {Object.entries(highlightedHosts).map(([key, color]) => {
            const separatorIdx = key.indexOf('|');
            const host = separatorIdx >= 0 ? key.slice(0, separatorIdx) : key;
            const path = separatorIdx >= 0 ? key.slice(separatorIdx + 1) : '';
            const display = path ? `${host}${path}` : host;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]"
                style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
              >
                <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="max-w-[200px] truncate">{display}</span>
                <button
                  className="ml-0.5 opacity-60 hover:opacity-100 shrink-0"
                  onClick={() => removeHighlight(host, path)}
                  title="Remove highlight"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All History ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all logged history requests and responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <Button
              size="xs"
              variant="destructive"
              disabled={isClearing}
              onClick={clearCalls}
            >
              {isClearing ? (
                <>
                  <SpinnerGapIcon className="mr-1 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Clear All'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
