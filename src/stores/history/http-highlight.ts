import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export const MAX_HIGHLIGHTS = 6;

export const HIGHLIGHT_COLORS = [
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
];

export const HIGHLIGHT_COLOR_LABELS: Record<string, string> = {
  '#f43f5e': 'Rose',
  '#f97316': 'Orange',
  '#eab308': 'Yellow',
  '#22c55e': 'Green',
  '#3b82f6': 'Blue',
  '#a855f7': 'Purple',
};

export function normalizeHighlightHost(host: string): string {
  if (!host || host === '-') return '';
  return host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0];
}

export function normalizeHighlightPath(path: string | null | undefined): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/' || trimmed === '/*') return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function makeKey(host: string, path: string): string {
  const normHost = normalizeHighlightHost(host);
  const normPath = normalizeHighlightPath(path);
  return `${normHost}|${normPath}`;
}

interface HighlightState {
  highlightedHosts: Record<string, string>;

  highlightHost: (host: string, path: string, color: string) => void;
  removeHighlight: (host: string, path: string) => void;
  getHighlightColor: (host: string, path: string) => string | undefined;
}

export const useHighlightStore = create<HighlightState>()(
  persist(
    (set, get) => ({
      highlightedHosts: {},

      highlightHost: (host: string, path: string, color: string) => {
        const { highlightedHosts } = get();
        const normHost = normalizeHighlightHost(host);
        const normPath = normalizeHighlightPath(path);
        const key = makeKey(host, path);

        if (!normHost) return;

        const currentColor = highlightedHosts[key];

        if (currentColor === color) {
          const { [key]: _, ...rest } = highlightedHosts;
          set({ highlightedHosts: rest });
          toast.success(`Removed highlight from ${normHost}${normPath ? ` ${normPath}` : ''}`);
          return;
        }

        if (!currentColor && Object.keys(highlightedHosts).length >= MAX_HIGHLIGHTS) {
          toast.warning(`Maximum ${MAX_HIGHLIGHTS} highlights reached. Remove a highlight first.`);
          return;
        }

        set({
          highlightedHosts: { ...highlightedHosts, [key]: color },
        });

        const label = HIGHLIGHT_COLOR_LABELS[color] || color;
        const display = `${normHost}${normPath ? ` ${normPath}` : ''}`;
        toast.success(
          currentColor
            ? `Changed ${display} highlight to ${label}`
            : `Highlighted ${display} with ${label}`
        );
      },

      removeHighlight: (host: string, path: string) => {
        const normHost = normalizeHighlightHost(host);
        const normPath = normalizeHighlightPath(path);
        const key = makeKey(host, path);
        if (!normHost) return;
        set((state) => {
          const { [key]: _, ...rest } = state.highlightedHosts;
          return { highlightedHosts: rest };
        });
        toast.success(`Removed highlight from ${normHost}${normPath ? ` ${normPath}` : ''}`);
      },

      getHighlightColor: (host: string, path: string) => {
        const { highlightedHosts } = get();
        if (!host || host === '-') return undefined;

        const normHost = normalizeHighlightHost(host);
        const normPath = normalizeHighlightPath(path);
        const [normPathname] = normPath.split('?');

        // 1. Exact match with query or path
        const exactKey = `${normHost}|${normPath}`;
        if (highlightedHosts[exactKey]) return highlightedHosts[exactKey];

        // 2. Match pathname if query string differed
        if (normPathname && normPathname !== normPath) {
          const pathnameKey = `${normHost}|${normPathname}`;
          if (highlightedHosts[pathnameKey]) return highlightedHosts[pathnameKey];
        }

        // 3. Match host-only highlight
        const hostOnlyKey = `${normHost}|`;
        if (highlightedHosts[hostOnlyKey]) return highlightedHosts[hostOnlyKey];

        // 4. Match without port if host had port
        const hostNoPort = normHost.split(':')[0];
        if (hostNoPort !== normHost) {
          if (highlightedHosts[`${hostNoPort}|${normPath}`]) return highlightedHosts[`${hostNoPort}|${normPath}`];
          if (normPathname && highlightedHosts[`${hostNoPort}|${normPathname}`]) {
            return highlightedHosts[`${hostNoPort}|${normPathname}`];
          }
          if (highlightedHosts[`${hostNoPort}|`]) return highlightedHosts[`${hostNoPort}|`];
        }

        return undefined;
      },
    }),
    { name: 'hexbuffer-highlights' }
  )
);
