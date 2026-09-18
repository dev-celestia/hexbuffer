import { invoke } from '@tauri-apps/api/core';
import type {
  ListenerDashboardStats,
  ListenerInteraction,
  ListenerPayload,
  ListenerServer,
  CreatePayloadRequest,
  CreateServerRequest,
} from './types';

/**
 * Wire shapes — exactly what serde emits for the structs in `src-tauri/src/collaborator/types.rs`.
 *
 * serde carries no `rename_all` on those structs, so the fields are snake_case, and Rust's
 * `Option<String>` arrives as `string | null`. Naming them lets the `map*` helpers below be typed:
 * with `any` inputs, renaming a field on *either* side of the IPC boundary is silent — the mapper
 * yields `undefined` and the UI renders a blank — which is the exact bug class this mapping layer
 * exists to prevent. A typed input turns such a rename into a compile error.
 *
 * `status` and `interaction_type` are `string` here rather than the narrower unions declared in
 * `./types`, because the Rust structs type them as an unconstrained `String`. The mappers below
 * therefore *assert* the union with a cast. That assertion is documented rather than checked, and
 * is the one remaining unsound edge in this file.
 */
interface ServerWire {
  id: string;
  name: string;
  url: string;
  api_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PayloadWire {
  id: string;
  server_id: string;
  identifier: string;
  payload_url: string;
  name: string;
  description: string;
  tags: string;
  interaction_count: number;
  status: string;
  created_at: string;
  last_seen_at: string | null;
}

interface InteractionWire {
  id: string;
  payload_id: string;
  interaction_type: string;
  source_ip: string;
  method: string | null;
  path: string | null;
  headers: string | null;
  raw_request: string | null;
  request_body: string | null;
  server_response: string | null;
  timestamp: string;
}

interface DashboardStatsWire {
  active_payloads: number;
  interactions_today: number;
  dns_events: number;
  http_events: number;
  https_events: number;
  last_callback: string | null;
  connected_servers: number;
}

// ponytail: model mapping helpers to bridge camelCase frontend and snake_case Rust Tauri structs
function mapServer(s: ServerWire): ListenerServer {
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    apiKey: s.api_key,
    status: s.status as ListenerServer['status'],
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function mapPayload(p: PayloadWire): ListenerPayload {
  return {
    id: p.id,
    serverId: p.server_id,
    identifier: p.identifier,
    payloadUrl: p.payload_url,
    name: p.name,
    description: p.description,
    tags: p.tags,
    interactionCount: p.interaction_count,
    status: p.status as ListenerPayload['status'],
    createdAt: p.created_at,
    lastSeenAt: p.last_seen_at,
  };
}

function mapInteraction(i: InteractionWire): ListenerInteraction {
  return {
    id: i.id,
    payloadId: i.payload_id,
    interactionType: i.interaction_type as ListenerInteraction['interactionType'],
    sourceIp: i.source_ip,
    method: i.method,
    path: i.path,
    headers: i.headers,
    rawRequest: i.raw_request,
    requestBody: i.request_body,
    serverResponse: i.server_response,
    timestamp: i.timestamp,
  };
}

function mapStats(s: DashboardStatsWire): ListenerDashboardStats {
  return {
    activePayloads: s.active_payloads,
    interactionsToday: s.interactions_today,
    dnsEvents: s.dns_events,
    httpEvents: s.http_events,
    httpsEvents: s.https_events,
    lastCallback: s.last_callback,
    connectedServers: s.connected_servers,
  };
}

export async function listListenerServers(): Promise<ListenerServer[]> {
  const list = await invoke<ServerWire[]>('list_collaborator_servers');
  return list.map(mapServer);
}

export async function addListenerServer(req: CreateServerRequest): Promise<ListenerServer> {
  const res = await invoke<ServerWire>('add_collaborator_server', {
    server: {
      name: req.name,
      url: req.url,
      api_key: req.apiKey,
    },
  });
  return mapServer(res);
}

export async function updateListenerServer(server: ListenerServer): Promise<ListenerServer> {
  const res = await invoke<ServerWire>('update_collaborator_server', {
    server: {
      id: server.id,
      name: server.name,
      url: server.url,
      api_key: server.apiKey,
      status: server.status,
      created_at: server.createdAt,
      updated_at: server.updatedAt,
    },
  });
  return mapServer(res);
}

export async function deleteListenerServer(id: string): Promise<void> {
  return invoke('delete_collaborator_server', { id });
}

export async function checkListenerServerHealth(id: string): Promise<ListenerServer> {
  const res = await invoke<ServerWire>('check_collaborator_server_health', { id });
  return mapServer(res);
}

export async function createListenerPayload(
  req: CreatePayloadRequest
): Promise<ListenerPayload> {
  const res = await invoke<PayloadWire>('create_collaborator_payload', {
    request: {
      server_id: req.serverId,
      name: req.name,
      description: req.description,
      tags: req.tags,
    },
  });
  return mapPayload(res);
}

export async function listListenerPayloads(
  serverId?: string
): Promise<ListenerPayload[]> {
  const list = await invoke<PayloadWire[]>('list_collaborator_payloads', {
    serverId: serverId ?? null,
  });
  return list.map(mapPayload);
}

export async function deleteListenerPayload(id: string): Promise<void> {
  return invoke('delete_collaborator_payload', { id });
}

export async function archiveListenerPayload(id: string): Promise<void> {
  return invoke('archive_collaborator_payload', { id });
}

export async function listListenerInteractions(
  payloadId?: string,
  interactionType?: string
): Promise<ListenerInteraction[]> {
  const list = await invoke<InteractionWire[]>('list_collaborator_interactions', {
    payloadId: payloadId ?? null,
    interactionType: interactionType ?? null,
  });
  return list.map(mapInteraction);
}

export async function pollListenerInteractions(
  serverId: string
): Promise<ListenerInteraction[]> {
  const list = await invoke<InteractionWire[]>('poll_collaborator_interactions', {
    serverId,
  });
  return list.map(mapInteraction);
}

export async function getListenerDashboardStats(): Promise<ListenerDashboardStats> {
  const res = await invoke<DashboardStatsWire>('get_collaborator_dashboard_stats');
  return mapStats(res);
}
