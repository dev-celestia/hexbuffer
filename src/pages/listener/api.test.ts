/**
 * Guards the IPC seam between `api.ts` and `src-tauri/src/collaborator/types.rs`.
 *
 * Every function in `api.ts` crosses two boundaries TypeScript cannot see across: the command name
 * (a bare string) and the field names (Rust snake_case in, frontend camelCase out). Both fail
 * *silently* — a renamed field maps to `undefined` and the UI renders a blank cell rather than
 * throwing — so the Rust structs are read as raw text and used as the source of truth for the
 * expected key set. A field added, removed, or renamed on either side fails here.
 *
 * This is also the guard that made the `any` -> wire-interface change in `api.ts` worth making:
 * the interfaces are only as good as the fixture they are checked against, and this fixture is
 * derived from the Rust source rather than hand-written to match the mapper.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// `invoke` is this module's only boundary, so it is the only thing stubbed. `vi.hoisted` is
// required because `vi.mock` factories are lifted above the imports that would define the mock.
const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }));

import {
  addListenerServer,
  archiveListenerPayload,
  checkListenerServerHealth,
  createListenerPayload,
  deleteListenerPayload,
  deleteListenerServer,
  getListenerDashboardStats,
  listListenerInteractions,
  listListenerPayloads,
  listListenerServers,
  pollListenerInteractions,
  updateListenerServer,
} from './api';

const RUST_SOURCES = import.meta.glob('../../../src-tauri/src/collaborator/types.rs', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const RUST = Object.values(RUST_SOURCES)[0] ?? '';

/** Field names of a Rust struct, in declaration order. */
function rustFields(structName: string): string[] {
  const start = RUST.indexOf(`pub struct ${structName} {`);
  expect(start, `types.rs no longer declares ${structName}`).toBeGreaterThan(-1);
  const end = RUST.indexOf('}', start);
  expect(end, `${structName} has no closing brace`).toBeGreaterThan(start);
  return [...RUST.slice(start, end).matchAll(/pub (\w+):/g)].map((m) => m[1]);
}

