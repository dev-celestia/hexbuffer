import { Button, ButtonGroup, Input } from '@celestia-project/ui';
import * as React from 'react';
import {
  CaretRightIcon,
  FolderPlusIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XIcon,
  ListIcon,
  SquaresFourIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

export interface BreadcrumbCrumb {
  label: string;
  id: string;
}

interface FileToolbarProps {
  breadcrumbs: BreadcrumbCrumb[];
  isAtRoot: boolean;
  onNavigateUp: () => void;
  onNavigateTo: (id: string) => void;
  onCreateFolder: (name: string) => void | Promise<void>;
  actionLabel: string;
  actionIcon: React.ReactNode;
  onActionClick: () => void;
  actionDisabled?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  loading: boolean;
}

export function FileToolbar({
  breadcrumbs,
  isAtRoot,
  onNavigateUp,
  onNavigateTo,
  onCreateFolder,
  actionLabel,
  actionIcon,
  onActionClick,
  actionDisabled = false,
  searchQuery,
  onSearchChange,
  onRefresh,
  viewMode,
  onViewModeChange,
  loading,
}: Readonly<FileToolbarProps>) {
  const [showFolderInput, setShowFolderInput] = React.useState(false);
  const [folderNameInput, setFolderNameInput] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  // Collapse deep paths to "root … tail" instead of relying on invisible scrolling
  const MAX_VISIBLE_CRUMBS = 4;
  const crumbsCollapsed = breadcrumbs.length > MAX_VISIBLE_CRUMBS;
  const visibleCrumbs: (BreadcrumbCrumb | null)[] = crumbsCollapsed
    ? [breadcrumbs[0], null, ...breadcrumbs.slice(-(MAX_VISIBLE_CRUMBS - 2))]
    : breadcrumbs;

  const handleCreateSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;
    setCreating(true);
    try {
      await onCreateFolder(folderNameInput.trim());
      setFolderNameInput('');
      setShowFolderInput(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0 select-none",

        // Sizing & Spacing
        "px-3 py-2 gap-3",

        // Backgrounds & Borders
        "border-b border-border bg-muted/20"
      )}
    >
      {/* Left: Breadcrumbs Path & Navigate Up */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center overflow-hidden min-w-0",

          // Sizing & Spacing
          "gap-1"
        )}
      >
        <Button
          size="sm"
          variant="quiet"
          onClick={onNavigateUp}
          disabled={isAtRoot || loading}
          className={cn(
            // Sizing & Spacing
            "size-7 p-0",

            // Interactive & States
            "active:scale-[0.97]"
          )}
          title="Navigate up"
        >
          <ArrowLeftIcon className="size-3.5" />
        </Button>

        <div
          className={cn(
            // Layout & Positioning
            "flex items-center min-w-0 whitespace-nowrap",

            // Sizing & Spacing
            "gap-1",

            // Typography
            "text-xs font-medium text-muted-foreground"
          )}
        >
          {visibleCrumbs.map((crumb, idx) => {
            const isLast = idx === visibleCrumbs.length - 1;
            if (!crumb) {
              return (
                <React.Fragment key={`ellipsis-${idx}`}>
                  {idx > 0 && (
                    <CaretRightIcon className="size-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <span
                    className={cn(
                      // Sizing & Spacing
                      "px-0.5 shrink-0",

                      // Typography & Colors
                      "text-muted-foreground/60"
                    )}
                    title={`${breadcrumbs.length - (MAX_VISIBLE_CRUMBS - 1)} hidden levels`}
                  >
                    …
                  </span>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={`${crumb.id}-${idx}`}>
                {idx > 0 && <CaretRightIcon className="size-3 text-muted-foreground/40 shrink-0" />}
                <button
                  type="button"
                  onClick={() => !isLast && onNavigateTo(crumb.id)}
                  disabled={isLast || loading}
                  title={crumb.label}
                  className={cn(
                    // Sizing & Spacing
                    "truncate max-w-[180px] px-1.5 py-0.5 rounded",

                    // Typography
                    isLast
                      ? "text-foreground font-semibold cursor-default"
                      : "hover:text-foreground hover:bg-muted/40 cursor-pointer",

                    // Interactive & States
                    "transition-colors"
                  )}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right: Search, Actions, View Toggle, Refresh */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center shrink-0",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        {/* Create Folder form or trigger */}
        {showFolderInput ? (
          <form
            onSubmit={handleCreateSubmit}
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <Input textSize="xs"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              placeholder="Folder name"
              className={cn(
                // Sizing & Spacing
                "w-32",

                // Typography
                "bg-background"
              )}
              disabled={creating}
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className={cn(
                // Sizing & Spacing
                "size-7 p-0"
              )}
              disabled={creating || !folderNameInput.trim()}
            >
              <CheckIcon className="size-3.5 text-primary" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowFolderInput(false);
                setFolderNameInput('');
              }}
              disabled={creating}
            >
              <XIcon className="size-3.5" />
            </Button>
          </form>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFolderInput(true)}
            disabled={loading || actionDisabled}
          >
            <FolderPlusIcon className="size-3.5" />
            <span>New Folder</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="default"
          onClick={onActionClick}
          disabled={loading || actionDisabled}
        >
          {actionIcon}
          <span>{actionLabel}</span>
        </Button>

        {/* View Mode Toggle ButtonGroup */}
        <ButtonGroup>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Interactive & States
              "hover:text-primary",
              viewMode === 'list' && "text-primary bg-muted/60"
            )}
            data-state={viewMode === 'list' ? 'on' : 'off'}
            onClick={() => onViewModeChange('list')}
            title="List view"
            disabled={actionDisabled}
          >
            <ListIcon className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Interactive & States
              "hover:text-primary",
              viewMode === 'grid' && "text-primary bg-muted/60"
            )}
            data-state={viewMode === 'grid' ? 'on' : 'off'}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
            disabled={actionDisabled}
          >
            <SquaresFourIcon className="size-3.5" />
          </Button>
        </ButtonGroup>

         {/* Search input — fixed-width zone so focus never shifts the toolbar */}
        <div
          className={cn(
            // Layout & Positioning
            "relative flex items-center",

            // Sizing & Spacing
            "w-44"
          )}
        >
          <MagnifyingGlassIcon
            className={cn(
              // Layout & Positioning
              "absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

              // Sizing & Spacing
              "size-3.5",

              // Typography & Colors
              "text-muted-foreground"
            )}
          />
          <Input textSize="xs"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files…"
            className={cn(
              // Sizing & Spacing
              "ps-7 pe-7",

              // Typography
              "font-sans bg-background"
            )}
            disabled={actionDisabled}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className={cn(
                // Layout & Positioning
                "absolute end-2 top-1/2 -translate-y-1/2",

                // Typography & Colors
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          disabled={loading || actionDisabled}
          title="Refresh directory"
        >
          <ArrowClockwiseIcon className={cn("size-3.5", loading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}
