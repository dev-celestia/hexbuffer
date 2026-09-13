import { describe, expect, it } from 'vitest';
import { buildHistoryQuery, hasActiveHistoryFilters } from './build-history-query';
import type { HistoryFilterState } from '@/stores/history';

function makeFilter(overrides: Partial<HistoryFilterState> = {}): HistoryFilterState {
  return {
    search: '',
    methods: new Set(),
    statusCodes: new Set(),
    pathFilter: null,
    ...overrides,
  };
}

describe('buildHistoryQuery', () => {
  it('produces an empty filter when nothing is set', () => {
    const query = buildHistoryQuery({
      filter: makeFilter(),
      activeScope: null,
      sortOrder: 'desc',
    });

    expect(query).toEqual({
      sortOrder: 'desc',
      filter: {
        search: null,
        path: null,
        methods: null,
        status_codes: null,
        scope: null,
        session_id: null,
      },
    });
  });

  it('passes through search, path, and sort order', () => {
    const query = buildHistoryQuery({
      filter: makeFilter({ search: '  login  ', pathFilter: '/api/' }),
      activeScope: null,
      sortOrder: 'asc',
    });

    expect(query.filter.search).toBe('login');
    expect(query.filter.path).toBe('/api/');
    expect(query.sortOrder).toBe('asc');
  });

  it('normalizes the method list and drops blanks', () => {
    const query = buildHistoryQuery({
      filter: makeFilter({ methods: new Set(['GET', '  POST  ', '   ']) }),
      activeScope: null,
      sortOrder: 'desc',
    });
    expect(query.filter.methods).toEqual(['GET', 'POST']);
  });

  it('maps status-code class labels to concrete code lists', () => {
    const query = buildHistoryQuery({
      filter: makeFilter({ statusCodes: new Set(['2xx', '5xx']) }),
      activeScope: null,
      sortOrder: 'desc',
    });

    expect(query.filter.status_codes).toEqual([
      200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
      500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
    ]);
  });

  it('maps 3xx and 4xx class labels', () => {
    const query = buildHistoryQuery({
      filter: makeFilter({ statusCodes: new Set(['3xx']) }),
      activeScope: null,
      sortOrder: 'desc',
    });
    expect(query.filter.status_codes).toEqual([300, 301, 302, 303, 304, 305, 306, 307, 308]);
  });

  it('keeps exact status codes and ignores unknown labels', () => {
    const query = buildHistoryQuery({
      filter: makeFilter({ statusCodes: new Set(['404', 'bogus']) }),
      activeScope: null,
      sortOrder: 'desc',
    });
    expect(query.filter.status_codes).toEqual([404]);
  });

  it('normalizes scope and session id', () => {
    const query = buildHistoryQuery({
      filter: makeFilter(),
      activeScope: [' example.com ', ''],
      sessionId: '  sess-1  ',
      sortOrder: 'desc',
    });
    expect(query.filter.scope).toEqual(['example.com']);
    expect(query.filter.session_id).toBe('sess-1');
  });
});

describe('hasActiveHistoryFilters', () => {
  it('is false for an untouched filter', () => {
    expect(hasActiveHistoryFilters({ filter: makeFilter(), activeScope: null })).toBe(false);
  });

  it('is true when any filter dimension is set', () => {
    expect(hasActiveHistoryFilters({ filter: makeFilter({ search: 'x' }), activeScope: null })).toBe(true);
    expect(hasActiveHistoryFilters({ filter: makeFilter({ pathFilter: '/x' }), activeScope: null })).toBe(true);
    expect(hasActiveHistoryFilters({ filter: makeFilter({ methods: new Set(['GET']) }), activeScope: null })).toBe(true);
    expect(hasActiveHistoryFilters({ filter: makeFilter({ statusCodes: new Set(['2xx']) }), activeScope: null })).toBe(true);
    expect(hasActiveHistoryFilters({ filter: makeFilter(), activeScope: ['example.com'] })).toBe(true);
  });

  it('is false when scope is an empty array', () => {
    expect(hasActiveHistoryFilters({ filter: makeFilter(), activeScope: [] })).toBe(false);
  });
});
