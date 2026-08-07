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
  // Folder Creation
  onCreateFolder: (name: string) => void | Promise<void>;
  // Action (Upload or Import)
  actionLabel: string;
  actionIcon: React.ReactNode;
  onActionClick: () => void;
  actionDisabled?: boolean;
  // Search and Mode
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
}: FileToolbarProps) {
  const [showFolderInput, setShowFolderInput] = React.useState(false);
  const [folderNameInput, setFolderNameInput] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
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
        "flex flex-col shrink-0",

        // Sizing & Spacing
        "p-3 gap-2",

        // Backgrounds & Borders
        "border-b border-border bg-background/50"
      )}
    >
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between",

          // Sizing & Spacing
          "gap-4"
        )}
      >
        {/* Breadcrumb path */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center overflow-x-auto min-w-0 scrollbar-none",

            // Sizing & Spacing
            "gap-1.5 py-1"
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

              // Visuals & Colors / Interactive & States
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeftIcon className="size-4" />
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
                  {idx > 0 && <CaretRightIcon className="size-3 text-border shrink-0" />}
                  <button
                    onClick={() => !isLast && onNavigateTo(crumb.id)}
                    disabled={isLast || loading}
                    className={cn(
                      // Typography
                      isLast ? 'text-foreground font-semibold' : 'hover:text-foreground hover:underline',

                      // Sizing & Spacing
                      crumb.label ? 'truncate max-w-[160px]' : 'opacity-0'
                    )}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Global Actions */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-2"
          )}
        >
          {/* Create Folder trigger */}
          {showFolderInput ? (
            <form
              onSubmit={handleCreateSubmit}
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5"
              )}
            >
              <Input
                value={folderNameInput}
                onChange={(e) => setFolderNameInput(e.target.value)}
                placeholder="Folder name"
                className={cn(
                  // Sizing & Spacing
                  "w-36 h-7",

                  // Typography
                  "text-xs"
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
                disabled={creating}
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
                className={cn(
                  // Layout & Positioning
                  "shrink-0",

                  // Sizing & Spacing
                  "size-7 p-0"
                )}
                disabled={creating}
              >
                <XIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </form>
          ) : (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setShowFolderInput(true)}
              disabled={loading || actionDisabled}
            >
              <FolderPlusIcon className="mr-1.5 size-3.5" />
              New Folder
            </Button>
          )}

          <Button
            size="xs"
            onClick={onActionClick}
            disabled={loading || actionDisabled}
          >
            {actionIcon}
            {actionLabel}
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={onRefresh}
            disabled={loading || actionDisabled}
            className={cn(
              // Layout & Positioning
              "shrink-0",

              // Sizing & Spacing
              "size-7 p-0"
            )}
          >
            <ArrowClockwiseIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between"
        )}
      >
        {/* Search filtering */}
        <div
          className={cn(
            // Layout & Positioning
            "relative",

            // Sizing & Spacing
            "w-72"
          )}
        >
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files in current directory…"
            className={cn(
              // Sizing & Spacing
              "h-7 w-full pl-8",

              // Typography
              "text-xs"
            )}
            disabled={actionDisabled}
          />
        </div>

        {/* View Mode Toggle */}
        <ButtonGroup>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Interactive & States
              "hover:text-primary",
              viewMode === 'list' && 'text-primary'
            )}
            data-state={viewMode === 'list' ? 'on' : 'off'}
            onClick={() => onViewModeChange('list')}
            title="List view"
            disabled={actionDisabled}
          >
            <ListIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Interactive & States
              "hover:text-primary",
              viewMode === 'grid' && 'text-primary'
            )}
            data-state={viewMode === 'grid' ? 'on' : 'off'}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
            disabled={actionDisabled}
          >
            <SquaresFourIcon className="size-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
