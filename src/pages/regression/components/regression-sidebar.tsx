import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { Button, ScrollArea } from '@celestia-project/ui';
import { cn } from '@/lib/utils';
import type { RegressionScript } from '../types';
import { RUN_STATUS_META } from '../constants';

interface RegressionSidebarProps {
  scripts: RegressionScript[];
  activeScriptId: string | null;
  activeRunScriptId: string | null;
  activeRunStatus: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function RegressionSidebar({
  scripts,
  activeScriptId,
  activeRunScriptId,
  activeRunStatus,
  onSelect,
  onCreate,
  onDelete,
}: RegressionSidebarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col min-h-0 h-full select-none',

        // Backgrounds & Borders
        'bg-card'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between shrink-0',

          // Sizing & Spacing
          'px-3 py-2',

          // Backgrounds & Borders
          'border-b'
        )}
      >
        <span
          className={cn(
            // Typography
            'text-[11px] font-bold uppercase tracking-wide text-muted-foreground'
          )}
        >
          Test Cases
        </span>
        <Button variant="ghost" size="icon-sm" onClick={onCreate} title="New test case">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-1.5 flex flex-col gap-1">
          {scripts.length === 0 && (
            <p
              className={cn(
                // Sizing & Spacing
                'px-2 py-4',

                // Typography
                'text-[11px] text-muted-foreground text-center'
              )}
            >
              No test cases yet. Create one to start writing regression scripts.
            </p>
          )}
          {scripts.map((script) => {
            const isActive = script.id === activeScriptId;
            const isRunningHere =
              script.id === activeRunScriptId && activeRunStatus === 'running';
            const runMeta =
              script.id === activeRunScriptId && activeRunStatus
                ? RUN_STATUS_META[activeRunStatus]
                : null;
            return (
              <button
                key={script.id}
                onClick={() => onSelect(script.id)}
                className={cn(
                  // Layout & Positioning
                  'group flex flex-col items-start text-left w-full',

                  // Sizing & Spacing
                  'px-2.5 py-2 rounded-md',

                  // Typography
                  'text-[12px]',

                  // Backgrounds & Borders
                  'border border-transparent',

                  // Interactive & States
                  'transition-colors cursor-pointer',
                  isActive
                    ? 'bg-muted border-border/60'
                    : 'hover:bg-muted/50'
                )}
              >
                <span
                  className={cn(
                    // Layout & Positioning
                    'flex items-center gap-1.5 w-full',

                    // Typography
                    'font-medium truncate',

                    // Interactive & States
                    isActive ? 'text-foreground' : 'text-foreground/80'
                  )}
                >
                  <span
                    className={cn(
                      // Sizing & Spacing
                      'h-1.5 w-1.5 rounded-full shrink-0',

                      // Backgrounds & Borders
                      runMeta ? runMeta.dotClass : 'bg-border'
                    )}
                  />
                  <span className="truncate">{script.name}</span>
                </span>
                <span
                  className={cn(
                    // Sizing & Spacing
                    'mt-0.5 pl-3 w-full flex items-center justify-between gap-2',

                    // Typography
                    'text-[10px] text-muted-foreground'
                  )}
                >
                  <span className="truncate">{script.targetUrl || 'No target'}</span>
                  <TrashIcon
                    className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(script.id);
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
