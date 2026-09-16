import { create } from 'zustand';
import { toast } from 'sonner';
import {
  deleteNote,
  deleteNotes,
  importNotes,
  isTauriAvailable,
  listNotes,
  saveNote,
} from '@/pages/notes/lib/notes-api';

export interface Scratchpad {
  id: string;
  name: string;
  note: string;
  createdAt?: number;
  updatedAt?: number;
}

export type NoteItem = Scratchpad;

interface ScratchpadState {
  scratchpads: Scratchpad[];
  openTabIds: string[];
  activeId: string;
  note: string; // for backward compatibility
  /** False until the first database load settles; the notes page waits on it. */
  notesLoaded: boolean;
  setNote: (note: string) => void;
  addScratchpad: (name?: string, initialContent?: string) => string;
  openNote: (id: string) => void;
  closeTab: (id: string) => void;
  deleteScratchpad: (id: string) => void; // alias for closeTab
  deleteNotePermanently: (id: string) => void;
  deleteMultipleNotes: (ids: string[]) => void;
  setActiveId: (id: string) => void;
  renameScratchpad: (id: string, name: string) => void;
  duplicateNote: (id: string) => string;
  closeScratchpadsToLeft: (id: string) => void;
  closeScratchpadsToRight: (id: string) => void;
  closeAllTabs: () => void;
  /** Starts the first database load. Safe to call repeatedly; the work runs once. */
  hydrateNotes: () => Promise<void>;
  /** Re-reads notes from SQLite; used by cross-window sync. */
  reloadFromDb: () => Promise<void>;
}

// Note rows live in SQLite. Which tabs are open, and which one is active, are per-window
// UI state and stay in localStorage so every window keeps its own layout.
const OPEN_TABS_KEY = 'desktop-scratchpads-open-tabs';
const ACTIVE_ID_KEY = 'desktop-scratchpad-active-id';

// Pre-SQLite storage. Read once during the migration below, then removed.
const LEGACY_NOTES_KEY = 'desktop-scratchpads';
const LEGACY_BODY_KEY = 'desktop-scratchpad';

const MAX_NOTES = 100;

function persistTabState(openTabIds: string[], activeId: string) {
  localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(openTabIds));
  localStorage.setItem(ACTIVE_ID_KEY, activeId);
}

function readStoredTabState(): { openTabIds: string[]; activeId: string } {
  const savedOpenTabIds = localStorage.getItem(OPEN_TABS_KEY);

  let openTabIds: string[] = [];
  if (savedOpenTabIds) {
    try {
      const parsed = JSON.parse(savedOpenTabIds);
      if (Array.isArray(parsed)) {
        openTabIds = parsed.filter((id): id is string => typeof id === 'string');
      }
    } catch {
      // fallback
    }
  }

  return { openTabIds, activeId: localStorage.getItem(ACTIVE_ID_KEY) ?? '' };
}

const getInitialState = () => ({
  scratchpads: [] as Scratchpad[],
  ...readStoredTabState(),
  note: '',
  notesLoaded: false,
});

const initialState = getInitialState();

/** Reconciles the stored per-window tab layout against the notes that actually exist. */
function reconcileTabs(notes: Scratchpad[]) {
  const { openTabIds: storedTabs, activeId: storedActiveId } = readStoredTabState();
  const ids = notes.map((s) => s.id);

  let openTabIds = storedTabs.filter((id) => ids.includes(id));
  // Preserve the pre-SQLite behaviour: with no stored tabs, open every note.
  if (openTabIds.length === 0) {
    openTabIds = ids;
  }

  const activeId = ids.includes(storedActiveId) ? storedActiveId : openTabIds[0] ?? '';
  return { openTabIds, activeId };
}

function readLegacyNotes(): Scratchpad[] {
  const raw = localStorage.getItem(LEGACY_NOTES_KEY);

  let parsed: Scratchpad[] = [];
  if (raw) {
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value)) {
        parsed = value;
      }
    } catch {
      // Ignore parsing errors and fallback
    }
  }

  const now = Date.now();
  if (parsed.length === 0) {
    const legacyBody = localStorage.getItem(LEGACY_BODY_KEY) ?? '';
    if (!legacyBody) return [];
    return [{ id: '1', name: 'Note 1', note: legacyBody, createdAt: now, updatedAt: now }];
  }

  // Fill in timestamps if missing
  return parsed.map((pad, idx) => ({
    ...pad,
    createdAt: pad.createdAt || now - (parsed.length - idx) * 1000,
    updatedAt: pad.updatedAt || now,
  }));
}

function clearLegacyKeys() {
  localStorage.removeItem(LEGACY_NOTES_KEY);
  localStorage.removeItem(LEGACY_BODY_KEY);
}

/** Loads notes from SQLite, importing the pre-SQLite localStorage store on first run. */
async function loadNotes(): Promise<Scratchpad[]> {
  const stored = await listNotes();
  if (stored.length > 0) return stored;

  const legacy = readLegacyNotes();
  if (legacy.length > 0) {
    await importNotes(legacy);
  }
  // The import either succeeded or there was nothing to import; either way the old
  // keys must not survive, or they would be re-imported on the next launch.
  clearLegacyKeys();

  return listNotes();
}

