import * as React from 'react';
import { toast } from 'sonner';
import { useScratchpadStore, type Scratchpad } from '@/stores/scratchpad';
import type { NoteFilterTab, NoteSortOption } from '../types';
import { downloadAsMarkdown, copyNoteToClipboard } from '../lib/helpers';

export function useSavedNotesManager(onCloseModal?: () => void) {
  const {
    scratchpads: notes,
    openTabIds,
    activeId,
    openNote,
    closeTab,
    deleteNotePermanently,
    duplicateNote,
    renameScratchpad: renameNote,
    addScratchpad: addNote,
  } = useScratchpadStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilterTab, setActiveFilterTab] = React.useState<NoteFilterTab>('all');
  const [sortOption, setSortOption] = React.useState<NoteSortOption>('updated-desc');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingNoteName, setEditingNoteName] = React.useState('');

  const counts = React.useMemo(() => {
    const open = notes.filter((n) => openTabIds.includes(n.id)).length;
    const closed = notes.length - open;
    return {
      all: notes.length,
      open,
      closed,
    };
  }, [notes, openTabIds]);

  const filteredAndSortedNotes = React.useMemo(() => {
    let result = [...notes];

    // Filter by tab
    if (activeFilterTab === 'open') {
      result = result.filter((n) => openTabIds.includes(n.id));
    } else if (activeFilterTab === 'closed') {
      result = result.filter((n) => !openTabIds.includes(n.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) => n.name.toLowerCase().includes(q) || n.note.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'updated-asc':
          return (a.updatedAt || 0) - (b.updatedAt || 0);
        case 'created-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'title-asc':
          return a.name.localeCompare(b.name);
        case 'title-desc':
          return b.name.localeCompare(a.name);
        case 'updated-desc':
        default:
          return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
    });

    return result;
  }, [notes, activeFilterTab, searchQuery, sortOption, openTabIds]);

  const handleCreateNewNote = React.useCallback(() => {
    const newId = addNote();
    if (newId) {
      toast.success('New note created');
      onCloseModal?.();
    }
  }, [addNote, onCloseModal]);

  const handleOpenNote = React.useCallback(
    (id: string) => {
      openNote(id);
      toast.success('Opened in tab');
      onCloseModal?.();
    },
    [openNote, onCloseModal]
  );

  const handleCloseTab = React.useCallback(
    (id: string) => {
      closeTab(id);
      const note = notes.find((n) => n.id === id);
      toast.info('Tab closed', { description: note?.name ? `"${note.name}" is saved in library` : undefined });
    },
    [closeTab, notes]
  );

  const handleDuplicate = React.useCallback(
    (id: string) => {
      const newId = duplicateNote(id);
      if (newId) {
        toast.success('Note duplicated');
      }
    },
    [duplicateNote]
  );

  const handleDeletePermanently = React.useCallback(
    (id: string) => {
      const target = notes.find((n) => n.id === id);
      deleteNotePermanently(id);
      setDeleteConfirmId(null);
      toast.success('Note permanently deleted', { description: target?.name });
    },
    [deleteNotePermanently, notes]
  );

  const handleStartRename = React.useCallback((id: string, name: string) => {
    setEditingNoteId(id);
    setEditingNoteName(name);
  }, []);

  const handleRenameSubmit = React.useCallback(() => {
    const trimmed = editingNoteName.trim();
    if (trimmed && editingNoteId) {
      renameNote(editingNoteId, trimmed);
      toast.success('Note renamed');
    }
    setEditingNoteId(null);
    setEditingNoteName('');
  }, [editingNoteId, editingNoteName, renameNote]);

  const handleRenameCancel = React.useCallback(() => {
    setEditingNoteId(null);
    setEditingNoteName('');
  }, []);

  return {
    notes,
    openTabIds,
    activeId,
    searchQuery,
    setSearchQuery,
    activeFilterTab,
    setActiveFilterTab,
    sortOption,
    setSortOption,
    counts,
    filteredAndSortedNotes,
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
    handleExport: (note: Scratchpad) => downloadAsMarkdown(note.name, note.note),
    handleCopy: (note: Scratchpad) => copyNoteToClipboard(note.note, note.name),
  };
}

export type SavedNotesManagerHookType = ReturnType<typeof useSavedNotesManager>;
