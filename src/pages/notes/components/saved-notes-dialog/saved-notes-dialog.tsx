import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  ScrollArea,
} from '@celestia-project/ui';
import {
  PlusIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useSavedNotesManager } from '../../hooks/use-saved-notes-manager';
import { SavedNotesToolbar } from './saved-notes-toolbar';
import { SavedNotesEmptyState } from './saved-notes-empty-state';
import { NoteListItem } from './note-list-item';

export interface SavedNotesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavedNotesDialog({ isOpen, onOpenChange }: SavedNotesDialogProps) {
  const manager = useSavedNotesManager(() => onOpenChange(false));

  const {
    searchQuery,
    setSearchQuery,
    activeFilterTab,
    setActiveFilterTab,
    sortOption,
    setSortOption,
    counts,
    filteredAndSortedNotes,
    openTabIds,
    activeId,
    deleteConfirmId,
    setDeleteConfirmId,
    editingNoteId,
    editingNoteName,
    setEditingNoteName,
    handleCreateNewNote,
    handleOpenNote,
    handleCloseTab,
    handleDuplicate,
    handleDeletePermanently,
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
    handleExport,
    handleCopy,
  } = manager;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Layout & Positioning
          "flex flex-col max-h-[85vh] p-0 overflow-hidden",

          // Sizing & Spacing
          "w-full max-w-4xl sm:max-w-4xl lg:max-w-5xl",

          // Backgrounds & Borders
          "bg-card border shadow-2xl rounded-xl"
        )}
      >
        {/* Header */}
        <DialogHeader
          className={cn(
            // Layout & Positioning
            "flex flex-row items-center justify-between shrink-0",

            // Sizing & Spacing
            "px-6 py-4 border-b",

            // Backgrounds & Borders
            "bg-muted/10"
          )}
        >
          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-3"
            )}
          >
            <div>
              <DialogTitle
                className={cn(
                  // Typography
                  "text-base font-semibold tracking-tight text-foreground"
                )}
              >
                Saved Notes Library
              </DialogTitle>
              <DialogDescription
                className={cn(
                  // Sizing & Spacing
                  "mt-0.5",

                  // Typography
                  "text-xs text-muted-foreground"
                )}
              >
                Manage, search, and reopen all your saved notes ({counts.all} total)
              </DialogDescription>
            </div>
          </div>

          <div
            className={cn(
              // Layout & Positioning
              "flex items-center",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            <Button
              size="sm"
              onClick={handleCreateNewNote}
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "gap-1.5 h-8 px-3",

                // Typography
                "text-xs font-medium cursor-pointer"
              )}
            >
              <PlusIcon className="size-3.5" />
              <span>New Note</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar: Search, Filters, Sort */}
        <SavedNotesToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          activeFilterTab={activeFilterTab}
          onActiveFilterTabChange={setActiveFilterTab}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          counts={counts}
        />

        {/* Notes List Content */}
        <ScrollArea
          className={cn(
            // Layout & Positioning
            "flex-1 min-h-0",

            // Sizing & Spacing
            "h-[440px]"
          )}
        >
          {filteredAndSortedNotes.length === 0 ? (
            <SavedNotesEmptyState
              searchQuery={searchQuery}
              activeFilterTab={activeFilterTab}
              onCreateNewNote={handleCreateNewNote}
            />
          ) : (
            <div
              className={cn(
                // Layout & Positioning
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",

                // Sizing & Spacing
                "p-6 gap-3"
              )}
            >
              {filteredAndSortedNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isOpenInTab={openTabIds.includes(note.id)}
                  isActiveTab={activeId === note.id}
                  isDeletingConfirm={deleteConfirmId === note.id}
                  isEditing={editingNoteId === note.id}
                  editingName={editingNoteName}
                  onSetEditingName={setEditingNoteName}
                  onStartRename={() => handleStartRename(note.id, note.name)}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                  onOpen={() => handleOpenNote(note.id)}
                  onCloseTab={() => handleCloseTab(note.id)}
                  onDuplicate={() => handleDuplicate(note.id)}
                  onExport={() => handleExport(note)}
                  onCopy={() => handleCopy(note)}
                  onStartDelete={() => setDeleteConfirmId(note.id)}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                  onConfirmDelete={() => handleDeletePermanently(note.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer with Cancel button */}
        <DialogFooter
          className={cn(
            // Layout & Positioning
            "flex flex-row items-center justify-between shrink-0",

            // Sizing & Spacing
            "px-6 py-3 border-t",

            // Backgrounds & Borders
            "bg-muted/10"
          )}
        >
          <div
            className={cn(
              // Typography
              "text-xs text-muted-foreground"
            )}
          >
            Showing <span className="font-medium text-foreground">{filteredAndSortedNotes.length}</span> of{' '}
            <span className="font-medium text-foreground">{counts.all}</span> saved notes
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className={cn(
              // Sizing & Spacing
              "h-8 px-4",

              // Typography
              "text-xs font-medium cursor-pointer"
            )}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
