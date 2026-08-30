import { create } from 'zustand';

export interface Scratchpad {
  id: string;
  name: string;
  note: string;
  createdAt?: number;
  updatedAt?: number;
  isPinned?: boolean;
  tags?: string[];
}

export type NoteItem = Scratchpad;

interface ScratchpadState {
  scratchpads: Scratchpad[];
  openTabIds: string[];
  activeId: string;
  note: string; // for backward compatibility
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
}

// ponytail: keep initial state loading simple and self-contained
const getInitialState = () => {
  const savedScratchpads = localStorage.getItem('desktop-scratchpads');
  const savedActiveId = localStorage.getItem('desktop-scratchpad-active-id');
  const savedOpenTabIds = localStorage.getItem('desktop-scratchpads-open-tabs');
  const legacyNote = localStorage.getItem('desktop-scratchpad') ?? '';

  let scratchpads: Scratchpad[] = [];
  if (savedScratchpads) {
    try {
      scratchpads = JSON.parse(savedScratchpads);
    } catch {
      // Ignore parsing errors and fallback
    }
  }

  const now = Date.now();
  if (!scratchpads || scratchpads.length === 0) {
    scratchpads = [{ id: '1', name: 'Note 1', note: legacyNote, createdAt: now, updatedAt: now }];
  } else {
    // Fill in timestamps if missing
    scratchpads = scratchpads.map((s, idx) => ({
      ...s,
      createdAt: s.createdAt || now - (scratchpads.length - idx) * 1000,
      updatedAt: s.updatedAt || now,
    }));
  }

  let openTabIds: string[] = [];
  if (savedOpenTabIds) {
    try {
      const parsed = JSON.parse(savedOpenTabIds);
      if (Array.isArray(parsed)) {
        openTabIds = parsed.filter((id) => scratchpads.some((s) => s.id === id));
      }
    } catch {
      // fallback
    }
  }

  // If no open tabs stored, default to opening all existing notes or the first one
  if (openTabIds.length === 0) {
    openTabIds = scratchpads.map((s) => s.id);
  }

  const activeId =
    savedActiveId && openTabIds.includes(savedActiveId)
      ? savedActiveId
      : openTabIds[0] || scratchpads[0]?.id || '';

  const activePad = scratchpads.find((s) => s.id === activeId) || scratchpads[0];

  return {
    scratchpads,
    openTabIds,
    activeId,
    note: activePad ? activePad.note : '',
  };
};

const initialState = getInitialState();

export const useScratchpadStore = create<ScratchpadState>()((set, get) => ({
  ...initialState,

  setNote: (note) => {
    const { scratchpads, activeId } = get();
    const now = Date.now();
    const updated = scratchpads.map((s) =>
      s.id === activeId ? { ...s, note, updatedAt: now } : s
    );
    localStorage.setItem('desktop-scratchpads', JSON.stringify(updated));
    localStorage.setItem('desktop-scratchpad', note);
    set({ scratchpads: updated, note });
  },

  addScratchpad: (name?: string, initialContent?: string) => {
    const { scratchpads, openTabIds } = get();
    if (scratchpads.length >= 100) return '';

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
      id: Date.now().toString(),
      name: noteName,
      note: initialContent ?? '',
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [...scratchpads, newPad];
    const updatedTabs = [...openTabIds.filter((id) => id !== newPad.id), newPad.id];

    localStorage.setItem('desktop-scratchpads', JSON.stringify(updatedNotes));
    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', newPad.id);
    localStorage.setItem('desktop-scratchpad', newPad.note);

    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: newPad.id,
      note: newPad.note,
    });

    return newPad.id;
  },

  openNote: (id) => {
    const { scratchpads, openTabIds } = get();
    const target = scratchpads.find((s) => s.id === id);
    if (!target) return;

    const updatedTabs = openTabIds.includes(id) ? openTabIds : [...openTabIds, id];

    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', id);
    localStorage.setItem('desktop-scratchpad', target.note);

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

    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', nextActiveId);
    localStorage.setItem('desktop-scratchpad', activePad ? activePad.note : '');

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

    localStorage.setItem('desktop-scratchpads', JSON.stringify(updatedNotes));
    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', nextActiveId);
    localStorage.setItem('desktop-scratchpad', activePad ? activePad.note : '');

    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: nextActiveId,
      note: activePad ? activePad.note : '',
    });
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

    localStorage.setItem('desktop-scratchpads', JSON.stringify(updatedNotes));
    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', nextActiveId);
    localStorage.setItem('desktop-scratchpad', activePad ? activePad.note : '');

    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: nextActiveId,
      note: activePad ? activePad.note : '',
    });
  },

  setActiveId: (id) => {
    const { scratchpads } = get();
    const activePad = scratchpads.find((s) => s.id === id);
    if (!activePad) return;

    localStorage.setItem('desktop-scratchpad-active-id', id);
    localStorage.setItem('desktop-scratchpad', activePad.note);
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
    localStorage.setItem('desktop-scratchpads', JSON.stringify(updated));

    const activePad = updated.find((s) => s.id === activeId);
    set({ scratchpads: updated, note: activePad ? activePad.note : get().note });
  },

  duplicateNote: (id) => {
    const { scratchpads, openTabIds } = get();
    const source = scratchpads.find((s) => s.id === id);
    if (!source) return '';

    const now = Date.now();
    const newPad: Scratchpad = {
      id: Date.now().toString(),
      name: `${source.name} (Copy)`,
      note: source.note,
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [...scratchpads, newPad];
    const updatedTabs = [...openTabIds, newPad.id];

    localStorage.setItem('desktop-scratchpads', JSON.stringify(updatedNotes));
    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', newPad.id);
    localStorage.setItem('desktop-scratchpad', newPad.note);

    set({
      scratchpads: updatedNotes,
      openTabIds: updatedTabs,
      activeId: newPad.id,
      note: newPad.note,
    });

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

    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', nextActiveId);
    localStorage.setItem('desktop-scratchpad', activePad ? activePad.note : '');
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

    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify(updatedTabs));
    localStorage.setItem('desktop-scratchpad-active-id', nextActiveId);
    localStorage.setItem('desktop-scratchpad', activePad ? activePad.note : '');
    set({ openTabIds: updatedTabs, activeId: nextActiveId, note: activePad ? activePad.note : '' });
  },

  closeAllTabs: () => {
    localStorage.setItem('desktop-scratchpads-open-tabs', JSON.stringify([]));
    localStorage.setItem('desktop-scratchpad-active-id', '');
    localStorage.setItem('desktop-scratchpad', '');
    set({ openTabIds: [], activeId: '', note: '' });
  },
}));

