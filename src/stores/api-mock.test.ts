// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useMockApiStore } from './api-mock';

function reset() {
  useMockApiStore.setState({
    activeSubTab: 'endpoints',
    domains: [],
    routes: [],
    logs: [],
    selectedRouteId: null,
    selectedLogId: null,
    serverConfig: { port: 4000, domainId: null, corsEnabled: true },
    serverStatus: { running: false, port: 4000, domainId: null, corsEnabled: true, url: null },
  });
}

beforeEach(reset);

describe('useMockApiStore', () => {
  it('tracks the active sub tab', () => {
    useMockApiStore.getState().setActiveSubTab('logs');
    expect(useMockApiStore.getState().activeSubTab).toBe('logs');
  });

  it('replaces domains, routes, and logs wholesale', () => {
    const domains = [{ id: 'd1', domain: 'api.test' }] as never[];
    const routes = [{ id: 'r1' }] as never[];
    const logs = [{ id: 'l1' }] as never[];

    const s = useMockApiStore.getState();
    s.setDomains(domains);
    s.setRoutes(routes);
    s.setLogs(logs);
    s.setSelectedRouteId('r1');
    s.setSelectedLogId('l1');

    const state = useMockApiStore.getState();
    expect(state.domains).toBe(domains);
    expect(state.routes).toBe(routes);
    expect(state.logs).toBe(logs);
    expect(state.selectedRouteId).toBe('r1');
    expect(state.selectedLogId).toBe('l1');
  });

  it('merges partial server config updates', () => {
    useMockApiStore.getState().setServerConfig({ port: 5000 });
    expect(useMockApiStore.getState().serverConfig).toEqual({
      port: 5000,
      domainId: null,
      corsEnabled: true,
    });

    useMockApiStore.getState().setServerConfig({ corsEnabled: false, domainId: 'd1' });
    expect(useMockApiStore.getState().serverConfig).toEqual({
      port: 5000,
      domainId: 'd1',
      corsEnabled: false,
    });
  });

  it('replaces the server status wholesale', () => {
    useMockApiStore.getState().setServerStatus({
      running: true,
      port: 4001,
      domainId: 'd1',
      corsEnabled: false,
      url: 'http://127.0.0.1:4001',
    });

    expect(useMockApiStore.getState().serverStatus).toEqual({
      running: true,
      port: 4001,
      domainId: 'd1',
      corsEnabled: false,
      url: 'http://127.0.0.1:4001',
    });
  });
});
