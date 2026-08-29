import * as React from 'react';
import { toast } from 'sonner';
import { useScratchpadStore } from '@/stores/scratchpad';
import type { PageTabItem } from '@/layout/tabs-layout/types';

export function useNotesPage() {
  const {
    scratchpads: notes,
    activeId,
    note,
    setNote,
    addScratchpad: addNote,
    deleteScratchpad: deleteNote,
    setActiveId,
    renameScratchpad: renameNote,
    closeScratchpadsToLeft,
    closeScratchpadsToRight,
  } = useScratchpadStore();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  const activeNote = notes.find((s) => s.id === activeId) || notes[0];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeNote) {
          toast.success('Note saved', { description: activeNote.name });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeNote?.name]);

  const tabs: PageTabItem[] = React.useMemo(
    () =>
      notes.map((s) => ({
        id: s.id,
        name: s.name,
        closable: notes.length > 1,
        renamable: true,
      })),
    [notes],
  );

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setRenameValue(currentName);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && editingId) {
      renameNote(editingId, trimmed);
    }
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
  };

  const handleAdd = React.useCallback(() => {
    if (notes.length >= 20) {
      toast.error('Limit reached', { description: 'Maximum 20 notes allowed' });
      return;
    }
    addNote();
    toast.success('New note created');
  }, [notes.length, addNote]);

  const handleDelete = React.useCallback(
    (id: string) => {
      if (notes.length <= 1) {
        toast.error('Cannot delete', { description: 'You must keep at least one note' });
        return;
      }
      const target = notes.find((n) => n.id === id);
      deleteNote(id);
      toast.success('Note deleted', { description: target?.name });
    },
    [notes, deleteNote],
  );

  const handleTabRename = React.useCallback(
    (id: string, name: string) => {
      renameNote(id, name);
    },
    [renameNote],
  );

  return {
    tabs,
    notes,
    activeId,
    activeNote,
    note,
    setNote,
    editingId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
    onTabChange: setActiveId,
    onTabAdd: handleAdd,
    onTabClose: handleDelete,
    onTabRename: handleTabRename,
    onCloseTabsToLeft: closeScratchpadsToLeft,
    onCloseTabsToRight: closeScratchpadsToRight,
  };
}

export type NotesPageHookType = ReturnType<typeof useNotesPage>;

