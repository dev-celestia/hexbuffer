import * as React from 'react';
import {
  Button,
  Input,
  Kbd,
  KbdGroup,
} from '@celestia-project/ui';
import {
  PencilSimpleIcon,
  CheckIcon,
  XIcon,
  CopyIcon,
  DownloadSimpleIcon,
  SelectionAllIcon,
  PaintBrushIcon,
  CodeIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { EditorViewMode } from '../../types';
import type { Scratchpad } from '@/stores/scratchpad';

export interface NotesEditorToolbarProps {
  activeNote: Scratchpad;
  isRenamingActive: boolean;
  renameValue: string;
  onRenameValueChange: (val: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onStartRename: (id: string, name: string) => void;
  onOpenDrawingCanvas: () => void;
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  onSelectAll: () => void;
  onCopyNote: () => void;
  onExportNote: () => void;
}

export function NotesEditorToolbar({
  activeNote,
  isRenamingActive,
  renameValue,
  onRenameValueChange,
  onRenameSubmit,
  onRenameCancel,
  onStartRename,
  onOpenDrawingCanvas,
  viewMode,
  onViewModeChange,
  onSelectAll,
  onCopyNote,
  onExportNote,
}: NotesEditorToolbarProps) {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex items-center justify-between shrink-0 select-none flex-wrap",

        // Sizing & Spacing
        "min-h-12 px-4 py-1.5 border-b gap-2",

        // Backgrounds & Borders
        "bg-muted/10"
      )}
    >
      {/* Left Section: Note Title & Rename */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center flex-1 min-w-0",

          // Sizing & Spacing
          "gap-2 me-2"
        )}
      >
        {isRenamingActive ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRenameSubmit();
            }}
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            <Input
              value={renameValue}
              onChange={(e) => onRenameValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onRenameCancel();
              }}
              autoFocus
              className={cn(
                // Sizing & Spacing
                "h-7 px-2",

                // Typography
                "text-xs font-medium"
              )}
            />
            <Button
              type="submit"
              size="xs"
              variant="default"
              className={cn(
                // Sizing & Spacing
                "size-7 p-0",

                // Interactive & States
                "cursor-pointer"
              )}
              title="Save"
            >
              <CheckIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={onRenameCancel}
              className={cn(
                // Sizing & Spacing
                "size-7 p-0",

                // Interactive & States
                "cursor-pointer"
              )}
              title="Cancel"
            >
              <XIcon className="size-3.5" />
            </Button>
          </form>
        ) : (
          <div
            className={cn(
              // Layout & Positioning
              "group flex items-center min-w-0",

              // Sizing & Spacing
              "gap-1.5"
            )}
          >
            <span
              onDoubleClick={() => activeNote && onStartRename(activeNote.id, activeNote.name)}
              className={cn(
                // Typography
                "text-xs font-semibold text-foreground truncate",

                // Interactive & States
                "cursor-pointer"
              )}
              title="Double-click to rename"
            >
              {activeNote?.name || 'Untitled'}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => activeNote && onStartRename(activeNote.id, activeNote.name)}
              className={cn(
                // Sizing & Spacing
                "size-5 p-0",

                // Typography
                "text-muted-foreground hover:text-foreground",

                // Backgrounds & Borders
                "hover:bg-muted",

                // Interactive & States
                "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
              )}
              title="Rename note"
            >
              <PencilSimpleIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Middle & Right Section: Drawing Tools, View Mode & Utility Actions */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center shrink-0 select-none flex-wrap",

          // Sizing & Spacing
          "gap-1.5"
        )}
      >
        {/* Scratchpad Canvas Drawing Button (Icon Only with Tooltip) */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenDrawingCanvas}
          className={cn(
            // Layout & Positioning
            "flex items-center justify-center shadow-xs",

            // Sizing & Spacing
            "size-7 p-0",

            // Interactive & States
            "cursor-pointer"
          )}
          title="Scratchpad Canvas (Draw)"
        >
          <PaintBrushIcon className="size-3.5" />
        </Button>

        {/* View Mode Switcher: Editor (Visual) vs Code (Markdown) */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "p-0.5 rounded-lg border gap-0.5",

            // Backgrounds & Borders
            "bg-muted/40"
          )}
        >
          <Button
            variant={viewMode === 'editor' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => onViewModeChange('editor')}
            className={cn(
              // Sizing & Spacing
              "h-6 px-2 py-0 gap-1",

              // Typography
              "text-xs cursor-pointer",

              // Interactive & States
              viewMode === 'editor' ? "shadow-xs font-medium" : "text-muted-foreground hover:text-foreground"
            )}
            title="Visual Editor (Interactive Canvas)"
          >
            <PencilSimpleIcon className="size-3.5" />
            <span>Editor</span>
          </Button>

          <Button
            variant={viewMode === 'code' ? 'default' : 'ghost'}
            size="xs"
            onClick={() => onViewModeChange('code')}
            className={cn(
              // Sizing & Spacing
              "h-6 px-2 py-0 gap-1",

              // Typography
              "text-xs cursor-pointer",

              // Interactive & States
              viewMode === 'code' ? "shadow-xs font-medium" : "text-muted-foreground hover:text-foreground"
            )}
            title="Code Editor (Raw Markdown Source)"
          >
            <CodeIcon className="size-3.5" />
            <span>Code</span>
          </Button>
        </div>

        {/* Quick Action Buttons Group */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center",

            // Sizing & Spacing
            "gap-0.5 border-s ps-1.5"
          )}
        >
          {/* Select All */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Typography
              "text-xs text-muted-foreground hover:text-foreground",

              // Interactive & States
              "cursor-pointer"
            )}
            title="Select All Text (Cmd+A / Ctrl+A)"
          >
            <SelectionAllIcon className="size-3.5" />
          </Button>

          {/* Copy Note */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopyNote}
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Typography
              "text-xs text-muted-foreground hover:text-foreground",

              // Interactive & States
              "cursor-pointer"
            )}
            title="Copy Note Content to Clipboard"
          >
            <CopyIcon className="size-3.5" />
          </Button>

          {/* Export Note */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportNote}
            className={cn(
              // Sizing & Spacing
              "size-7 p-0",

              // Typography
              "text-xs text-muted-foreground hover:text-foreground",

              // Interactive & States
              "cursor-pointer"
            )}
            title="Export Note as Markdown (.md)"
          >
            <DownloadSimpleIcon className="size-3.5" />
          </Button>
        </div>

        {/* Save Shortcut Badge */}
        <div
          className={cn(
            // Layout & Positioning
            "hidden lg:flex items-center",

            // Sizing & Spacing
            "gap-1 ps-2 border-s"
          )}
        >
          <span className="text-[10px] text-muted-foreground">Save</span>
          <KbdGroup>
            <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
        </div>
      </div>
    </div>
  );
}
