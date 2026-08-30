import * as React from 'react';
import { toast } from 'sonner';
import { useScratchpadStore } from '@/stores/scratchpad';
import type { PageTabItem } from '@/layout/tabs-layout/types';
import type { TextEditorInstance, MonacoInstance } from '@celestia-project/ui';
import { downloadAsMarkdown, copyNoteToClipboard } from '../lib/helpers';

export function useNotesPage() {
  const {
    scratchpads: notes,
    openTabIds,
    activeId,
    note,
    setNote,
    addScratchpad: addNote,
    openNote,
    closeTab,
    deleteNotePermanently,
    setActiveId,
    renameScratchpad: renameNote,
    duplicateNote,
    closeScratchpadsToLeft,
    closeScratchpadsToRight,
    closeAllTabs,
  } = useScratchpadStore();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [isSavedNotesOpen, setIsSavedNotesOpen] = React.useState(false);

  const editorRef = React.useRef<TextEditorInstance | null>(null);

  const activeNote = React.useMemo(() => {
    return notes.find((s) => s.id === activeId) || null;
  }, [notes, activeId]);

  // Handle Cmd+S on window
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeNote) {
          toast.success('Note saved', { description: activeNote.name });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeNote]);

  // Derived tabs from openTabIds
  const tabs: PageTabItem[] = React.useMemo(() => {
    const list: PageTabItem[] = [];
    for (const id of openTabIds) {
      const item = notes.find((s) => s.id === id);
      if (item) {
        list.push({
          id: item.id,
          name: item.name,
          closable: true,
          renamable: true,
        });
      }
    }
    return list;
  }, [openTabIds, notes]);

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
    if (notes.length >= 100) {
      toast.error('Limit reached', { description: 'Maximum 100 notes allowed' });
      return;
    }
    const newId = addNote();
    if (newId) {
      toast.success('New note created');
    }
  }, [notes.length, addNote]);

  const handleTabClose = React.useCallback(
    (id: string) => {
      const target = notes.find((n) => n.id === id);
      closeTab(id);
      toast.info('Tab closed', {
        description: target?.name ? `"${target.name}" is saved in library` : 'Saved in library',
      });
    },
    [notes, closeTab]
  );

  const handleTabRename = React.useCallback(
    (id: string, name: string) => {
      renameNote(id, name);
    },
    [renameNote]
  );

  const handleSelectAll = React.useCallback(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.focus();
        editorRef.current.setSelection(model.getFullModelRange());
      }
    }
  }, []);

  const handleEditorMount = React.useCallback(
    (editor: TextEditorInstance, monaco: MonacoInstance) => {
      editorRef.current = editor;

      // Register Cmd+A / Ctrl+A to select all text inside the editor
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
        const model = editor.getModel();
        if (model) {
          editor.setSelection(model.getFullModelRange());
        }
      });

      // Register Cmd+S / Ctrl+S to save/notify
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const currentActive = useScratchpadStore.getState().scratchpads.find(
          (s) => s.id === useScratchpadStore.getState().activeId
        );
        if (currentActive) {
          toast.success('Note saved', { description: currentActive.name });
        }
      });
    },
    []
  );

  const handleExportActiveNote = React.useCallback(() => {
    if (activeNote) {
      downloadAsMarkdown(activeNote.name, activeNote.note);
    }
  }, [activeNote]);

  const handleCopyActiveNote = React.useCallback(() => {
    if (activeNote) {
      void copyNoteToClipboard(activeNote.note, activeNote.name);
    }
  }, [activeNote]);

  return {
    tabs,
    notes,
    openTabIds,
    activeId,
    activeNote,
    note,
    setNote,
    editingId,
    renameValue,
    setRenameValue,
    isSavedNotesOpen,
    setIsSavedNotesOpen,
    editorRef,
    handleEditorMount,
    handleSelectAll,
    handleExportActiveNote,
    handleCopyActiveNote,
    handleStartRename,
    handleRenameSubmit,
    handleRenameCancel,
    onTabChange: setActiveId,
    onTabAdd: handleAdd,
    onTabClose: handleTabClose,
    onTabRename: handleTabRename,
    onCloseTabsToLeft: closeScratchpadsToLeft,
    onCloseTabsToRight: closeScratchpadsToRight,
    closeAllTabs,
    openNote,
    deleteNotePermanently,
    duplicateNote,
  };
}

export type NotesPageHookType = ReturnType<typeof useNotesPage>;
