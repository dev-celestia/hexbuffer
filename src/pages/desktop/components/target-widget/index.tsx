import { Badge, Button } from '@celestia-project/ui';
import {
  PlusIcon,
  ArrowLeftIcon,
  GearIcon,
  CaretDownIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useTargetWidget } from './hooks/use-target-widget';
import { TargetSearchList } from '@/pages/live-traffic/components/target-selector/target-search-list';
import { TargetDialogForm } from '@/pages/live-traffic/components/target-selector/target-dialog-form';
import * as React from 'react';

export function TargetWidget() {
  const [showList, setShowList] = React.useState(true);

  const {
    showCreate,
    editingTarget,
    searchQuery,
    setSearchQuery,
    targetCount,
    filteredTargets,
    filteredCount,
    activeTarget,
    handleSelectTarget,
    handleCreateNew,
    handleEditTarget,
    handleCancelCreate,
    handleSaveTarget,
  } = useTargetWidget();

  return (
    <div
      className={cn(
        // Layout & Positioning
        'flex flex-col select-none',

        // Sizing & Spacing
        'p-3 gap-3',

        // Backgrounds & Borders
        'rounded-md border bg-muted/60 backdrop-blur-md',

        // Interactive & States
        'transition-shadow duration-200 hover:shadow-md'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between'
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',

            // Sizing & Spacing
            'gap-1.5'
          )}
        >
          <span
            className={cn(
              // Typography
              'text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase'
            )}
          >
            Target Scope
          </span>
        </div>

        {/* Active indicator + count */}
        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',

            // Sizing & Spacing
            'gap-1.5'
          )}
        >
          {targetCount > 0 && (
            <Badge
              variant="outline"
              className={cn(
                // Typography
                'text-[10px] font-normal',

                // Backgrounds & Borders
                'border-border/50'
              )}
            >
              {targetCount}
            </Badge>
          )}

          {/* Status dot */}
          <span className="relative flex h-2 w-2">
            {activeTarget ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/35" />
            )}
          </span>
        </div>
      </div>

      {/* Active target info row */}
      <div
        className={cn(
          // Layout & Positioning
          'flex items-center justify-between',

          // Sizing & Spacing
          'gap-2 p-1.5',

          // Backgrounds & Borders
          'rounded-md border border-border/40 bg-background/50'
        )}
      >
        <div className="flex-1 min-w-0 px-1">
          <p
            className={cn(
              // Typography
              'text-[10px] text-muted-foreground font-medium uppercase font-mono tracking-tight leading-none mb-0.5'
            )}
          >
            Active Target
          </p>
          {activeTarget ? (
            <p
              className={cn(
                // Typography
                'text-xs font-semibold truncate text-foreground/90'
              )}
              title={activeTarget.name}
            >
              {activeTarget.name}
            </p>
          ) : (
            <p
              className={cn(
                // Typography
                'text-xs text-muted-foreground/60 italic'
              )}
            >
              None selected
            </p>
          )}
        </div>

        <div
          className={cn(
            // Layout & Positioning
            'flex items-center',

            // Sizing & Spacing
            'gap-1'
          )}
        >
          {activeTarget && (
            <span
              className={cn(
                // Sizing & Spacing
                'max-w-[80px]',

                // Typography
                'text-[9px] font-mono text-muted-foreground/70 truncate'
              )}
            >
              {activeTarget.scope[0]}
              {activeTarget.scope.length > 1 && ` +${activeTarget.scope.length - 1}`}
            </span>
          )}
        </div>
      </div>

      {/* Collapsible target list + management */}
      <div
        className={cn(
          // Layout & Positioning
          'overflow-hidden',

          // Backgrounds & Borders
          'border border-border/40 rounded-md bg-background/25',

          // Interactive & States
          'transition-all duration-200'
        )}
      >
        <button
          type="button"
          onClick={() => setShowList(!showList)}
          className={cn(
            // Layout & Positioning
            'w-full flex items-center justify-between text-left select-none',

            // Sizing & Spacing
            'px-2.5 py-1.5',

            // Interactive & States
            'hover:bg-muted/40 transition-colors duration-150 cursor-pointer'
          )}
        >
          <span
            className={cn(
              // Layout & Positioning
              'flex items-center',

              // Sizing & Spacing
              'gap-1.5',

              // Typography
              'text-[10px] uppercase font-mono font-bold text-muted-foreground'
            )}
          >
            <GearIcon className="size-3.5" />
            {showCreate
              ? editingTarget
                ? 'Edit Target'
                : 'New Target'
              : 'Manage Targets'}
          </span>
          <CaretDownIcon
            className={cn(
              // Sizing & Spacing
              'size-3',

              // Typography
              'text-muted-foreground',

              // Interactive & States
              'transition-transform duration-200',
              showList ? 'rotate-180' : ''
            )}
          />
        </button>

        {showList && (
          <div
            className={cn(
              // Layout & Positioning
              'flex flex-col',

              // Sizing & Spacing
              'p-2 gap-2',

              // Backgrounds & Borders
              'border-t border-border/30 bg-background/10'
            )}
          >
            {showCreate ? (
              <>
                {/* Back button row */}
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex items-center',

                    // Sizing & Spacing
                    'gap-1.5 mb-0.5'
                  )}
                >
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleCancelCreate}
                    className={cn(
                      // Sizing & Spacing
                      'h-5 w-5 rounded-full shrink-0',

                      // Typography
                      'text-muted-foreground',

                      // Interactive & States
                      'hover:text-foreground active:scale-95 transition-all'
                    )}
                    aria-label="Back to target list"
                  >
                    <ArrowLeftIcon className="h-3 w-3" />
                  </Button>
                  <span
                    className={cn(
                      // Typography
                      'text-[10px] text-muted-foreground font-mono uppercase font-semibold'
                    )}
                  >
                    {editingTarget ? 'Edit Target' : 'Create Target'}
                  </span>
                </div>

                <TargetDialogForm
                  key={editingTarget?.id ?? 'new-target'}
                  target={editingTarget}
                  onCancel={handleCancelCreate}
                  onSaved={handleSaveTarget}
                />
              </>
            ) : (
              <>
                <TargetSearchList
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  targetCount={targetCount}
                  filteredTargets={filteredTargets}
                  onSelectTarget={handleSelectTarget}
                  onEditTarget={handleEditTarget}
                  listHeight="h-[110px]"
                />

                {/* Footer */}
                <div
                  className={cn(
                    // Layout & Positioning
                    'flex items-center justify-between',

                    // Sizing & Spacing
                    'pt-1.5 mt-0.5',

                    // Backgrounds & Borders
                    'border-t border-border/30'
                  )}
                >
                  <span
                    className={cn(
                      // Typography
                      'text-[10px] text-muted-foreground'
                    )}
                  >
                    <span className="font-semibold text-foreground">{filteredCount}</span> of {targetCount}
                  </span>
                  <Button
                    variant="default"
                    size="xs"
                    onClick={handleCreateNew}
                    className={cn(
                      // Sizing & Spacing
                      'h-6 px-2',

                      // Typography
                      'text-[10px]',

                      // Interactive & States
                      'gap-1 active:scale-[0.98] transition-all'
                    )}
                  >
                    <PlusIcon className="h-3 w-3" />
                    New Target
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
