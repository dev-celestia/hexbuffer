// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useResponseOverrideStore } from './api-override';

function reset() {
  useResponseOverrideStore.setState({
    activeSubTab: 'hosts',
    domains: [],
    routes: [],
    logs: [],
    selectedDomainId: null,
    selectedRouteId: null,
    selectedLogId: null,
  });
}

beforeEach(reset);

describe('useResponseOverrideStore', () => {
  it('tracks the active sub tab', () => {
    useResponseOverrideStore.getState().setActiveSubTab('rules');
    expect(useResponseOverrideStore.getState().activeSubTab).toBe('rules');
  });

  it('replaces domains, routes, and logs and tracks selections', () => {
    const domains = [{ id: 'd1', domain: 'api.test' }] as never[];
    const routes = [{ id: 'r1' }] as never[];
    const logs = [{ id: 'l1' }] as never[];

    const s = useResponseOverrideStore.getState();
    s.setDomains(domains);
    s.setRoutes(routes);
    s.setLogs(logs);
    s.setSelectedDomainId('d1');
    s.setSelectedRouteId('r1');
    s.setSelectedLogId('l1');

    const state = useResponseOverrideStore.getState();
    expect(state.domains).toBe(domains);
    expect(state.routes).toBe(routes);
    expect(state.logs).toBe(logs);
    expect(state.selectedDomainId).toBe('d1');
    expect(state.selectedRouteId).toBe('r1');
    expect(state.selectedLogId).toBe('l1');
  });
});
