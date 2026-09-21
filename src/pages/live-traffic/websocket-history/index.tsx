import * as React from 'react';
import {
  Button,
  Card,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@celestia-project/ui';
import { TabbedPageLayout } from '@/layout/tabs-layout/tabbed-page-layout';

import { TargetSelectorDialog } from '@/pages/live-traffic/components/target-selector';
import { useWebSocketHistoryPage } from './hooks/use-websocket-history-page';
import { useWebSocketSearch } from './hooks/use-websocket-search';
import { useWebSocketHistoryQueryStore } from '@/stores/history';
import {
  TrashIcon,
  PlayIcon,
  PauseIcon,
  TargetIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';

import { SessionSelector } from '@/pages/live-traffic/http-history/components/session';
import { openTargetSelector } from '@/triggers';
import { cn } from '@/lib/utils';
import { ClearHistoryDialog } from './components/clear-history-dialog';

export function WebSocketHistoryPage() {
  const page = useWebSocketHistoryPage();
  const search = useWebSocketSearch();
  const isWsPaused = useWebSocketHistoryQueryStore((s) => s.isStreamManuallyPaused);
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);

  const togglePause = () => {
    const store = useWebSocketHistoryQueryStore.getState();
    const wasPaused = store.isStreamManuallyPaused;
    store.setStreamManuallyPaused(!wasPaused);
    if (wasPaused) store.triggerRefresh();
  };

  return (
    <>
      <TabbedPageLayout
        tabs={page.tabs}
        activeTabId={page.activeTabId}
        onTabChange={page.setActiveTabId}
        onTabClose={page.removeTab}
        className={cn(
          // Layout & Positioning
          'flex flex-col min-h-0',

          // Sizing & Spacing
          'h-full'
        )}
        contentClassName={cn(
          // Layout & Positioning
          'flex flex-col flex-1 min-h-0 overflow-hidden',

          // Sizing & Spacing
          'm-2',

          // Backgrounds & Borders
          'border rounded-lg bg-background'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center justify-between shrink-0 select-none overflow-x-auto min-w-0',

            // Sizing & Spacing
            'p-1 px-2 gap-2',

            // Backgrounds & Borders
            'border-b bg-muted/20'
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              'flex items-center',

              // Sizing & Spacing
              'gap-2'
            )}
          >
            <SessionSelector />

            <InputGroup
              className={cn(
                // Sizing & Spacing
                'w-48',

                // Interactive & States
                'transition-all duration-150 focus-within:w-64'
              )}
            >
              <InputGroupAddon align="inline-start">
                <MagnifyingGlassIcon
                  className={cn(
                    // Sizing & Spacing
                    'size-3.5',

                    // Typography
                    'text-muted-foreground'
                  )}
                  aria-hidden="true"
                />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search.localSearch}
                onChange={(e) => search.handleSearchChange(e.target.value)}
                placeholder="Search URL, host, path…"
                aria-label="Search WebSocket connections"
                className={cn(
                  // Sizing & Spacing
                  'h-7 text-xs'
                )}
              />
              {search.localSearch && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    onClick={search.handleClearSearch}
                    aria-label="Clear search"
                  >
                    <XIcon className="size-3" aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              'flex items-center',

              // Sizing & Spacing
              'gap-1'
            )}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={isWsPaused ? 'Resume stream' : 'Pause stream'}
                    aria-pressed={isWsPaused}
                    className={cn(
                      // Layout & Positioning
                      'shrink-0',

                      // Sizing & Spacing
                      'h-7 text-xs gap-1.5',

                      // Interactive & States
                      isWsPaused && 'bg-amber-500/10 hover:bg-amber-500/15'
                    )}
                    onClick={togglePause}
                  >
                    {isWsPaused ? (
                      <>
                        <PlayIcon className="size-3.5 text-amber-600 dark:text-amber-400" /> Resume
                      </>
                    ) : (
                      <>
                        <PauseIcon className="size-3.5 text-muted-foreground" /> Pause
                      </>
                    )}
                  </Button>
                }
              />
              <TooltipContent side="bottom" sideOffset={6}>
                {isWsPaused
                  ? 'Live updates are paused. Click to resume capturing new messages.'
                  : 'Freeze the view so incoming messages do not shift what you are reading.'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Configure capture targets"
                    className={cn(
                      // Layout & Positioning
                      'shrink-0',

                      // Sizing & Spacing
                      'h-7 text-xs gap-1.5'
                    )}
                    onClick={openTargetSelector}
                  >
                    <TargetIcon className="size-3.5 text-muted-foreground" />
                    Target
                  </Button>
                }
              />
              <TooltipContent side="bottom" sideOffset={6}>
                Choose which hosts and scopes are captured.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Clear all WebSocket history"
                    onClick={() => setClearDialogOpen(true)}
                    className={cn(
                      // Layout & Positioning
                      'shrink-0',

                      // Sizing & Spacing
                      'h-7 text-xs gap-1.5',

                      // Typography
                      'text-destructive hover:text-destructive hover:bg-destructive/10'
                    )}
                  >
                    <TrashIcon className="size-3.5" />
                    Clear All
                  </Button>
                }
              />
              <TooltipContent side="bottom" sideOffset={6}>
                Permanently delete every captured connection and message.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card
          className={cn(
            // Layout & Positioning
            'flex flex-col flex-1 overflow-hidden',

            // Sizing & Spacing
            '!py-0',

            // Backgrounds & Borders
            'rounded-none border-0 shadow-none'
          )}
        >
          {page.websocketView}
        </Card>
      </TabbedPageLayout>

      <TargetSelectorDialog
        externalOpen={page.isTargetSelectorOpen}
        onExternalOpenChange={(open) => {
          if (!open) page.closeTargetSelector();
        }}
      />

      <ClearHistoryDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen} />
    </>
  );
}
