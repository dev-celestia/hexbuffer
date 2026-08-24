import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@celestia-project/ui';
import {
  CaretDownIcon,
  CheckIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHttpSessionStore } from '@/stores/history';
import type { HttpSessionSummary } from '@/types';
import { formatBytes } from './log-table/utils';
import {
  CreateSessionDialog,
  DeleteSessionDialog,
  RenameSessionDialog,
} from './session-dialogs';
import { cn } from '@/lib/utils';

export function SessionSelector() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    isLoading,
    isCreating,
    isDeleting,
    fetchSessions,
    createSession,
    switchSession,
    renameSession,
    deleteSession,
  } = useHttpSessionStore(
    useShallow((state) => ({
      sessions: state.sessions,
      activeSessionId: state.activeSessionId,
      activeSession: state.activeSession,
      isLoading: state.isLoading,
      isCreating: state.isCreating,
      isDeleting: state.isDeleting,
      fetchSessions: state.fetchSessions,
      createSession: state.createSession,
      switchSession: state.switchSession,
      renameSession: state.renameSession,
      deleteSession: state.deleteSession,
    }))
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [renameSessionTarget, setRenameSessionTarget] = React.useState<HttpSessionSummary | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = React.useState<HttpSessionSummary | null>(null);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = React.useCallback(
    async (name: string, description?: string) => {
      await createSession(name, description);
    },
    [createSession]
  );

  const handleRename = React.useCallback(
    async (sessionId: string, newName: string) => {
      await renameSession(sessionId, newName);
    },
    [renameSession]
  );

  const handleDelete = React.useCallback(
    async (sessionId: string) => {
      await deleteSession(sessionId);
    },
    [deleteSession]
  );

  const currentLabel = activeSession?.name || (isLoading ? 'Loading…' : 'Select Session');
  const currentCount = activeSession?.request_count ?? 0;
  const currentSize = activeSession?.total_size_bytes ?? 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "h-7 gap-1.5 px-2.5 max-w-[260px]",

                // Typography
                "font-medium text-xs tracking-tight",

                // Backgrounds & Borders
                "border-border/60 bg-background/80 hover:bg-accent/40 shadow-none",

                // Interactive & States
                "active:scale-[0.98] transition-all duration-150"
              )}
            >
              {/* Apple-style emerald pulse for active session */}
              <span
                className={cn(
                  // Layout & Positioning
                  "relative flex",

                  // Sizing & Spacing
                  "size-2"
                )}
              >
                <span
                  className={cn(
                    // Layout & Positioning
                    "absolute inline-flex",

                    // Sizing & Spacing
                    "size-full",

                    // Backgrounds & Borders
                    "rounded-full bg-emerald-400 opacity-75 animate-ping"
                  )}
                />
                <span
                  className={cn(
                    // Layout & Positioning
                    "relative inline-flex",

                    // Sizing & Spacing
                    "size-2",

                    // Backgrounds & Borders
                    "rounded-full bg-emerald-500"
                  )}
                />
              </span>

              <span
                className={cn(
                  // Typography
                  "truncate font-medium text-foreground text-xs"
                )}
                title={currentLabel}
              >
                {currentLabel}
              </span>

              <Badge
                variant="secondary"
                className={cn(
                  // Sizing & Spacing
                  "h-4 px-1 ml-0.5",

                  // Typography
                  "font-mono text-[10px] font-normal text-muted-foreground",

                  // Backgrounds & Borders
                  "bg-muted/80 rounded"
                )}
              >
                {currentCount}
                {currentSize > 0 ? ` · ${formatBytes(currentSize)}` : ''}
              </Badge>

              <CaretDownIcon
                className={cn(
                  // Sizing & Spacing
                  "size-3",

                  // Typography
                  "text-muted-foreground shrink-0"
                )}
              />
            </Button>
          }
        />
        <DropdownMenuContent
          align="start"
          className={cn(
            // Sizing & Spacing
            "w-72 p-1",

            // Backgrounds & Borders
            "shadow-lg"
          )}
        >
          <DropdownMenuGroup>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between",

                // Sizing & Spacing
                "px-2 py-1.5"
              )}
            >
              <DropdownMenuLabel
                className={cn(
                  // Sizing & Spacing
                  "p-0",

                  // Typography
                  "text-[11px] uppercase tracking-wider font-semibold text-muted-foreground"
                )}
              >
                Sessions ({sessions.length})
              </DropdownMenuLabel>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setCreateOpen(true)}
                title="New Session"
                className={cn(
                  // Sizing & Spacing
                  "size-5",

                  // Typography
                  "text-primary hover:text-primary",

                  // Backgrounds & Borders
                  "hover:bg-primary/10 rounded"
                )}
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </div>

            <DropdownMenuSeparator />

            <div
              className={cn(
                // Sizing & Spacing
                "max-h-60 overflow-y-auto"
              )}
            >
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={cn(
                      // Layout & Positioning
                      "group flex items-center justify-between",

                      // Sizing & Spacing
                      "gap-2 px-2 py-1.5",

                      // Typography
                      "text-xs",

                      // Backgrounds & Borders
                      "rounded-md cursor-pointer",
                      isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50 text-foreground"
                    )}
                    onClick={() => switchSession(session.id)}
                  >
                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center min-w-0 flex-1",

                        // Sizing & Spacing
                        "gap-1.5"
                      )}
                    >
                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex items-center justify-center",

                          // Sizing & Spacing
                          "size-3.5 shrink-0"
                        )}
                      >
                        {isActive ? (
                          <CheckIcon className="size-3.5 text-emerald-500 font-bold" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>

                      <div
                        className={cn(
                          // Layout & Positioning
                          "flex flex-col min-w-0 flex-1"
                        )}
                      >
                        <span className="truncate text-xs">{session.name}</span>
                        <span
                          className={cn(
                            // Typography
                            "text-[10px] text-muted-foreground"
                          )}
                        >
                          {session.request_count} reqs
                          {session.total_size_bytes > 0
                            ? ` · ${formatBytes(session.total_size_bytes)}`
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        // Layout & Positioning
                        "flex items-center",

                        // Sizing & Spacing
                        "gap-0.5 opacity-0 group-hover:opacity-100",

                        // Interactive & States
                        "transition-opacity"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameSessionTarget(session);
                        }}
                        title="Rename Session"
                        className="size-5 text-muted-foreground hover:text-foreground"
                      >
                        <PencilSimpleIcon className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionTarget(session);
                        }}
                        title="Delete Session"
                        className="size-5 text-muted-foreground hover:text-destructive"
                      >
                        <TrashIcon className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setCreateOpen(true)}
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-2 px-2 py-1.5",

                // Typography
                "text-xs font-medium text-primary",

                // Interactive & States
                "cursor-pointer"
              )}
            >
              <PlusIcon className="size-3.5" />
              <span>Create New Session</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSessionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />

      <RenameSessionDialog
        open={Boolean(renameSessionTarget)}
        onOpenChange={(open) => {
          if (!open) setRenameSessionTarget(null);
        }}
        session={renameSessionTarget}
        onSubmit={handleRename}
      />

      <DeleteSessionDialog
        open={Boolean(deleteSessionTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteSessionTarget(null);
        }}
        session={deleteSessionTarget}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