/** Trailing-window delay for persisting note edits. Keeps the per-keystroke editor
 *  path off a synchronous write without losing data on teardown. */
const NOTES_AUTOSAVE_DELAY_MS = 300;

let noteSaveTimer: ReturnType<typeof setTimeout> | null = null;
let hydrationPromise: Promise<void> | null = null;

function reportNoteError(action: string, error: unknown) {
  console.error(`[notes] failed to ${action}:`, error);
  toast.error('Failed to save note', {
    description: 'Your last change may not have been saved.',
  });
}

function persistNote(pad: Scratchpad) {
  void saveNote(pad).catch((error) => reportNoteError('save note', error));
}

/** Flushes the pending edit immediately. Reads from the store at call time so a
 *  debounced write can never resurrect an older snapshot over a newer one. */
export function persistNotesNow() {
  if (noteSaveTimer !== null) {
    clearTimeout(noteSaveTimer);
    noteSaveTimer = null;
  }
  const { scratchpads, activeId } = useScratchpadStore.getState();
  const activePad = scratchpads.find((s) => s.id === activeId);
  if (activePad) persistNote(activePad);
}

function scheduleNotePersist() {
  if (noteSaveTimer !== null) clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(() => {
    noteSaveTimer = null;
    const { scratchpads, activeId } = useScratchpadStore.getState();
    const activePad = scratchpads.find((s) => s.id === activeId);
    if (activePad) persistNote(activePad);
  }, NOTES_AUTOSAVE_DELAY_MS);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persistNotesNow);
  window.addEventListener('beforeunload', persistNotesNow);
}

function applyNotes(notes: Scratchpad[]) {
  const { openTabIds, activeId } = reconcileTabs(notes);
  const activePad = notes.find((s) => s.id === activeId) ?? notes[0];
  useScratchpadStore.setState({
    scratchpads: notes,
    openTabIds,
    activeId,
    note: activePad ? activePad.note : '',
    notesLoaded: true,
  });
}

async function runHydration() {
  try {
    let notes = await loadNotes();
    if (notes.length === 0) {
      // Seed through the idempotent import path so two windows starting together
      // converge on one row instead of each creating its own first note.
      const now = Date.now();
      await importNotes([{ id: '1', name: 'Note 1', note: '', createdAt: now, updatedAt: now }]);
      notes = await listNotes();
    }
    applyNotes(notes);
  } catch (error) {
    console.error('[notes] failed to load notes from the database:', error);
    useScratchpadStore.setState({ notesLoaded: true });
  }
}

export function hydrateNotes(): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = runHydration();
  }
  return hydrationPromise;
}

