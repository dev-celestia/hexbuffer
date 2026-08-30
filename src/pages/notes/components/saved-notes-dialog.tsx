import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Button,
  Badge,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@celestia-project/ui';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  CheckIcon,
  XIcon,
  FileTextIcon,
  ClockIcon,
  ArrowSquareOutIcon,
  XCircleIcon,
  FolderSimpleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useSavedNotesManager } from '../hooks/use-saved-notes-manager';
import { NOTE_FILTER_TABS, NOTE_SORT_OPTIONS } from '../constants';
import { extractSnippet, formatRelativeTime, getWordAndCharCount } from '../lib/helpers';
import type { Scratchpad } from '@/stores/scratchpad';

interface SavedNotesDialogProps {
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
                  // Typography
                  "text-xs text-muted-foreground mt-0.5"
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
        <div
          className={cn(
            // Layout & Positioning
            "flex flex-col sm:flex-row items-stretch sm:items-center justify-between shrink-0",

            // Sizing & Spacing
            "px-6 py-3 gap-3 border-b",

            // Backgrounds & Borders
            "bg-muted/5"
          )}
        >
          {/* Search Input */}
          <div
            className={cn(
              // Layout & Positioning
              "relative flex-1 max-w-full sm:max-w-sm"
            )}
          >
            <MagnifyingGlassIcon
              className={cn(
                // Layout & Positioning
                "absolute top-1/2 -translate-y-1/2 left-2.5",

                // Sizing & Spacing
                "size-3.5",

                // Typography
                "text-muted-foreground pointer-events-none"
              )}
            />
            <Input
              placeholder="Search note titles and contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                // Sizing & Spacing
                "h-8 pl-8 pr-7",

                // Typography
                "text-xs",

                // Backgrounds & Borders
                "bg-background"
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={cn(
                  // Layout & Positioning
                  "absolute top-1/2 -translate-y-1/2 right-2",

                  // Typography
                  "text-muted-foreground hover:text-foreground cursor-pointer"
                )}
                title="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Sort Select */}
          <div
            className={cn(
              // Layout & Positioning
              "flex flex-wrap items-center justify-between sm:justify-end",

              // Sizing & Spacing
              "gap-2"
            )}
          >
            {/* Filter Tabs */}
            <div
              className={cn(
                // Layout & Positioning
                "flex items-center",

                // Sizing & Spacing
                "p-0.5 rounded-lg border",

                // Backgrounds & Borders
                "bg-muted/40"
              )}
            >
              {NOTE_FILTER_TABS.map((tab) => {
                const count = counts[tab.id];
                const isActive = activeFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={cn(
                      // Layout & Positioning
                      "flex items-center",

                      // Sizing & Spacing
                      "px-2.5 py-1 rounded-md gap-1.5",

                      // Typography
                      "text-[11px] font-medium transition-all cursor-pointer",

                      // Interactive & States
                      isActive
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        // Sizing & Spacing
                        "px-1 py-0.2 rounded-full",

                        // Typography
                        "text-[9px] font-mono",

                        // Backgrounds & Borders
                        isActive ? "bg-muted text-foreground" : "bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <Select value={sortOption} onValueChange={(val) => setSortOption(val as any)}>
              <SelectTrigger
                className={cn(
                  // Sizing & Spacing
                  "h-8 w-40",

                  // Typography
                  "text-xs",

                  // Backgrounds & Borders
                  "bg-background"
                )}
              >
                <SelectValue placeholder="Sort notes" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            <div
              className={cn(
                // Layout & Positioning
                "flex flex-col items-center justify-center text-center",

                // Sizing & Spacing
                "py-16 px-4 gap-3",

                // Typography
                "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  // Layout & Positioning
                  "flex items-center justify-center",

                  // Sizing & Spacing
                  "size-12 rounded-full",

                  // Backgrounds & Borders
                  "bg-muted/50 border"
                )}
              >
                <FileTextIcon className="size-6 opacity-40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No notes found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery
                    ? `No saved notes match "${searchQuery}"`
                    : activeFilterTab !== 'all'
                      ? `No notes in the "${activeFilterTab}" filter`
                      : 'Create your first note to get started'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewNote}
                className={cn(
                  // Sizing & Spacing
                  "mt-2",

                  // Typography
                  "text-xs cursor-pointer"
                )}
              >
                <PlusIcon className="size-3.5 mr-1.5" />
                Create New Note
              </Button>
            </div>
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

interface NoteListItemProps {
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

function NoteListItem({
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
  const stats = getWordAndCharCount(note.note);
  const relativeUpdated = formatRelativeTime(note.updatedAt);

  return (
    <div
      className={cn(
        // Layout & Positioning
        "group relative flex flex-col justify-between",

        // Sizing & Spacing
        "p-3.5 rounded-lg border",

        // Backgrounds & Borders
        "bg-background transition-all",

        // Interactive & States
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
                className="h-6.5 text-xs py-0 px-2"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-6.5 w-6.5 p-0 text-primary cursor-pointer"
                title="Save name"
              >
                <CheckIcon className="size-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRenameCancel}
                className="h-6.5 w-6.5 p-0 text-muted-foreground cursor-pointer"
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
                  "font-medium text-xs sm:text-sm text-foreground hover:text-primary transition-colors text-left truncate cursor-pointer"
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
                  "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground",

                  // Interactive & States
                  "transition-opacity cursor-pointer"
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
            <span className="flex items-center gap-1 font-mono">
              <ClockIcon className="size-3 shrink-0" />
              <span>{relativeUpdated}</span>
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="font-mono">
              {stats.words} {stats.words === 1 ? 'word' : 'words'}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="font-mono">
              {stats.chars} {stats.chars === 1 ? 'char' : 'chars'}
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
                // Typography
                "text-[10px] font-normal px-1.5 py-0",

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
              "h-6.5 px-2.5 text-xs font-medium cursor-pointer"
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
          "text-xs text-muted-foreground/80 leading-relaxed font-mono line-clamp-2 cursor-pointer hover:text-foreground transition-colors"
        )}
      >
        {snippet}
      </div>

      {/* Bottom Bar: Action Buttons */}
      <div
        className={cn(
          // Layout & Positioning
          "flex items-center justify-end pt-2 border-t border-border/50",

          // Sizing & Spacing
          "gap-0.5",

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
              "gap-1.5 bg-destructive/10 px-2 py-0.5 rounded border border-destructive/30"
            )}
          >
            <span className="text-[10px] text-destructive font-medium">Delete note?</span>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="text-[10px] font-bold text-destructive hover:underline cursor-pointer"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="text-[10px] text-muted-foreground hover:underline cursor-pointer"
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
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
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
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
