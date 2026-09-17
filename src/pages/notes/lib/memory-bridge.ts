import { invoke } from '@tauri-apps/api/core';
import type { Scratchpad } from '@/stores/scratchpad';

/**
 * Copies a note into the persistent memory knowledge base.
 *
 * Notes and memory are separate stores on purpose: notes are the user's working
 * surface and are never injected into AI context automatically, while memory
 * entries are curated and retrieved by the Memory Agent. This is the explicit,
 * user-initiated promotion between them — `sourceRef` records the originating
 * note id so the provenance survives.
 */
export async function promoteNoteToMemory(note: Scratchpad): Promise<string> {
  const saved = await invoke<{ id: string }>('save_memory_entry', {
    entry: {
      title: note.name.trim() || 'Untitled Note',
      content: note.note,
      tags: [],
      namespace: 'default',
      memoryType: 'fact',
      importance: 0.5,
      pinned: false,
      source: note.id,
      sourceType: 'note',
    },
  });

  return saved.id;
}