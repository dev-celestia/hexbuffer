import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@celestia-project/ui';
import { PlusIcon, TargetIcon, ArrowLeftIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { TargetSearchList } from './target-search-list';
import { TargetDialogForm } from './target-dialog-form';
import { useTargetSelectorDialog } from './hooks';

export function TargetSelectorDialog({
  externalOpen,
  onExternalOpenChange,
}: {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
} = {}) {
  const isExternallyControlled = externalOpen !== undefined && onExternalOpenChange !== undefined;

  const {
    open,
    handleOpenChange,
    showCreateNew,
    editingTarget,
    handleCreateNew,
    handleEditTarget,
    handleCancelCreate,
    handleSaveTarget,
    filteredCount,
    searchQuery,
    setSearchQuery,
    filteredTargets,
    targetCount,
    handleSelectTarget,
  } = useTargetSelectorDialog({ externalOpen, onExternalOpenChange });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isExternallyControlled && (
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <TargetIcon className="text-primary" />
              <span>Manage Target</span>
            </Button>
          }
        />
      )}
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Sizing & Spacing
          "sm:max-w-xl gap-4 p-5"
        )}
      >
        {showCreateNew ? (
          <>
            <DialogHeader>
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleCancelCreate}
                  aria-label="Back to target list"
                >
                  <ArrowLeftIcon />
                </Button>
                <DialogTitle>
                  {editingTarget ? 'Edit Target' : 'Create New Target'}
                </DialogTitle>
              </div>
              <DialogDescription
                className={cn(
                  // Sizing & Spacing
                  "pl-7"
                )}
              >
                {editingTarget
                  ? 'Update target parameters and active domain scope rules.'
                  : 'Define a target name and domain scope patterns to start monitoring.'}
              </DialogDescription>
            </DialogHeader>
            <TargetDialogForm
              key={editingTarget?.id ?? 'new-target'}
              target={editingTarget}
              onCancel={handleCancelCreate}
              onSaved={handleSaveTarget}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className={cn(
                  // Layout & Positioning
                  "flex items-center",

                  // Sizing & Spacing
                  "gap-2"
                )}
              >
                <TargetIcon className="text-primary" />
                <span>Target Scope Selector</span>
              </DialogTitle>
              <DialogDescription>
                Select an existing target to activate monitoring scope, or define a new target.
              </DialogDescription>
            </DialogHeader>

            <TargetSearchList
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              targetCount={targetCount}
              filteredTargets={filteredTargets}
              onSelectTarget={handleSelectTarget}
              onEditTarget={handleEditTarget}
            />

            <DialogFooter
              className={cn(
                // Layout & Positioning
                "flex items-center justify-between sm:justify-between",

                // Sizing & Spacing
                "pt-2",

                // Backgrounds & Borders
                "border-t border-border/40"
              )}
            >
              <span
                className={cn(
                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                Showing <span className="font-semibold text-foreground">{filteredCount}</span> of{' '}
                {targetCount}
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateNew}
              >
                <PlusIcon />
                <span>Create New Target</span>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
