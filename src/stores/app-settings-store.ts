import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_HIDDEN_WIDGETS, DEFAULT_WIDGET_ORDER } from '@/pages/desktop/constants'

export { DEFAULT_HIDDEN_WIDGETS, DEFAULT_WIDGET_ORDER }

export type BgType = 'none' | 'color' | 'image';
export type AppTheme = 'dark' | 'light';

interface AppSettingsState {
  hiddenNavItems: string[]
  pinnedNavItems: string[]
  recentApps: string[]
  bgType: BgType
  bgValue: string // hex color or data URL
  theme: AppTheme
  hiddenWidgets: string[]
  widgetOrder: string[]
  setBg: (type: BgType, value: string) => void
  clearBg: () => void
  setTheme: (t: AppTheme) => void
  toggleNavItem: (href: string) => void
  resetHiddenNavItems: () => void
  togglePinNavItem: (href: string) => void
  reorderPinnedNavItems: (fromIndex: number, toIndex: number) => void
  addRecentApp: (href: string) => void
  removeRecentApp: (href: string) => void
  toggleWidget: (widgetId: string) => void
  reorderWidgets: (fromIndex: number, toIndex: number) => void
  setWidgetOrder: (order: string[]) => void
  resetHiddenWidgets: () => void
}

type PersistedSettings = Pick<AppSettingsState, 'hiddenNavItems' | 'pinnedNavItems' | 'recentApps' | 'bgType' | 'bgValue' | 'theme' | 'hiddenWidgets' | 'widgetOrder'>

export const useAppSettingsStore = create<AppSettingsState>()(
  persist<AppSettingsState, [], [], PersistedSettings>(
    (set) => ({
      hiddenNavItems: [],
      pinnedNavItems: [
        '/http-history',
        '/websocket-history',
        '/intercept',
        '/repeater',
        '/browser',
        '/documents',
      ],
      recentApps: [],
      bgType: 'none',
      bgValue: '',
      theme: 'dark',
      hiddenWidgets: DEFAULT_HIDDEN_WIDGETS,
      widgetOrder: DEFAULT_WIDGET_ORDER,
      setBg: (type, value) => set({ bgType: type, bgValue: value }),
      clearBg: () => set({ bgType: 'none', bgValue: '' }),
      setTheme: (t) => set({ theme: t }),
      toggleNavItem: (href) =>
        set((state) => ({
          hiddenNavItems: state.hiddenNavItems.includes(href)
            ? state.hiddenNavItems.filter((h) => h !== href)
            : [...state.hiddenNavItems, href],
        })),
      resetHiddenNavItems: () => set({ hiddenNavItems: [] }),
      togglePinNavItem: (href) =>
        set((state) => ({
          pinnedNavItems: state.pinnedNavItems.includes(href)
            ? state.pinnedNavItems.filter((h) => h !== href)
            : [...state.pinnedNavItems, href],
        })),
      reorderPinnedNavItems: (fromIndex, toIndex) =>
        set((state) => {
          const items = [...state.pinnedNavItems];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          return { pinnedNavItems: items };
        }),
      addRecentApp: (href) =>
        set((state) => {
          const filtered = (state.recentApps || []).filter((h) => h !== href);
          const updated = [href, ...filtered].slice(0, 5);
          return { recentApps: updated };
        }),
      removeRecentApp: (href) =>
        set((state) => ({
          recentApps: (state.recentApps || []).filter((h) => h !== href),
        })),
      toggleWidget: (widgetId) =>
        set((state) => ({
          hiddenWidgets: (state.hiddenWidgets || []).includes(widgetId)
            ? (state.hiddenWidgets || []).filter((w) => w !== widgetId)
            : [...(state.hiddenWidgets || []), widgetId],
        })),
      reorderWidgets: (fromIndex, toIndex) =>
        set((state) => {
          const current = state.widgetOrder && state.widgetOrder.length > 0
            ? [...state.widgetOrder]
            : [...DEFAULT_WIDGET_ORDER];
          const [moved] = current.splice(fromIndex, 1);
          current.splice(toIndex, 0, moved);
          return { widgetOrder: current };
        }),
      setWidgetOrder: (order) => set({ widgetOrder: order }),
      resetHiddenWidgets: () =>
        set({
          hiddenWidgets: DEFAULT_HIDDEN_WIDGETS,
          widgetOrder: DEFAULT_WIDGET_ORDER,
        }),
    }),
    {
      name: 'hexbuffer-app-settings',
      partialize: (state) => ({
        hiddenNavItems: state.hiddenNavItems,
        pinnedNavItems: state.pinnedNavItems,
        recentApps: state.recentApps,
        bgType: state.bgType,
        bgValue: state.bgValue,
        theme: state.theme,
        hiddenWidgets: state.hiddenWidgets,
        widgetOrder: state.widgetOrder,
      }),
      merge: (persisted, current): AppSettingsState => {
        const base = current as AppSettingsState
        const state = persisted as Partial<PersistedSettings> | undefined
        return {
          ...base,
          hiddenNavItems: state?.hiddenNavItems ?? base.hiddenNavItems,
          pinnedNavItems: state?.pinnedNavItems ?? base.pinnedNavItems,
          recentApps: state?.recentApps ?? base.recentApps,
          bgType: state?.bgType ?? base.bgType,
          bgValue: state?.bgValue ?? base.bgValue,
          theme: state?.theme ?? base.theme,
          hiddenWidgets: state?.hiddenWidgets ?? base.hiddenWidgets,
          widgetOrder: state?.widgetOrder ?? base.widgetOrder,
        }
      },
    }
  )
)

