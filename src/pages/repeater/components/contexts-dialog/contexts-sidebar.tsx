import * as React from 'react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  ScrollArea,
} from '@celestia-project/ui';
import { GlobeIcon, MagnifyingGlassIcon, PlusIcon, XIcon } from '@phosphor-icons/react';
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

/**
 * The environments column.
 *
 * Header and search now match the collections tree on the other side of the app: a 36px band with
 * 24px ghost actions, and an `InputGroup` search box with a clear button. The list previously used
 * `Button size="icon"` for its add action, which carries a raised shadow that made one quiet icon
 * compete with the list below it.
 */
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
}: Readonly<ContextsSidebarProps>) {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex min-h-0 shrink-0 flex-col',

        // Sizing & Spacing
        'w-72',

        // Backgrounds & Borders
        'bg-muted/20'
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center justify-between',

          // Sizing & Spacing
          'h-9 px-2.5',

          // Backgrounds & Borders
          'border-b'
        )}
      >
        <span
          className={cn(
            // Typography
            'text-2xs font-semibold tracking-wide text-muted-foreground uppercase'
          )}
        >
          Environments
        </span>

        <Button
          size="icon-sm"
          variant="quiet"
          onClick={onStartCreate}
          title="New environment"
          aria-label="New environment"
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div
        className={cn(
          // Layout & Positioning
          'flex shrink-0 items-center',

          // Sizing & Spacing
          'px-1.5 py-1.5'
        )}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <MagnifyingGlassIcon />
          </InputGroupAddon>

          <InputGroupInput
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onSearchQueryChange('');
            }}
            placeholder="Search environments"
            aria-label="Search environments"
            spellCheck={false}
            autoComplete="off"
          />

          {isSearching && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                title="Clear search"
                onClick={() => onSearchQueryChange('')}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      <ScrollArea className="flex-1">
        <div
          className={cn(
            // Sizing & Spacing
            'px-1.5 pb-1.5'
          )}
        >
          {filteredContexts.length > 0 ? (
            /* The listbox wraps only the options — the empty state below is not an option, and
               putting it inside would be invalid ARIA. */
            <div role="listbox" aria-label="Environments">
              {filteredContexts.map((ctx) => (
                <ContextsListItem
                  key={ctx.id}
                  ctx={ctx}
                  isActive={activeContextId === ctx.id}
                  isSelected={editingContextId === ctx.id}
                  isDeleting={deletingContextId === ctx.id}
                  summary={getVariablesSummary(ctx)}
                  onSelect={() => onStartEdit(ctx)}
                  onSetActive={() => onSetActive(ctx)}
                  onDuplicate={() => onDuplicate(ctx)}
                  onStartDelete={() => onStartDelete(ctx.id)}
                  onConfirmDelete={() => onConfirmDelete(ctx.id)}
                  onCancelDelete={onCancelDelete}
                />
              ))}
            </div>
          ) : (
            <Empty
              className={cn(
                // Sizing & Spacing
                // Not `h-full`: this sits in the scroll content, which is not a flex parent.
                'py-10'
              )}
            >
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GlobeIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {isSearching ? 'No matches' : 'No environments'}
                </EmptyTitle>
                <EmptyDescription>
                  {isSearching
                    ? `Nothing matches “${searchQuery.trim()}”.`
                    : 'Environments hold the variables your requests substitute.'}
                </EmptyDescription>
              </EmptyHeader>
              {!isSearching && (
                <EmptyContent>
                  <Button leading="tight"
                    variant="outline"
                    size="sm"
                    className={cn(
                      // Sizing & Spacing
                      'px-2'
                    )}
                    onClick={onStartCreate}
                  >
                    <PlusIcon className="size-3.5" />
                    New environment
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
