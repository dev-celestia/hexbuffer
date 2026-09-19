import { invokeTauri } from '@/lib/ipc';
import type { PaginatedResponse } from '@/types';

export interface WebSocketFilter {
  search: string | null;
  scope: string[] | null;
  states?: string[] | null;
  session_id?: string | null;
}

export interface WebSocketConnectionSummary {
  id: string;
  session_id?: string;
  timestamp: string;
  url: string;
  host: string;
  path: string;
  direction: string;
  state: string;
  message_count: number;
  last_activity_at: string;
}

export interface WebSocketConnectionRecord {
  id: string;
  session_id?: string;
  timestamp: string;
  url: string;
  host: string;
  path: string;
  handshake_request_headers: Record<string, string>;
  handshake_response_status: number | null;
  handshake_response_headers: Record<string, string>;
  client_addr: string;
  server_addr: string;
  state: string;
  message_count: number;
  last_activity_at: string;
}

export interface WebSocketMessageRecord {
  id: string;
  connection_id: string;
  timestamp: string;
  direction: string;
  message_type: string;
  payload: number[];
  payload_size: number;
}

export interface WebSocketConnectionDetail {
  connection: WebSocketConnectionRecord;
  messages: WebSocketMessageRecord[];
}

export async function getWebSocketLogs(
  page: number,
  perPage: number = 60,
  filter?: WebSocketFilter
): Promise<PaginatedResponse<WebSocketConnectionSummary>> {
  return invokeTauri('get_websocket_paginated', {
    page,
    perPage,
    filter,
  });
}

export async function getWebSocketDetail(connectionId: string): Promise<WebSocketConnectionDetail> {
  return invokeTauri('get_websocket_detail', {
    connectionId,
  });
}

export async function deleteWebSocket(connectionId: string): Promise<void> {
  await invokeTauri('delete_websocket_by_id', { connectionId });
}

export async function clearWebSocketAll(): Promise<void> {
  await invokeTauri('clear_websocket_all');
}
