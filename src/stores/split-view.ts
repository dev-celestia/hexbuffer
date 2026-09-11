import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNavStore } from './nav';

export type SplitLayoutType = 'split-2' | 'split-3' | 'split-4';

export interface SplitViewState {
  layout: SplitLayoutType;
  slots: Record<string, string | null>;
  setLayout: (layout: SplitLayoutType) => void;
  setSlotApp: (slotId: string, appHref: string | null) => void;
  clearSlot: (slotId: string) => void;
  resetAllSlots: () => void;
  openSplitWindow: (layout?: SplitLayoutType, navigate?: (path: string) => void) => Promise<void> | void;
}

const DEFAULT_SLOTS: Record<string, string | null> = {
  'slot-0': null,
  'slot-1': null,
  'slot-2': null,
  'slot-3': null,
};

export const useSplitViewStore = create<SplitViewState>()(
  persist(
    (set, get) => ({
      layout: 'split-2',
      slots: { ...DEFAULT_SLOTS },

      setLayout: (layout: SplitLayoutType) => {
        set({ layout });
      },

      setSlotApp: (slotId: string, appHref: string | null) => {
        set((state) => ({
          slots: {
            ...state.slots,
            [slotId]: appHref,
          },
        }));
      },

      clearSlot: (slotId: string) => {
        set((state) => ({
          slots: {
            ...state.slots,
            [slotId]: null,
          },
        }));
      },

      resetAllSlots: () => {
        set({
          slots: { ...DEFAULT_SLOTS },
        });
      },

      openSplitWindow: async (layout?: SplitLayoutType, navigate?: (path: string) => void) => {
        if (layout) {
          set({ layout });
        }
        try {
          const { openSubAppWindow } = await import('@/lib/sub-window');
          await openSubAppWindow('/split-view', 'Split View');
        } catch (e) {
          console.warn('[split-view] Sub-window fallback to workspace window:', e);
          const nav = useNavStore.getState();
          nav.openWindow('/split-view', 'Split View');
          nav.focusWindow('/split-view', navigate);
        }
      },
    }),
    {
      name: 'hexbuffer-split-view',
      partialize: (state) => ({
        layout: state.layout,
        slots: state.slots,
      }),
    }
  )
);
