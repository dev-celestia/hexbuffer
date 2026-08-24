import * as React from 'react';
import { Button, Input, ScrollArea } from '@celestia-project/ui';
import { GlobeIcon, PlusIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { ContextRecord } from '@/stores/collections';
import { ContextsListItem } from './contexts-list-item';

interface ContextsSidebarProps {
  filteredContexts: ContextRecord[];
  activeContextId: string | null;
  editingContextId: string | null;
  deletingContextId: string | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onStartCreate: () => void;
  onStartEdit: (ctx: ContextRecord) => void;
  onSetActive: (ctx: ContextRecord) => void;
  onDuplicate: (ctx: ContextRecord) => void;
  onStartDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  getVariablesSummary: (ctx: ContextRecord) => string;
}

export function ContextsSidebar({
  filteredContexts,
  activeContextId,
  editingContextId,
  deletingContextId,
  searchQuery,
  onSearchQueryChange,
  onStartCreate,
  onStartEdit,
  onSetActive,
  onDuplicate,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
  getVariablesSummary,
}: ContextsSidebarProps) {
  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col shrink-0 min-h-0',
        // Sizing & Spacing
        'w-72',
        // Backgrounds & Borders
        'bg-muted/20',
      )}
    >
      {/* Sidebar Header */}
      <div
        className={cn(
          // Layout & Positioning
          'flex flex-col shrink-0 border-b border-border',
          // Sizing & Spacing
          'p-3 gap-2',
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center justify-between',
          )}
        >
          <span
            className={cn(
              // Typography
              'text-xs font-semibold tracking-tight text-foreground',
            )}
          >
            Environments
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={onStartCreate}
            title="Create Environment"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <Input
          placeholder="Search environments..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>

      {/* Environments List */}
      <ScrollArea className="flex-1">
        <div
          className={cn(
            // Sizing & Spacing
            'p-2 space-y-1',
          )}
        >
          {filteredContexts.map((ctx) => {
            const isActive = activeContextId === ctx.id;
            const isSelected = editingContextId === ctx.id;
            const isDeleting = deletingContextId === ctx.id;

            return (
              <ContextsListItem
                key={ctx.id}
                ctx={ctx}
                isActive={isActive}
                isSelected={isSelected}
                isDeleting={isDeleting}
                summary={getVariablesSummary(ctx)}
                onSelect={() => onStartEdit(ctx)}
                onSetActive={() => onSetActive(ctx)}
                onEdit={() => onStartEdit(ctx)}
                onDuplicate={() => onDuplicate(ctx)}
                onStartDelete={() => onStartDelete(ctx.id)}
                onConfirmDelete={() => onConfirmDelete(ctx.id)}
                onCancelDelete={onCancelDelete}
              />
            );
          })}

          {filteredContexts.length === 0 && (
            <div
              className={cn(
                // Layout & Positioning
                'flex flex-col items-center justify-center text-center',
                // Sizing & Spacing
                'py-12 px-4 gap-2',
                // Typography
                'text-xs text-muted-foreground',
              )}
            >
              <GlobeIcon className="size-8 text-muted-foreground/30 stroke-[1.5]" />
              <span>
                {searchQuery ? 'No matching environments' : 'No environments configured'}
              </span>
              {!searchQuery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartCreate}
                >
                  Add Environment
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
