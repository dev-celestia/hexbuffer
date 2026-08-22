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
          "flex items-center overflow-x-auto min-w-0 scrollbar-none",

          // Sizing & Spacing
          "gap-1"
        )}
      >
        <Button
          size="xs"
          variant="ghost"
          onClick={onNavigateUp}
          disabled={isAtRoot || loading}
          className={cn(
            // Layout & Positioning
            "shrink-0",

            // Sizing & Spacing
            "size-7 p-0",

            // Typography & Colors
            "text-muted-foreground",

            // Interactive & States
            "hover:text-foreground active:scale-[0.97] transition-all"
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
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <CaretRightIcon className="size-3 text-muted-foreground/40 shrink-0" />}
                <button
                  type="button"
                  onClick={() => !isLast && onNavigateTo(crumb.id)}
                  disabled={isLast || loading}
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
            <Input
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              placeholder="Folder name"
              className={cn(
                // Sizing & Spacing
                "w-32 h-7",

                // Typography
                "text-xs bg-background"
              )}
              disabled={creating}
              autoFocus
            />
            <Button
              type="submit"
              size="xs"
              variant="outline"
              className={cn(
                // Layout & Positioning
                "shrink-0",

                // Sizing & Spacing
                "size-7 p-0"
              )}
              disabled={creating || !folderNameInput.trim()}
            >
              <CheckIcon className="size-3.5 text-primary" />
            </Button>
            <Button
              type="button"
              size="xs"
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
            size="xs"
            variant="outline"
            onClick={() => setShowFolderInput(true)}
            disabled={loading || actionDisabled}
          >
            <FolderPlusIcon className="size-3.5" />
            <span>New Folder</span>
          </Button>
        )}

        <Button
          size="xs"
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
            size="xs"
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
            size="xs"
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

         {/* Search input */}
        <div
          className={cn(
            // Layout & Positioning
            "relative flex items-center"
          )}
        >
          <MagnifyingGlassIcon
            className={cn(
              // Layout & Positioning
              "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none",

              // Sizing & Spacing
              "size-3.5",

              // Typography & Colors
              "text-muted-foreground"
            )}
          />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files…"
            className={cn(
              // Sizing & Spacing
              "h-7 w-44 pl-7 pr-7",

              // Typography
              "text-xs font-sans bg-background",

              // Backgrounds & Borders
              "border-input",

              // Interactive & States
              "focus:w-60 transition-all duration-150"
            )}
            disabled={actionDisabled}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className={cn(
                // Layout & Positioning
                "absolute right-2 top-1/2 -translate-y-1/2",

                // Typography & Colors
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>

        <Button
          size="xs"
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
