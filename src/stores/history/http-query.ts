import { create } from 'zustand';

export interface HistoryFilterState {
  search: string;
  methods: Set<string>;
  statusCodes: Set<string>;
  pathFilter: string | null;
}

interface HistoryQueryState {
  filter: HistoryFilterState;
  activeScope: string[] | null;
  sortOrder: 'asc' | 'desc';
  selectedCallId: string | null;
  isStreamManuallyPaused: boolean;
  refreshKey: number;

  setSearch: (search: string) => void;
  setFilter: (filter: HistoryFilterState) => void;
  setPathFilter: (path: string | null) => void;
  setActiveScope: (scope: string[] | null) => void;
  toggleMethod: (method: string) => void;
  toggleStatus: (status: string) => void;
  clearFilters: () => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSelectedCallId: (id: string | null) => void;
  setStreamManuallyPaused: (paused: boolean) => void;
  triggerRefresh: () => void;
}

const initialFilterState = (): HistoryFilterState => ({
  search: '',
  methods: new Set(),
  statusCodes: new Set(),
  pathFilter: null,
});

export const useHttpHistoryQueryStore = create<HistoryQueryState>()((set) => ({
  filter: initialFilterState(),
  activeScope: null,
  sortOrder: 'desc',
  selectedCallId: null,
  isStreamManuallyPaused: false,
  refreshKey: 0,

  setSearch: (search) =>
    set((state) => ({
      filter: { ...state.filter, search },
    })),

  setFilter: (filter) =>
    set({
      filter,
    }),

  setPathFilter: (path) =>
    set((state) => ({
      filter: { ...state.filter, pathFilter: path },
    })),

  setActiveScope: (scope) =>
    set((state) => {
      const normalizedScope = scope && scope.length > 0 ? [...scope] : null;
      const currentScope = state.activeScope && state.activeScope.length > 0 ? state.activeScope : null;

      const isSameScope =
        JSON.stringify(currentScope ?? []) === JSON.stringify(normalizedScope ?? []);

      if (isSameScope) {
        return state;
      }

      return {
        activeScope: normalizedScope,
        selectedCallId: null,
      };
    }),

  toggleMethod: (method) =>
    set((state) => {
      const next = new Set(state.filter.methods);
      if (next.has(method)) {
        next.delete(method);
      } else {
        next.add(method);
      }

      return {
        filter: { ...state.filter, methods: next },
      };
    }),

  toggleStatus: (status) =>
    set((state) => {
      const next = new Set(state.filter.statusCodes);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }

      return {
        filter: { ...state.filter, statusCodes: next },
      };
    }),

  clearFilters: () =>
    set({
      filter: initialFilterState(),
      selectedCallId: null,
    }),

  setSortOrder: (order) =>
    set({
      sortOrder: order,
    }),

  setSelectedCallId: (id) => set({ selectedCallId: id }),

  setStreamManuallyPaused: (paused) => set({ isStreamManuallyPaused: paused }),

  triggerRefresh: () =>
    set((state) => ({
      refreshKey: state.refreshKey + 1,
    })),
}));
