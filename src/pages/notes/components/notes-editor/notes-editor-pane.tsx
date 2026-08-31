import * as React from 'react';
import { TextEditor } from '@celestia-project/ui';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { NotesPageHookType } from '../../hooks/use-notes-page';
import { readFileAsBase64, formatMarkdownImage } from '../../lib/image-helpers';
import { NotesEmptyState } from '../notes-empty-state';
import { NotesPreviewPane } from '../notes-preview';
import { DrawingCanvasDialog } from '../drawing-canvas/drawing-canvas-dialog';
import { NotesSearchEmpty } from './notes-search-empty';
import { NotesEditorToolbar } from './notes-editor-toolbar';

export interface NotesEditorPaneProps {
  hook: NotesPageHookType;
}

export function NotesEditorPane({ hook }: NotesEditorPaneProps) {
  const { theme } = useTheme();
  const {
    tabs,
    notes,
    searchQuery,
    clearSearch,
    activeNote,
    note,
    setNote,
    editingId,
    renameValue,
    setRenameValue,
    setIsSavedNotesOpen,
    isDrawingOpen,
    setIsDrawingOpen,
    viewMode,
    setViewMode,
    handleEditorMount,
    handleSelectAll,
    handleExportActiveNote,
    handleCopyActiveNote,
    handleInsertDrawing,
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
    onTabAdd,
  } = hook;

  const isRenamingActive = Boolean(activeNote && editingId === activeNote.id);

  // When searching, if no open tabs match the query
  if (tabs.length === 0 && searchQuery.trim()) {
    return (
      <NotesSearchEmpty
        searchQuery={searchQuery}
        totalNotesCount={notes.length}
        onClearSearch={clearSearch}
        onOpenSavedNotes={() => setIsSavedNotesOpen(true)}
      />
    );
  }

  if (!activeNote || tabs.length === 0) {
    return (
      <NotesEmptyState
        onOpenSavedNotes={() => setIsSavedNotesOpen(true)}
        onCreateNewNote={onTabAdd}
      />
    );
  }

  const handleEditorDrop = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    e.preventDefault();
    try {
      let appendedImages = '';
      for (const file of files) {
        const base64 = await readFileAsBase64(file);
        appendedImages += formatMarkdownImage(file.name, base64);
      }
      setNote((note ? `${note}\n` : '') + appendedImages);
      toast.success(`${files.length === 1 ? 'Image' : `${files.length} images`} embedded into note`);
    } catch {
      toast.error('Failed to embed image');
    }
  };

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
        }
      }}
      onDrop={handleEditorDrop}
      className={cn(
        // Layout & Positioning
        "flex-1 flex flex-col min-h-0 overflow-hidden",

        // Backgrounds & Borders
        "bg-background"
      )}
    >
      {/* Editor Header / Toolbar */}
      <NotesEditorToolbar
        activeNote={activeNote}
        isRenamingActive={isRenamingActive}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onRenameSubmit={handleRenameSubmit}
        onRenameCancel={handleRenameCancel}
        onStartRename={handleStartRename}
        onOpenDrawingCanvas={() => setIsDrawingOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectAll={handleSelectAll}
        onCopyNote={handleCopyActiveNote}
        onExportNote={handleExportActiveNote}
      />

      {/* Editor & Preview Viewport */}
      <div
        className={cn(
          // Layout & Positioning
          "flex-1 min-h-0 overflow-hidden",

          // Backgrounds & Borders
          "bg-background"
        )}
      >
        {viewMode === 'code' && (
          <div className="w-full h-full">
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
        )}

        {viewMode === 'editor' && (
          <div className="w-full h-full min-h-0 overflow-hidden bg-muted/5">
            <NotesPreviewPane
              content={note}
              onUpdateContent={setNote}
              onOpenDrawingStudio={() => setIsDrawingOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Interactive Drawing & Diagram Studio Dialog */}
      <DrawingCanvasDialog
        isOpen={isDrawingOpen}
        onOpenChange={setIsDrawingOpen}
        onInsertIntoNote={handleInsertDrawing}
      />
    </div>
  );
}

// Backward compatibility alias
export { NotesEditorPane as ScratchpadEditorPane };
