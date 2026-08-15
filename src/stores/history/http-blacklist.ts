import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { ApiCall } from '@/types';

export const MAX_BLACKLIST_RULES = 50;

export interface BlacklistRule {
  id: string;
  host: string;
  path: string | null;
  createdAt: number;
}

export function extractCallHost(call: Partial<ApiCall> | null | undefined): string {
  if (!call) return '';
  const rawHost = call.host && call.host !== '-' ? call.host.trim() : '';
  if (rawHost && !rawHost.includes('/')) {
    return rawHost.toLowerCase();
  }
  const headerHost = call.headers?.['host'] || call.headers?.['Host'] || call.headers?.[':authority'];
  if (headerHost && typeof headerHost === 'string' && headerHost.trim()) {
    return headerHost.trim().toLowerCase();
  }
  if (call.url && call.url.trim()) {
    try {
      const withScheme = call.url.includes('://') ? call.url : `http://${call.url}`;
      const urlObj = new URL(withScheme);
      if (urlObj.host) return urlObj.host.toLowerCase();
    } catch {
      const parsed = call.url.replace(/^https?:\/\//i, '').split('/')[0].trim();
      if (parsed) return parsed.toLowerCase();
    }
  }
  if (call.server_ip && call.server_ip.trim() && !call.server_ip.startsWith('/')) {
    return call.server_ip.trim().toLowerCase();
  }
  return '';
}

export function normalizeHost(host: string): string {
  if (!host || host === '-') return '';
  return host
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0];
}

export function isHostMatch(callHost: string, ruleHost: string): boolean {
  if (!callHost || !ruleHost) return false;
  const cHost = normalizeHost(callHost);
  const rHost = normalizeHost(ruleHost);
  if (cHost === rHost) return true;

  const cHostNoPort = cHost.split(':')[0];
  const rHostNoPort = rHost.split(':')[0];
  return cHostNoPort === rHostNoPort;
}

export function normalizePath(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/' || trimmed === '/*') return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function isPathMatch(callPathRaw: string | null | undefined, rulePathRaw: string | null): boolean {
  if (rulePathRaw === null || rulePathRaw === undefined || rulePathRaw === '' || rulePathRaw === '/*') {
    return true;
  }
  const callPath = normalizePath(callPathRaw) ?? '/';
  const rulePath = normalizePath(rulePathRaw) ?? '/';

  // 1. Exact match
  if (callPath === rulePath) return true;

  const [callPathname, callSearch] = callPath.split('?');
  const [rulePathname, ruleSearch] = rulePath.split('?');

  // 2. Query parameter matching if specified in rule
  if (ruleSearch) {
    return callPathname === rulePathname && Boolean(callSearch?.includes(ruleSearch));
  }

  // 3. Pathname exact match (ignoring query strings on incoming call)
  if (callPathname === rulePathname) return true;

  // 4. Subpath match
  const cleanRulePathname = rulePathname.endsWith('/') ? rulePathname : `${rulePathname}/`;
  if (callPathname.startsWith(cleanRulePathname)) {
    return true;
  }

  return false;
}

interface BlacklistState {
  rules: BlacklistRule[];

  addRule: (host: string, path?: string | null) => string | null;
  removeRule: (id: string) => void;
  isBlacklisted: (call: ApiCall) => boolean;
  getMatchingRule: (call: ApiCall) => BlacklistRule | undefined;
}

export const useBlacklistStore = create<BlacklistState>()(
  persist(
    (set, get) => ({
      rules: [],

      addRule: (host: string, path?: string | null) => {
        const { rules } = get();
        const normalizedHost = normalizeHost(host);
        const normalizedPath = normalizePath(path);

        if (!normalizedHost) return null;

        const exists = rules.some(
          (r) => normalizeHost(r.host) === normalizedHost && normalizePath(r.path) === normalizedPath
        );
        if (exists) {
          toast.info('This pattern is already blacklisted');
          return null;
        }

        if (rules.length >= MAX_BLACKLIST_RULES) {
          toast.warning(`Maximum ${MAX_BLACKLIST_RULES} blacklist rules reached. Remove a rule first.`);
          return null;
        }

        const id = crypto.randomUUID();
        const newRule: BlacklistRule = {
          id,
          host: normalizedHost,
          path: normalizedPath,
          createdAt: Date.now(),
        };
        set({ rules: [...rules, newRule] });
        toast.success(
          normalizedPath
            ? `Blacklisted ${normalizedHost}${normalizedPath}`
            : `Blacklisted all requests from ${normalizedHost}`
        );
        return id;
      },

      removeRule: (id: string) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }));
        toast.success('Blacklist rule removed');
      },

      isBlacklisted: (call: ApiCall) => {
        const { rules } = get();
        if (rules.length === 0) return false;
        const callHost = extractCallHost(call);
        return rules.some((rule) => {
          if (!isHostMatch(callHost, rule.host)) return false;
          return isPathMatch(call.path, rule.path);
        });
      },

      getMatchingRule: (call: ApiCall) => {
        const { rules } = get();
        if (rules.length === 0) return undefined;
        const callHost = extractCallHost(call);
        return rules.find((rule) => {
          if (!isHostMatch(callHost, rule.host)) return false;
          return isPathMatch(call.path, rule.path);
        });
      },
    }),
    { name: 'hexbuffer-blacklist' }
  )
);
