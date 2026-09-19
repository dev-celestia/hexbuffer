import { invokeTauri } from '@/lib/ipc';
import type {
  ProxyRecord,
  ProxyLogSummary,
  HttpSessionSummary,
  HttpSessionRecord,
  ProxyDbFilterConfig,
} from '@/types';

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

export const HTTP_LOGS_LIMIT = 100;

export async function getHttpLogs(
  limit: number = HTTP_LOGS_LIMIT,
  filter?: ProxyFilter,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ProxyLogSummary[]> {
  return invokeTauri('get_proxy_recent', {
    limit,
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

