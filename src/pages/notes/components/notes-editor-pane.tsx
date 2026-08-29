import { Button, Input, Kbd, KbdGroup, TextEditor } from '@celestia-project/ui';
import * as React from 'react';
import { PencilSimpleIcon, CheckIcon, XIcon, FileTextIcon } from '@phosphor-icons/react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

import { NotesPageHookType } from '../hooks/use-notes-page';

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
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
  } = hook;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  const isRenamingActive = activeNote && editingId === activeNote.id;

  const wordCount = React.useMemo(() => {
    if (!note) return 0;
    return note.trim().split(/\s+/).filter(Boolean).length;
  }, [note]);

  const charCount = note?.length || 0;

  if (!activeNote) {
    return (
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 flex flex-col items-center justify-center",

          // Sizing & Spacing
          "p-8",

          // Typography
          "text-muted-foreground",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        <FileTextIcon className="size-12 mb-4 opacity-20" />
        <p className="text-xs">No note selected</p>
      </div>
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
          "h-12 px-4",

          // Backgrounds & Borders
          "border-b bg-muted/5"
        )}
      >
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
                className="h-7 w-7 p-0 text-primary active:scale-95 transition-all"
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRenameCancel}
                title="Cancel rename"
                className="h-7 w-7 p-0 text-muted-foreground active:scale-95 transition-all"
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
                  "max-w-[200px] sm:max-w-[300px] md:max-w-[450px]",

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
                  "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-foreground hover:bg-muted"
                )}
                title="Rename note"
              >
                <PencilSimpleIcon className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Editor Metadata */}
        <div
          className={cn(
            // Layout & Positioning
            "flex items-center shrink-0 select-none",

            // Sizing & Spacing
            "gap-4",

            // Typography
            "text-[10px] text-muted-foreground"
          )}
        >
          <span className="font-mono">{wordCount} words</span>
          <span className="font-mono">{charCount} chars</span>
          <div
            className={cn(
              // Layout & Positioning
              "hidden sm:flex items-center",

              // Sizing & Spacing
              "gap-1.5 pl-4",

              // Backgrounds & Borders
              "border-l"
            )}
          >
            <span className="text-muted-foreground text-[10px]">Save</span>
            <KbdGroup>
              <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd>S</Kbd>
            </KbdGroup>
          </div>
        </div>
      </div>

      {/* Editor Component */}
      <div className="flex-1 min-h-0">
        <TextEditor
          value={note}
          onChange={(value) => setNote(value ?? '')}
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
