import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@celestia-project/ui';
import { AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useContextsDialog } from './use-contexts-dialog';
import { ContextsSidebar } from './contexts-sidebar';
import { ContextsEditor } from './contexts-editor';
import { ContextsEmptyState } from './contexts-empty-state';
import type { ContextsDialogProps } from './types';

export type { ContextsDialogProps } from './types';
export { useContextsDialog } from './use-contexts-dialog';

export function ContextsDialog({ open, onOpenChange }: Readonly<ContextsDialogProps>) {
  const {
    editingContext,
    name,
    setName,
    variables,
    isCreating,
    searchQuery,
    setSearchQuery,
    deletingContextId,
    setDeletingContextId,
    activeContextId,
    filteredContexts,
    handleStartCreate,
    handleStartEdit,
    handleCancel,
    handleAddVar,
    handleRemoveVar,
    handleVarChange,
    handleSave,
    handleConfirmDelete,
    handleDuplicate,
    handleSetActive,
    getVariablesSummary,
  } = useContextsDialog({ open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Layout & Positioning
          'flex flex-col overflow-hidden',

          // Sizing & Spacing
          'h-[580px] p-0 sm:max-w-4xl'
        )}
      >
        <DialogTitle className="sr-only">Manage Environments</DialogTitle>
        <div
          className={cn(
            // Layout & Positioning
            'flex min-h-0 flex-1',

            // Backgrounds & Borders
            // `divide-border` was redundant — divide-x already inherits the theme border colour.
            'divide-x'
          )}
        >
          {/* Left Sidebar */}
          <ContextsSidebar
            filteredContexts={filteredContexts}
            activeContextId={activeContextId}
            editingContextId={editingContext?.id || null}
            deletingContextId={deletingContextId}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onStartCreate={handleStartCreate}
            onStartEdit={handleStartEdit}
            onSetActive={handleSetActive}
            onDuplicate={handleDuplicate}
            onStartDelete={(id) => setDeletingContextId(id)}
            onConfirmDelete={(id) => handleConfirmDelete(id)}
            onCancelDelete={() => setDeletingContextId(null)}
            getVariablesSummary={getVariablesSummary}
          />

          {/* Right Details / Editor Column */}
          <div
            className={cn(
              // Layout & Positioning
              'flex min-h-0 flex-1 flex-col'
            )}
          >
            <AnimatePresence mode="wait">
              {isCreating || editingContext ? (
                <ContextsEditor
                  editingContext={editingContext}
                  name={name}
                  onNameChange={setName}
                  variables={variables}
                  onAddVar={handleAddVar}
                  onRemoveVar={handleRemoveVar}
                  onVarChange={handleVarChange}
                  onCancel={handleCancel}
                  onSave={handleSave}
                />
              ) : (
                <ContextsEmptyState
                  onStartCreate={handleStartCreate}
                  onClose={() => onOpenChange(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
