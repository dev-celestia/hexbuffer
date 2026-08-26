import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@celestia-project/ui';
import { PlusIcon } from '@phosphor-icons/react';
import {
  CreateSessionDialog,
  DeleteSessionDialog,
  EditSessionDialog,
  ClearSessionDataDialog,
} from './session-dialogs';
import { SessionSelectorTrigger } from './session-selector-trigger';
import { SessionItemRow } from './session-item-row';
import { useSessionSelector } from './hooks/use-session-selector';
import { cn } from '@/lib/utils';

export function SessionSelector() {
  const {
    sessions,
    activeSessionId,
    isCreating,
    isDeleting,
    createOpen,
    setCreateOpen,
    editSessionTarget,
    setEditSessionTarget,
    deleteSessionTarget,
    setDeleteSessionTarget,
    clearDataSessionTarget,
    setClearDataSessionTarget,
    switchSession,
    handleCreate,
    handleUpdateSession,
    handleDelete,
    handleClearData,
    currentLabel,
    isUnconfigured,
  } = useSessionSelector();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SessionSelectorTrigger
              currentLabel={currentLabel}
              isUnconfigured={isUnconfigured}
            />
          }
        />
        <DropdownMenuContent
          align="start"
          className={cn(
            // Sizing & Spacing
            "min-w-[400px]"
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
              <DropdownMenuLabel>
                Sessions ({sessions.length})
              </DropdownMenuLabel>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCreateOpen(true)}
                title="New Session"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>

            <DropdownMenuSeparator />

            <div
              className={cn(
                // Sizing & Spacing
                "max-h-72 overflow-y-auto"
              )}
            >
              {sessions.map((session) => (
                <SessionItemRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => switchSession(session.id)}
                  onConfigure={() => setEditSessionTarget(session)}
                  onClearData={() => setClearDataSessionTarget(session)}
                />
              ))}
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

      <EditSessionDialog
        open={Boolean(editSessionTarget)}
        onOpenChange={(open) => {
          if (!open) setEditSessionTarget(null);
        }}
        session={editSessionTarget}
        onSubmit={handleUpdateSession}
        onDelete={(session) => {
          setEditSessionTarget(null);
          setDeleteSessionTarget(session);
        }}
      />

      <ClearSessionDataDialog
        open={Boolean(clearDataSessionTarget)}
        onOpenChange={(open) => {
          if (!open) setClearDataSessionTarget(null);
        }}
        session={clearDataSessionTarget}
        onConfirm={handleClearData}
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