/** The camelCase twin of a snake_case Rust field name. */
function camel(field: string): string {
  return field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

// ── Fixtures (shapes copied from the Rust structs, values arbitrary) ───────────────────────────

const SERVER_WIRE = {
  id: 'srv-1',
  name: 'primary',
  url: 'https://collab.example.com',
  api_key: 'k-123',
  status: 'connected',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

const PAYLOAD_WIRE = {
  id: 'pl-1',
  server_id: 'srv-1',
  identifier: 'abc123',
  payload_url: 'https://collab.example.com/abc123',
  name: 'callback',
  description: 'a probe',
  tags: 'ssrf,internal',
  interaction_count: 7,
  status: 'active',
  created_at: '2026-01-01T00:00:00.000Z',
  last_seen_at: null,
};

const INTERACTION_WIRE = {
  id: 'int-1',
  payload_id: 'pl-1',
  interaction_type: 'http',
  source_ip: '10.0.0.9',
  method: null,
  path: null,
  headers: null,
  raw_request: null,
  request_body: null,
  server_response: null,
  timestamp: '2026-01-03T00:00:00.000Z',
};

const STATS_WIRE = {
  active_payloads: 3,
  interactions_today: 12,
  dns_events: 4,
  http_events: 5,
  https_events: 3,
  last_callback: null,
  connected_servers: 1,
};

beforeEach(() => {
  invokeMock.mockReset();
});

// ── Cross-language drift ───────────────────────────────────────────────────────────────────────

describe('wire shapes agree with the Rust structs', () => {
  it('loads the Rust source it polices', () => {
    expect(RUST).toContain('pub struct CollaboratorServer');
  });

  it('maps every CollaboratorServer field to its camelCase twin', async () => {
    invokeMock.mockResolvedValue([SERVER_WIRE]);
    const [server] = await listListenerServers();
    expect(Object.keys(server).sort()).toEqual(rustFields('CollaboratorServer').map(camel).sort());
  });

  it('maps every CollaboratorPayload field to its camelCase twin', async () => {
    invokeMock.mockResolvedValue([PAYLOAD_WIRE]);
    const [payload] = await listListenerPayloads();
    expect(Object.keys(payload).sort()).toEqual(rustFields('CollaboratorPayload').map(camel).sort());
  });

  it('maps every CollaboratorInteraction field to its camelCase twin', async () => {
    invokeMock.mockResolvedValue([INTERACTION_WIRE]);
    const [interaction] = await pollListenerInteractions('srv-1');
    expect(Object.keys(interaction).sort()).toEqual(
      rustFields('CollaboratorInteraction').map(camel).sort(),
    );
  });

  it('maps every CollaboratorDashboardStats field to its camelCase twin', async () => {
    invokeMock.mockResolvedValue(STATS_WIRE);
    const stats = await getListenerDashboardStats();
    expect(Object.keys(stats).sort()).toEqual(
      rustFields('CollaboratorDashboardStats').map(camel).sort(),
    );
  });
});

// ── Value mapping ──────────────────────────────────────────────────────────────────────────────

describe('snake_case wire -> camelCase model', () => {
  it('renames every server field, not just the first', async () => {
    invokeMock.mockResolvedValue([SERVER_WIRE]);
    expect(await listListenerServers()).toEqual([
      {
        id: 'srv-1',
        name: 'primary',
        url: 'https://collab.example.com',
        apiKey: 'k-123',
        status: 'connected',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });

  it('renames every payload field', async () => {
    invokeMock.mockResolvedValue([PAYLOAD_WIRE]);
    expect(await listListenerPayloads()).toEqual([
      {
        id: 'pl-1',
        serverId: 'srv-1',
        identifier: 'abc123',
        payloadUrl: 'https://collab.example.com/abc123',
        name: 'callback',
        description: 'a probe',
        tags: 'ssrf,internal',
        interactionCount: 7,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastSeenAt: null,
      },
    ]);
  });

  it('renames every interaction field', async () => {
    invokeMock.mockResolvedValue([INTERACTION_WIRE]);
    expect(await pollListenerInteractions('srv-1')).toEqual([
      {
        id: 'int-1',
        payloadId: 'pl-1',
        interactionType: 'http',
        sourceIp: '10.0.0.9',
        method: null,
        path: null,
        headers: null,
        rawRequest: null,
        requestBody: null,
        serverResponse: null,
        timestamp: '2026-01-03T00:00:00.000Z',
      },
    ]);
  });

  it('renames every stats field', async () => {
    invokeMock.mockResolvedValue(STATS_WIRE);
    expect(await getListenerDashboardStats()).toEqual({
      activePayloads: 3,
      interactionsToday: 12,
      dnsEvents: 4,
      httpEvents: 5,
      httpsEvents: 3,
      lastCallback: null,
      connectedServers: 1,
    });
  });
});

// ── Nullability ────────────────────────────────────────────────────────────────────────────────
// Rust `Option<String>` arrives as JSON `null`. An `any`-typed mapper happily forwards `undefined`
// here instead, which is how a "no value" becomes an indistinguishable missing key downstream.

describe('Option<String> fields stay null, never undefined', () => {
  it('keeps last_seen_at null', async () => {
    invokeMock.mockResolvedValue([PAYLOAD_WIRE]);
    const [payload] = await listListenerPayloads();
    expect(payload.lastSeenAt).toBeNull();
    expect('lastSeenAt' in payload).toBe(true);
  });

  it.each(['method', 'path', 'headers', 'rawRequest', 'requestBody', 'serverResponse'] as const)(
    'keeps %s null',
    async (field) => {
      invokeMock.mockResolvedValue([INTERACTION_WIRE]);
      const [interaction] = await pollListenerInteractions('srv-1');
      expect(interaction[field]).toBeNull();
      expect(field in interaction).toBe(true);
    },
  );

  it('keeps last_callback null', async () => {
    invokeMock.mockResolvedValue(STATS_WIRE);
    expect((await getListenerDashboardStats()).lastCallback).toBeNull();
  });
});

// ── Command and argument names ─────────────────────────────────────────────────────────────────
// Tauri converts camelCase JS keys to snake_case Rust parameters. Getting one wrong produces an
// "invalid args" error at runtime only, so the exact call is pinned here.

describe('command names and argument keys', () => {
  it('lists servers with no arguments', async () => {
    invokeMock.mockResolvedValue([]);
    await listListenerServers();
    expect(invokeMock).toHaveBeenCalledWith('list_collaborator_servers');
  });

  it('adds a server under the `server` key, snake_cased inside', async () => {
    invokeMock.mockResolvedValue(SERVER_WIRE);
    await addListenerServer({ name: 'n', url: 'u', apiKey: 'k' });
    expect(invokeMock).toHaveBeenCalledWith('add_collaborator_server', {
      server: { name: 'n', url: 'u', api_key: 'k' },
    });
  });

  it('updates a server with the full struct', async () => {
    invokeMock.mockResolvedValue(SERVER_WIRE);
    await updateListenerServer({
      id: 'srv-1',
      name: 'primary',
      url: 'https://collab.example.com',
      apiKey: 'k-123',
      status: 'connected',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(invokeMock).toHaveBeenCalledWith('update_collaborator_server', {
      server: {
        id: 'srv-1',
        name: 'primary',
        url: 'https://collab.example.com',
        api_key: 'k-123',
        status: 'connected',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
    });
  });

  it('deletes a server by id', async () => {
    invokeMock.mockResolvedValue(undefined);
    await deleteListenerServer('srv-1');
    expect(invokeMock).toHaveBeenCalledWith('delete_collaborator_server', { id: 'srv-1' });
  });

  it('checks health by id', async () => {
    invokeMock.mockResolvedValue(SERVER_WIRE);
    await checkListenerServerHealth('srv-1');
    expect(invokeMock).toHaveBeenCalledWith('check_collaborator_server_health', { id: 'srv-1' });
  });

  it('creates a payload under the `request` key', async () => {
    invokeMock.mockResolvedValue(PAYLOAD_WIRE);
    await createListenerPayload({
      serverId: 'srv-1',
      name: 'callback',
      description: 'a probe',
      tags: ['ssrf', 'internal'],
    });
    expect(invokeMock).toHaveBeenCalledWith('create_collaborator_payload', {
      request: {
        server_id: 'srv-1',
        name: 'callback',
        description: 'a probe',
        tags: ['ssrf', 'internal'],
      },
    });
  });

  it('sends an explicit null when listing payloads unfiltered', async () => {
    invokeMock.mockResolvedValue([]);
    await listListenerPayloads();
    expect(invokeMock).toHaveBeenCalledWith('list_collaborator_payloads', { serverId: null });
  });

  it('passes the payload filter through when given', async () => {
    invokeMock.mockResolvedValue([]);
    await listListenerPayloads('srv-1');
    expect(invokeMock).toHaveBeenCalledWith('list_collaborator_payloads', { serverId: 'srv-1' });
  });

  it('deletes and archives a payload by id', async () => {
    invokeMock.mockResolvedValue(undefined);
    await deleteListenerPayload('pl-1');
    expect(invokeMock).toHaveBeenCalledWith('delete_collaborator_payload', { id: 'pl-1' });
    await archiveListenerPayload('pl-1');
    expect(invokeMock).toHaveBeenCalledWith('archive_collaborator_payload', { id: 'pl-1' });
  });

  it('sends explicit nulls when listing interactions unfiltered', async () => {
    invokeMock.mockResolvedValue([]);
    await listListenerInteractions();
    expect(invokeMock).toHaveBeenCalledWith('list_collaborator_interactions', {
      payloadId: null,
      interactionType: null,
    });
  });

  it('passes both interaction filters through', async () => {
    invokeMock.mockResolvedValue([]);
    await listListenerInteractions('pl-1', 'dns');
    expect(invokeMock).toHaveBeenCalledWith('list_collaborator_interactions', {
      payloadId: 'pl-1',
      interactionType: 'dns',
    });
  });

  it('polls interactions for a server', async () => {
    invokeMock.mockResolvedValue([]);
    await pollListenerInteractions('srv-1');
    expect(invokeMock).toHaveBeenCalledWith('poll_collaborator_interactions', { serverId: 'srv-1' });
  });

  it('fetches dashboard stats with no arguments', async () => {
    invokeMock.mockResolvedValue(STATS_WIRE);
    await getListenerDashboardStats();
    expect(invokeMock).toHaveBeenCalledWith('get_collaborator_dashboard_stats');
  });
});