export const useScratchpadStore = create<ScratchpadState>()((set, get) => ({
  ...initialState,

  setNote: (note) => {
    const { scratchpads, activeId } = get();
    const now = Date.now();
    const updated = scratchpads.map((s) =>
      s.id === activeId ? { ...s, note, updatedAt: now } : s
    );
    set({ scratchpads: updated, note });
    scheduleNotePersist();
  },

  addScratchpad: (name?: string, initialContent?: string) => {
    const { scratchpads, openTabIds } = get();
    if (scratchpads.length >= MAX_NOTES) return '';

    let noteName = name?.trim();
    if (!noteName) {
      let index = 1;
      while (scratchpads.some((s) => s.name === `Note ${index}` || s.name === `Scratchpad ${index}`)) {
        index++;
      }
      noteName = `Note ${index}`;
    }

    const now = Date.now();
    const newPad: Scratchpad = {
      id: crypto.randomUUID(),
      name: noteName,
      note: initialContent ?? '',
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [...scratchpads, newPad];
    const updatedTabs = [...openTabIds.filter((id) => id !== newPad.id), newPad.id];

    persistTabState(updatedTabs, newPad.id);
    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: newPad.id,
      note: newPad.note,
    });
    persistNote(newPad);

    return newPad.id;
  },

  openNote: (id) => {
    const { scratchpads, openTabIds } = get();
    const target = scratchpads.find((s) => s.id === id);
    if (!target) return;

    const updatedTabs = openTabIds.includes(id) ? openTabIds : [...openTabIds, id];

    persistTabState(updatedTabs, id);
    set({
      openTabIds: updatedTabs,
      activeId: id,
      note: target.note,
    });
  },

  closeTab: (id) => {
    const { scratchpads, openTabIds, activeId } = get();
    const updatedTabs = openTabIds.filter((tabId) => tabId !== id);

    let nextActiveId = activeId;
    if (activeId === id) {
      const closedIndex = openTabIds.indexOf(id);
      const nextIndex = closedIndex > 0 ? closedIndex - 1 : 0;
      nextActiveId = updatedTabs[nextIndex] || '';
    }

    const activePad = scratchpads.find((s) => s.id === nextActiveId);

    persistTabState(updatedTabs, nextActiveId);
    set({
      openTabIds: updatedTabs,
      activeId: nextActiveId,
      note: activePad ? activePad.note : '',
    });
  },

  deleteScratchpad: (id) => {
    // Backward compatibility: closing a tab should NOT delete the note
    get().closeTab(id);
  },

  deleteNotePermanently: (id) => {
    const { scratchpads, openTabIds, activeId } = get();
    const updatedNotes = scratchpads.filter((s) => s.id !== id);
    const updatedTabs = openTabIds.filter((tabId) => tabId !== id);

    let nextActiveId = activeId;
    if (activeId === id) {
      const closedIndex = openTabIds.indexOf(id);
      const nextIndex = closedIndex > 0 ? closedIndex - 1 : 0;
      nextActiveId = updatedTabs[nextIndex] || (updatedNotes[0]?.id ?? '');
    }

    const activePad = updatedNotes.find((s) => s.id === nextActiveId);

    persistTabState(updatedTabs, nextActiveId);
    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: nextActiveId,
      note: activePad ? activePad.note : '',
    });

    void deleteNote(id).catch((error) => reportNoteError('delete note', error));
  },

  deleteMultipleNotes: (ids) => {
    const { scratchpads, openTabIds, activeId } = get();
    const idsSet = new Set(ids);
    const updatedNotes = scratchpads.filter((s) => !idsSet.has(s.id));
    const updatedTabs = openTabIds.filter((tabId) => !idsSet.has(tabId));

    let nextActiveId = activeId;
    if (idsSet.has(activeId)) {
      nextActiveId = updatedTabs[0] || (updatedNotes[0]?.id ?? '');
    }

    const activePad = updatedNotes.find((s) => s.id === nextActiveId);

    persistTabState(updatedTabs, nextActiveId);
    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: nextActiveId,
      note: activePad ? activePad.note : '',
    });

    void deleteNotes(ids).catch((error) => reportNoteError('delete notes', error));
  },

  setActiveId: (id) => {
    const { scratchpads, openTabIds } = get();
    const activePad = scratchpads.find((s) => s.id === id);
    if (!activePad) return;

    persistTabState(openTabIds, id);
    set({ activeId: id, note: activePad.note });
  },

  renameScratchpad: (id, name) => {
    const { scratchpads, activeId } = get();
    const trimmed = name.trim();
    if (!trimmed) return;

    const now = Date.now();
    const updated = scratchpads.map((s) =>
      s.id === id ? { ...s, name: trimmed, updatedAt: now } : s
    );

    const activePad = updated.find((s) => s.id === activeId);
    set({ scratchpads: updated, note: activePad ? activePad.note : get().note });

    const renamed = updated.find((s) => s.id === id);
    if (renamed) persistNote(renamed);
  },

  duplicateNote: (id) => {
    const { scratchpads, openTabIds } = get();
    const source = scratchpads.find((s) => s.id === id);
    if (!source) return '';

    const now = Date.now();
    const newPad: Scratchpad = {
      id: crypto.randomUUID(),
      name: `${source.name} (Copy)`,
      note: source.note,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [...scratchpads, newPad];
    const updatedTabs = [...openTabIds, newPad.id];

    persistTabState(updatedTabs, newPad.id);
    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: newPad.id,
      note: newPad.note,
    });
    persistNote(newPad);

    return newPad.id;
  },

  closeScratchpadsToLeft: (id) => {
    const { scratchpads, openTabIds, activeId } = get();
    const index = openTabIds.indexOf(id);
    if (index <= 0) return;

    const updatedTabs = openTabIds.slice(index);
    let nextActiveId = activeId;
    if (!updatedTabs.includes(activeId)) {
      nextActiveId = id;
    }
    const activePad = scratchpads.find((s) => s.id === nextActiveId);

    persistTabState(updatedTabs, nextActiveId);
    set({ openTabIds: updatedTabs, activeId: nextActiveId, note: activePad ? activePad.note : '' });
  },

  closeScratchpadsToRight: (id) => {
    const { scratchpads, openTabIds, activeId } = get();
    const index = openTabIds.indexOf(id);
    if (index === -1 || index >= openTabIds.length - 1) return;

    const updatedTabs = openTabIds.slice(0, index + 1);
    let nextActiveId = activeId;
    if (!updatedTabs.includes(activeId)) {
      nextActiveId = id;
    }
    const activePad = scratchpads.find((s) => s.id === nextActiveId);

    persistTabState(updatedTabs, nextActiveId);
    set({ openTabIds: updatedTabs, activeId: nextActiveId, note: activePad ? activePad.note : '' });
  },

  closeAllTabs: () => {
    persistTabState([], '');
    set({ openTabIds: [], activeId: '', note: '' });
  },

  hydrateNotes,

  reloadFromDb: async () => {
    try {
      const notes = await listNotes();
      applyNotes(notes);
    } catch (error) {
      console.error('[notes] failed to reload notes from the database:', error);
    }
  },
}));

// Hydrate as soon as the store is first imported so any window showing a notes surface
// (the page or the desktop widget) has data without each one wiring up its own load.
if (typeof window !== 'undefined' && isTauriAvailable()) {
  void hydrateNotes();
}