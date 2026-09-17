import * as React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { embeddingsEndpointAllowed } from '@/lib/ai-endpoint';
import { useScratchpadStore } from '@/stores/scratchpad';
import type { MemoryEntry, ReindexResult } from '../types';

interface AiSettingsResponse {
  embeddingsBaseUrl?: string | null;
  embeddingsModel?: string | null;
  allowThirdPartyAiSharing?: boolean;
}

export function useMemory() {
  const [entries, setEntries] = React.useState<MemoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<MemoryEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = React.useState<MemoryEntry | null>(null);
  const [reindexing, setReindexing] = React.useState(false);
  const [embeddingsActive, setEmbeddingsActive] = React.useState(false);
  /** Configured, but the backend will refuse to embed until sharing consent or a loopback endpoint. */
  const [embeddingsBlocked, setEmbeddingsBlocked] = React.useState(false);
  const [embeddingsModel, setEmbeddingsModel] = React.useState<string | null>(null);

  const fetchAiSettings = React.useCallback(async () => {
    try {
      const settings = await invoke<AiSettingsResponse>('get_ai_settings');
      const configured = !!(
        settings.embeddingsBaseUrl?.trim() && settings.embeddingsModel?.trim()
      );
      // Configuration alone is not enough to claim vector search works. The backend gate
      // (`embeddings_sharing_allowed`) also requires a loopback endpoint or sharing consent, and
      // when it refuses it stores new entries **silently** without a vector — no error reaches the
      // UI. Reading only "is it configured" therefore showed a green "RAG: <model>" badge while
      // nothing was ever embedded, with an unexplained 0/N as the only clue.
      const allowed = embeddingsEndpointAllowed(
        settings.embeddingsBaseUrl,
        settings.allowThirdPartyAiSharing === true,
      );
      setEmbeddingsActive(configured && allowed);
      setEmbeddingsBlocked(configured && !allowed);
      setEmbeddingsModel(settings.embeddingsModel?.trim() || null);
    } catch {
      setEmbeddingsActive(false);
      setEmbeddingsBlocked(false);
      setEmbeddingsModel(null);
    }
  }, []);

  const loadEntries = React.useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const data = await invoke<MemoryEntry[]>('list_memory_entries', {
        query: query?.trim() ? query.trim() : null,
      });
      setEntries(data);
      if (selectedId && !data.some((e) => e.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (error) {
      console.error('Failed to load memory entries:', error);
      toast.error(`Failed to load memory: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  React.useEffect(() => {
    void fetchAiSettings();
  }, [fetchAiSettings]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadEntries(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, loadEntries]);

  const selectedEntry = React.useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );

  const embeddedCount = React.useMemo(
    () => entries.filter((e) => Boolean(e.embeddingModel)).length,
    [entries]
  );

  const handleRefresh = React.useCallback(() => {
    void fetchAiSettings();
    void loadEntries(searchQuery);
  }, [fetchAiSettings, loadEntries, searchQuery]);

  const handleOpenCreate = React.useCallback(() => {
    setEditingEntry(null);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = React.useCallback((entry: MemoryEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  }, []);

  const handleTogglePin = React.useCallback(
    async (entry: MemoryEntry, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      const nextPinned = !entry.pinned;
      try {
        await invoke('set_memory_entry_pinned', {
          entryId: entry.id,
          pinned: nextPinned,
        });
        setEntries((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, pinned: nextPinned } : item
          )
        );
        toast.success(nextPinned ? 'Entry pinned' : 'Entry unpinned');
      } catch (error) {
        console.error('Failed to toggle pin:', error);
        toast.error(`Failed to pin entry: ${error}`);
      }
    },
    []
  );

  const handleSaveEntry = React.useCallback(
    async (draft: {
      title: string;
      content: string;
      tags: string[];
      url?: string;
    }) => {
      try {
        const payload: MemoryEntry = {
          id: editingEntry?.id ?? '',
          title: draft.title.trim(),
          content: draft.content.trim(),
          tags: draft.tags,
          sourceType: editingEntry?.sourceType ?? 'user',
          sourceRef: editingEntry?.sourceRef ?? null,
          url: draft.url?.trim() || null,
          pinned: editingEntry?.pinned ?? false,
          createdAt: editingEntry?.createdAt ?? '',
          updatedAt: '',
        };

        const saved = await invoke<MemoryEntry>('save_memory_entry', {
          entry: payload,
        });

        setDialogOpen(false);
        setEditingEntry(null);
        setSelectedId(saved.id);
        await loadEntries(searchQuery);
        toast.success(editingEntry ? 'Entry updated' : 'Entry created');
      } catch (error) {
        console.error('Failed to save memory entry:', error);
        toast.error(`Failed to save entry: ${error}`);
        throw error;
      }
    },
    [editingEntry, loadEntries, searchQuery]
  );

  const handleDeleteEntry = React.useCallback(
    async (id: string) => {
      try {
        await invoke('delete_memory_entry', { entryId: id });
        if (selectedId === id) {
          setSelectedId(null);
        }
        setDeletingEntry(null);
        setEntries((current) => current.filter((item) => item.id !== id));
        toast.success('Entry deleted');
      } catch (error) {
        console.error('Failed to delete memory entry:', error);
        toast.error(`Failed to delete entry: ${error}`);
      }
    },
    [selectedId]
  );

  const handleReindex = React.useCallback(async () => {
    try {
      setReindexing(true);
      const result = await invoke<ReindexResult>('reindex_memory_embeddings');
      toast.success(
        `Reindexed embeddings: ${result.embedded} updated, ${result.failed} failed (${result.total} total)`
      );
      await loadEntries(searchQuery);
    } catch (error) {
      console.error('Failed to reindex embeddings:', error);
      toast.error(`Reindexing failed: ${error}`);
    } finally {
      setReindexing(false);
    }
  }, [loadEntries, searchQuery]);

  const handleCopyContent = React.useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Content copied to clipboard');
  }, []);

  /**
   * Copies a memory entry into the scratchpad as a new note. Memory and notes are
   * separate stores by design; this is the explicit, user-initiated transfer back.
   */
  const handleSaveAsNote = React.useCallback((entry: MemoryEntry) => {
    const newId = useScratchpadStore
      .getState()
      .addScratchpad(entry.title, entry.content);
    if (newId) {
      toast.success('Saved as note', {
        description: `"${entry.title}" is now open in the Notes tab.`,
      });
    } else {
      toast.error('Could not create note', {
        description: 'The note limit (100) has been reached.',
      });
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
    dialogOpen,
    setDialogOpen,
    editingEntry,
    deletingEntry,
    setDeletingEntry,
    reindexing,
    embeddingsActive,
    embeddingsBlocked,
    embeddingsModel,
    embeddedCount,
    handleRefresh,
    handleOpenCreate,
    handleOpenEdit,
    handleTogglePin,
    handleSaveEntry,
    handleDeleteEntry,
    handleReindex,
    handleCopyContent,
    handleSaveAsNote,
  };
}

export type MemoryState = ReturnType<typeof useMemory>;
