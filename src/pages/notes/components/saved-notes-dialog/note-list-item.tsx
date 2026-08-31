import * as React from 'react';
import {
  Input,
  Button,
  Badge,
} from '@celestia-project/ui';
import {
  TrashIcon,
  CopyIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  ArrowSquareOutIcon,
  XCircleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { extractSnippet, formatRelativeTime } from '../../lib/helpers';
import type { Scratchpad } from '@/stores/scratchpad';

export interface NoteListItemProps {
  note: Scratchpad;
  isOpenInTab: boolean;
  isActiveTab: boolean;
  isDeletingConfirm: boolean;
  isEditing: boolean;
  editingName: string;
  onSetEditingName: (name: string) => void;
  onStartRename: () => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onOpen: () => void;
  onCloseTab: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onCopy: () => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

export function NoteListItem({
  note,
  isOpenInTab,
  isActiveTab,
  isDeletingConfirm,
  isEditing,
  editingName,
  onSetEditingName,
  onStartRename,
  onRenameSubmit,
  onRenameCancel,
  onOpen,
  onCloseTab,
  onDuplicate,
  onExport,
  onCopy,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: NoteListItemProps) {
  const snippet = extractSnippet(note.note);
  const relativeUpdated = formatRelativeTime(note.updatedAt);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "group relative flex flex-col justify-between",

        // Sizing & Spacing
        "p-3.5 rounded-lg border",

        // Backgrounds & Borders
        "bg-background",

        // Interactive & States
        "transition-all",
        isActiveTab
          ? "border-primary/50 shadow-xs ring-1 ring-primary/20"
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
      )}
    >
      {/* Top Row: Title, Metadata, Badges & Quick Open */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-start justify-between",

          // Sizing & Spacing
          "gap-2"
        )}
      >
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col flex-1 min-w-0",

            // Sizing & Spacing
            "gap-1"
          )}
        >
          {/* Title or Inline Edit */}
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onRenameSubmit();
              }}
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5"
              )}
            >
              <Input
                autoFocus
                value={editingName}
                onChange={(e) => onSetEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onRenameCancel();
                }}
                className={cn(
                  // Sizing & Spacing
                  "h-6.5 px-2 py-0",

                  // Typography
                  "text-xs"
                )}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className={cn(
                  // Sizing & Spacing
                  "h-6.5 w-6.5 p-0",

                  // Typography
                  "text-primary",

                  // Interactive & States
                  "cursor-pointer"
                )}
                title="Save name"
              >
                <CheckIcon className="size-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRenameCancel}
                className={cn(
                  // Sizing & Spacing
                  "h-6.5 w-6.5 p-0",

                  // Typography
                  "text-muted-foreground",

                  // Interactive & States
                  "cursor-pointer"
                )}
                title="Cancel"
              >
                <XIcon className="size-3" />
              </Button>
            </form>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center min-w-0",

                // Sizing & Spacing
                "gap-2"
              )}
            >
              <button
                type="button"
                onClick={onOpen}
                className={cn(
                  // Typography
                  "font-medium text-xs sm:text-sm text-foreground text-left truncate",

                  // Interactive & States
                  "hover:text-primary transition-colors cursor-pointer"
                )}
                title="Click to open note"
              >
                {note.name}
              </button>

              <button
                type="button"
                onClick={onStartRename}
                className={cn(
                  // Sizing & Spacing
                  "p-0.5 rounded",

                  // Typography
                  "text-muted-foreground",

                  // Interactive & States
                  "opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity cursor-pointer"
                )}
                title="Rename note"
              >
                <PencilSimpleIcon className="size-3" />
              </button>
            </div>
          )}

          {/* Metadata stats below title */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center flex-wrap min-w-0",

              // Sizing & Spacing
              "gap-x-1.5 gap-y-0.5",

              // Typography
              "text-[10px] text-muted-foreground"
            )}
          >
            <span
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1",

                // Typography
                "font-mono"
              )}
            >
              <ClockIcon className="size-3 shrink-0" />
              <span>{relativeUpdated}</span>
            </span>
          </div>
        </div>

        {/* Badges and Quick Open Action */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0",

            // Sizing & Spacing
            "gap-1.5"
          )}
        >
          {isOpenInTab && (
            <Badge
              variant="outline"
              className={cn(
                // Sizing & Spacing
                "px-1.5 py-0",

                // Typography
                "text-[10px] font-normal",

                // Backgrounds & Borders
                isActiveTab
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-muted text-muted-foreground bg-muted/30"
              )}
            >
              {isActiveTab ? 'Active Tab' : 'Open in Tab'}
            </Badge>
          )}

          <Button
            size="sm"
            variant={isOpenInTab ? 'secondary' : 'default'}
            onClick={onOpen}
            className={cn(
              // Sizing & Spacing
              "h-6.5 px-2.5",

              // Typography
              "text-xs font-medium cursor-pointer"
            )}
          >
            <ArrowSquareOutIcon className="size-3 mr-1" />
            <span>{isOpenInTab ? (isActiveTab ? 'Current' : 'Switch') : 'Open'}</span>
          </Button>
        </div>
      </div>

      {/* Snippet Preview */}
      <div
        onClick={onOpen}
        className={cn(
          // Sizing & Spacing
          "my-2 px-1",

          // Typography
          "text-xs text-muted-foreground/80 leading-relaxed font-mono line-clamp-2",

          // Interactive & States
          "cursor-pointer hover:text-foreground transition-colors"
        )}
      >
        {snippet}
      </div>

      {/* Bottom Bar: Action Buttons */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-end",

          // Sizing & Spacing
          "pt-2 border-t border-border/50 gap-0.5",

          // Typography
          "text-[10px] text-muted-foreground"
        )}
      >
        {isDeletingConfirm ? (
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1.5 px-2 py-0.5 rounded border border-destructive/30",

              // Backgrounds & Borders
              "bg-destructive/10"
            )}
          >
            <span
              className={cn(
                // Typography
                "text-[10px] text-destructive font-medium"
              )}
            >
              Delete note?
            </span>
            <button
              type="button"
              onClick={onConfirmDelete}
              className={cn(
                // Typography
                "text-[10px] font-bold text-destructive hover:underline cursor-pointer"
              )}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className={cn(
                // Typography
                "text-[10px] text-muted-foreground hover:underline cursor-pointer"
              )}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {isOpenInTab && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCloseTab}
                className={cn(
                  // Sizing & Spacing
                  "h-6 px-1.5",

                  // Typography
                  "text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                )}
                title="Close tab (keeps note saved in library)"
              >
                <XCircleIcon className="size-3 mr-1" />
                Close Tab
              </Button>
            )}

            <button
              type="button"
              onClick={onCopy}
              className={cn(
                // Sizing & Spacing
                "p-1 rounded",

                // Typography
                "text-muted-foreground hover:text-foreground hover:bg-muted",

                // Interactive & States
                "transition-colors cursor-pointer"
              )}
              title="Copy note text"
            >
              <CopyIcon className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={onExport}
              className={cn(
                // Sizing & Spacing
                "p-1 rounded",

                // Typography
                "text-muted-foreground hover:text-foreground hover:bg-muted",

                // Interactive & States
                "transition-colors cursor-pointer"
              )}
              title="Export as Markdown (.md)"
            >
              <DownloadSimpleIcon className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={onDuplicate}
              className={cn(
                // Sizing & Spacing
                "p-1 rounded",

                // Typography
                "text-muted-foreground hover:text-foreground hover:bg-muted",

                // Interactive & States
                "transition-colors cursor-pointer"
              )}
              title="Duplicate note"
            >
              <PlusIcon className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={onStartDelete}
              className={cn(
                // Sizing & Spacing
                "p-1 rounded",

                // Typography
                "text-muted-foreground hover:text-destructive",

                // Backgrounds & Borders
                "hover:bg-destructive/10",

                // Interactive & States
                "transition-colors cursor-pointer"
              )}
              title="Delete note permanently"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
