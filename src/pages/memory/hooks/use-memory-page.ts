import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useScratchpadStore } from '@/stores/scratchpad';
import type {
  DreamReport,
  EngineStatus,
  MemoryEdge,
  MemoryItem,
  SaveMemoryPayload,
} from '../types';
import { DEFAULT_NAMESPACE } from '../constants';

export function useMemoryPage() {
  const [entries, setEntries] = React.useState<MemoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [namespaces, setNamespaces] = React.useState<string[]>([DEFAULT_NAMESPACE]);
  const [selectedNamespace, setSelectedNamespace] = React.useState<string>(DEFAULT_NAMESPACE);
  const [selectedType, setSelectedType] = React.useState<string>('all');

  const [isEntryDialogOpen, setIsEntryDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MemoryItem | null>(null);

  const [isDreamDialogOpen, setIsDreamDialogOpen] = React.useState(false);
  const [isDreamRunning, setIsDreamRunning] = React.useState(false);
  const [dreamReport, setDreamReport] = React.useState<DreamReport | null>(null);

  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [edges, setEdges] = React.useState<MemoryEdge[]>([]);
  const [edgesLoading, setEdgesLoading] = React.useState(false);

  const [engineStatus, setEngineStatus] = React.useState<EngineStatus | null>(null);

  const loadStatus = React.useCallback(async () => {
    try {
      const s = await invoke<EngineStatus>('get_memory_engine_status');
      setEngineStatus(s);
    } catch (err) {
      console.warn('Failed to load memory engine status:', err);
    }
  }, []);

  const loadNamespaces = React.useCallback(async () => {
    try {
      const list = await invoke<string[]>('list_memory_namespaces');
      setNamespaces(list.length > 0 ? list : [DEFAULT_NAMESPACE]);
    } catch (err) {
      console.warn('Failed to load namespaces:', err);
    }
  }, []);

  const loadEntries = React.useCallback(
    async (query?: string, namespace?: string, type?: string) => {
      try {
        setLoading(true);
        const data = await invoke<MemoryItem[]>('list_memory_entries', {
          namespace: namespace?.trim() ? namespace.trim() : null,
          query: query?.trim() ? query.trim() : null,
          memoryType: type && type !== 'all' ? type : null,
        });
        setEntries(data);
        if (selectedId && !data.some((e) => e.id === selectedId)) {
          setSelectedId(null);
        }
      } catch (err) {
        console.error('Failed to load memory entries:', err);
        toast.error(`Failed to load memory: ${err}`);
      } finally {
        setLoading(false);
      }
    },
    [selectedId]
  );

  const loadEdges = React.useCallback(async (id: string) => {
    try {
      setEdgesLoading(true);
      const data = await invoke<MemoryEdge[]>('get_memory_edges', { entryId: id });
      setEdges(data);
    } catch (err) {
      console.warn('Failed to load memory edges:', err);
      setEdges([]);
    } finally {
      setEdgesLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    void loadNamespaces();
    void loadStatus();
  }, [loadNamespaces, loadStatus]);

  // Debounced query & filter loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadEntries(searchQuery, selectedNamespace, selectedType);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedNamespace, selectedType, loadEntries]);

  // Load edges when selected entry changes
  React.useEffect(() => {
    if (selectedId) {
      void loadEdges(selectedId);
    } else {
      setEdges([]);
    }
  }, [selectedId, loadEdges]);

  const selectedEntry = React.useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );

  const handleRefresh = React.useCallback(() => {
    void loadStatus();
    void loadNamespaces();
    void loadEntries(searchQuery, selectedNamespace, selectedType);
  }, [loadStatus, loadNamespaces, loadEntries, searchQuery, selectedNamespace, selectedType]);

  const handleOpenCreate = React.useCallback(() => {
    setEditingItem(null);
    setIsEntryDialogOpen(true);
  }, []);

  const handleOpenEdit = React.useCallback((item: MemoryItem) => {
    setEditingItem(item);
    setIsEntryDialogOpen(true);
  }, []);

  const handleTogglePin = React.useCallback(
    async (item: MemoryItem, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      const nextPinned = !item.pinned;
      try {
        await invoke('set_memory_entry_pinned', {
          entryId: item.id,
          pinned: nextPinned,
        });
        setEntries((curr) =>
          curr.map((entry) => (entry.id === item.id ? { ...entry, pinned: nextPinned } : entry))
        );
        toast.success(nextPinned ? 'Entry pinned' : 'Entry unpinned');
      } catch (err) {
        console.error('Failed to toggle pin:', err);
        toast.error(`Pin failed: ${err}`);
      }
    },
    []
  );

  const handleSaveEntry = React.useCallback(
    async (draft: SaveMemoryPayload) => {
      try {
        const payload: SaveMemoryPayload = {
          id: editingItem?.id,
          title: draft.title.trim(),
          content: draft.content.trim(),
          tags: draft.tags,
          namespace: draft.namespace || selectedNamespace,
          memoryType: draft.memoryType || 'fact',
          importance: draft.importance ?? 0.5,
          pinned: editingItem?.pinned ?? false,
          source: draft.source || 'user',
          sourceType: editingItem?.sourceType || 'user',
        };

        const saved = await invoke<MemoryItem>('save_memory_entry', { entry: payload });
        setIsEntryDialogOpen(false);
        setEditingItem(null);
        setSelectedId(saved.id);
        await loadEntries(searchQuery, selectedNamespace, selectedType);
        void loadNamespaces();
        toast.success(editingItem ? 'Memory updated' : 'Memory created');
      } catch (err) {
        console.error('Failed to save memory:', err);
        toast.error(`Failed to save: ${err}`);
        throw err;
      }
    },
    [editingItem, selectedNamespace, loadEntries, searchQuery, selectedType, loadNamespaces]
  );

  const handleDeleteEntry = React.useCallback(
    async (id: string) => {
      try {
        await invoke('delete_memory_entry', { entryId: id });
        if (selectedId === id) {
          setSelectedId(null);
        }
        setEntries((curr) => curr.filter((entry) => entry.id !== id));
        toast.success('Memory deleted');
      } catch (err) {
        console.error('Failed to delete memory:', err);
        toast.error(`Failed to delete: ${err}`);
      }
    },
    [selectedId]
  );

  const handleLinkEntries = React.useCallback(
    async (targetId: string, relation: string) => {
      if (!selectedId) return;
      try {
        await invoke('link_memory_entries', {
          fromId: selectedId,
          toId: targetId,
          relation,
        });
        await loadEdges(selectedId);
        setIsLinkDialogOpen(false);
        toast.success('Relationship linked');
      } catch (err) {
        console.error('Failed to link memories:', err);
        toast.error(`Failed to link: ${err}`);
      }
    },
    [selectedId, loadEdges]
  );

  const handleRunDreamCycle = React.useCallback(async () => {
    try {
      setIsDreamRunning(true);
      const report = await invoke<DreamReport>('run_memory_dream_cycle', {
        namespace: selectedNamespace !== 'all' ? selectedNamespace : null,
      });
      setDreamReport(report);
      toast.success('Dream cycle finished', { description: report.message });
      await loadEntries(searchQuery, selectedNamespace, selectedType);
    } catch (err) {
      console.error('Dream cycle failed:', err);
      toast.error(`Dream cycle error: ${err}`);
    } finally {
      setIsDreamRunning(false);
    }
  }, [selectedNamespace, loadEntries, searchQuery, selectedType]);

  const handleCopyContent = React.useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Content copied to clipboard');
  }, []);

  const handleSaveAsNote = React.useCallback((entry: MemoryItem) => {
    const newId = useScratchpadStore.getState().addScratchpad(entry.title, entry.content);
    if (newId) {
      toast.success('Saved as note', {
        description: `"${entry.title}" is now open in the Notes app.`,
      });
    } else {
      toast.error('Note limit reached');
    }
  }, []);

  return {
    entries,
    loading,
    searchQuery,
    setSearchQuery,
    selectedId,
    setSelectedId,
    selectedEntry,
    namespaces,
    selectedNamespace,
    setSelectedNamespace,
    selectedType,
    setSelectedType,
    isEntryDialogOpen,
    setIsEntryDialogOpen,
    editingItem,
    isDreamDialogOpen,
    setIsDreamDialogOpen,
    isDreamRunning,
    dreamReport,
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    edges,
    edgesLoading,
    engineStatus,
    handleRefresh,
    handleOpenCreate,
    handleOpenEdit,
    handleTogglePin,
    handleSaveEntry,
    handleDeleteEntry,
    handleLinkEntries,
    handleRunDreamCycle,
    handleCopyContent,
    handleSaveAsNote,
  };
}

export type MemoryPageState = ReturnType<typeof useMemoryPage>;
