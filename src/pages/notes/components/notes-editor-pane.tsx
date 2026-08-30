import { Button, Input, Kbd, KbdGroup, TextEditor } from '@celestia-project/ui';
import * as React from 'react';
import {
  PencilSimpleIcon,
  CheckIcon,
  XIcon,
  CopyIcon,
  DownloadSimpleIcon,
  SelectionAllIcon,
} from '@phosphor-icons/react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { NotesPageHookType } from '../hooks/use-notes-page';
import { NotesEmptyState } from './notes-empty-state';
import { getWordAndCharCount } from '../lib/helpers';

interface NotesEditorPaneProps {
  hook: NotesPageHookType;
}

export function NotesEditorPane({ hook }: NotesEditorPaneProps) {
  const { theme } = useTheme();
  const {
    activeNote,
    note,
    setNote,
    editingId,
    renameValue,
    setRenameValue,
    setIsSavedNotesOpen,
    handleEditorMount,
    handleSelectAll,
    handleExportActiveNote,
    handleCopyActiveNote,
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
    onTabAdd,
  } = hook;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  const isRenamingActive = activeNote && editingId === activeNote.id;

  const stats = React.useMemo(() => {
    return getWordAndCharCount(note);
  }, [note]);

  if (!activeNote) {
    return (
      <NotesEmptyState
        onOpenSavedNotes={() => setIsSavedNotesOpen(true)}
        onCreateNewNote={onTabAdd}
      />
    );
  }

  return (
    <div
      className={cn(
        // Layout & Positioning
        "flex-1 flex flex-col min-h-0 overflow-hidden",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Editor Header / Toolbar */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-between shrink-0 select-none",

          // Sizing & Spacing
          "h-12 px-4 border-b",

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
            "gap-2 mr-4"
          )}
        >
          {isRenamingActive ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRenameSubmit();
              }}
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5 max-w-sm w-full"
              )}
            >
              <Input
                className={cn(
                  // Sizing & Spacing
                  "h-7 px-2 py-0",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "bg-background border-primary/40",

                  // Interactive & States
                  "focus-visible:ring-primary/20"
                )}
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleRenameCancel();
                }}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                title="Save name"
                className="h-7 w-7 p-0 text-primary active:scale-95 transition-all cursor-pointer"
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRenameCancel}
                title="Cancel rename"
                className="h-7 w-7 p-0 text-muted-foreground active:scale-95 transition-all cursor-pointer"
              >
                <XIcon className="size-3.5" />
              </Button>
            </form>
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "group flex items-center max-w-full",

                // Sizing & Spacing
                "gap-2",

                // Interactive & States
                "cursor-pointer"
              )}
              onDoubleClick={() => handleStartRename(activeNote.id, activeNote.name)}
              title="Double click to rename"
            >
              <span
                className={cn(
                  // Sizing & Spacing
                  "max-w-[180px] sm:max-w-[280px] md:max-w-[400px]",

                  // Typography
                  "font-semibold text-xs md:text-sm text-foreground truncate"
                )}
              >
                {activeNote.name}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStartRename(activeNote.id, activeNote.name)}
                className={cn(
                  // Sizing & Spacing
                  "size-6 p-0",

                  // Typography
                  "text-muted-foreground",

                  // Interactive & States
                  "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-foreground hover:bg-muted cursor-pointer"
                )}
                title="Rename note"
              >
                <PencilSimpleIcon className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Right Section: Utility Actions & Stats */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0 select-none",

            // Sizing & Spacing
            "gap-3"
          )}
        >
          {/* Quick Action Buttons Group */}
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-1"
            )}
          >
            {/* Select All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2",

                // Typography
                "text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              )}
              title="Select all text (Cmd+A / Ctrl+A)"
            >
              <SelectionAllIcon className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Select All</span>
            </Button>

            {/* Copy Note */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyActiveNote}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2",

                // Typography
                "text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              )}
              title="Copy note content to clipboard"
            >
              <CopyIcon className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Copy</span>
            </Button>

            {/* Export Note */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportActiveNote}
              className={cn(
                // Sizing & Spacing
                "h-7 px-2",

                // Typography
                "text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              )}
              title="Export note as Markdown (.md)"
            >
              <DownloadSimpleIcon className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>

          {/* Stats & Shortcuts */}
          <div
            className={cn(
              // Layout & Positioning
              "hidden md:flex items-center",

              // Sizing & Spacing
              "gap-3 pl-2.5 border-l",

              // Typography
              "text-[10px] text-muted-foreground font-mono"
            )}
          >
            <span>{stats.words} words</span>
            <span>{stats.chars} chars</span>
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1 pl-2 border-l"
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
      </div>

      {/* Editor Component */}
      <div className="flex-1 min-h-0">
        <TextEditor
          value={note}
          onChange={(value) => setNote(value ?? '')}
          onMount={handleEditorMount}
          language="markdown"
          height="100%"
          detectLinks={true}
          theme={theme}
        />
      </div>
    </div>
  );
}

// Backward compatibility alias
export { NotesEditorPane as ScratchpadEditorPane };
