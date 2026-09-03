import { invoke } from '@tauri-apps/api/core';
import type {
  ProxyRecord,
  ProxyLogSummary,
  PaginatedResponse,
  HttpSessionSummary,
  HttpSessionRecord,
  ProxyDbFilterConfig,
} from '@/types';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? error.message : undefined;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window !== 'undefined' && !window.__TAURI_INTERNALS__) {
    throw new Error('Tauri backend is unavailable. Start the desktop app with `pnpm tauri`, not `pnpm dev`.');
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(toErrorMessage(error, `Failed to run Tauri command: ${command}`));
  }
}

export interface ProxyFilter {
  search: string | null;
  path: string | null;
  methods: string[] | null;
  status_codes: number[] | null;
  scope: string[] | null;
  session_id?: string | null;
}

export async function getHttpSessions(): Promise<HttpSessionSummary[]> {
  return invokeTauri('get_http_sessions');
}

export async function createHttpSession(
  name: string,
  description?: string,
  captureMode?: string,
  captureFilter?: string,
  excludeFilter?: string,
  storageMode?: string
): Promise<HttpSessionRecord> {
  return invokeTauri('create_http_session', {
    name,
    description: description || null,
    captureMode: captureMode || null,
    captureFilter: captureFilter || null,
    excludeFilter: excludeFilter || null,
    storageMode: storageMode || null,
  });
}

export async function promoteSession(sessionId: string): Promise<void> {
  return invokeTauri('promote_session', { sessionId });
}

export async function updateHttpSessionFilter(
  sessionId: string,
  captureMode: string,
  captureFilter: string,
  excludeFilter: string
): Promise<void> {
  return invokeTauri('update_http_session_filter', {
    sessionId,
    captureMode,
    captureFilter,
    excludeFilter,
  });
}

export async function getProxyDbFilter(): Promise<ProxyDbFilterConfig> {
  return invokeTauri('get_proxy_db_filter');
}

export async function setProxyDbFilter(config: ProxyDbFilterConfig): Promise<void> {
  return invokeTauri('set_proxy_db_filter', { config });
}

export async function setActiveHttpSession(sessionId: string): Promise<void> {
  return invokeTauri('set_active_http_session', { sessionId });
}

export async function deleteHttpSession(sessionId: string): Promise<void> {
  return invokeTauri('delete_http_session', { sessionId });
}

export async function renameHttpSession(sessionId: string, name: string): Promise<void> {
  return invokeTauri('rename_http_session', { sessionId, name });
}

export async function clearHttpSessionLogs(sessionId: string): Promise<number> {
  return invokeTauri('clear_http_session_logs', { sessionId });
}

export async function getHttpLogs(
  page: number,
  perPage: number = 60,
  filter?: ProxyFilter,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResponse<ProxyLogSummary>> {
  return invokeTauri('get_proxy_paginated', {
    page,
    perPage,
    filter,
    sortOrder,
  });
}

export async function getHttpLogDetail(logId: string): Promise<ProxyRecord> {
  return invokeTauri('get_proxy_detail', {
    logId,
  });
}

export async function getCaCert(): Promise<string> {
  return invokeTauri<string>('get_ca_cert');
}

export async function regenerateCaCert(): Promise<void> {
  return invokeTauri('regenerate_ca_cert');
}

export async function saveCaCert(path: string, content: string): Promise<void> {
  return invokeTauri('save_ca_cert', { path, content });
}

export async function trustInterceptCa(): Promise<string> {
  return invokeTauri<string>('trust_intercept_ca');
}

