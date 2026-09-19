/**
 * Unit tests for the intercept colour tables.
 *
 * The important one is the last: every tone the public API can return is checked against the same
 * light-mode rule the app-level guard enforces, so the palette cannot regress even before
 * `styles/light-mode-shades.test.ts` runs. The rest pin the mapping itself, because a method that
 * silently fell back to neutral would still pass a "no bare shades" check.
 */
import { describe, expect, it } from 'vitest';

import { bareTextShadesIn } from '@/styles/light-mode-shades';
import { getDirectionTreatment, getMethodTone, getStatusTone, type Tone } from './request-styles';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const;

/** Boundaries and a representative from each status family, plus the falsy cases. */
const STATUSES = [100, 199, 200, 204, 299, 300, 304, 399, 400, 404, 499, 500, 503, 599, 0, null, undefined];

describe('getMethodTone', () => {
  it('gives each known method its own pill', () => {
    const pills = METHODS.map((method) => getMethodTone(method).pill);
    expect(new Set(pills).size).toBe(METHODS.length);
  });

  it('is case-insensitive', () => {
    expect(getMethodTone('get')).toEqual(getMethodTone('GET'));
    expect(getMethodTone('Delete')).toEqual(getMethodTone('DELETE'));
  });

  it('falls back to a token-based neutral for anything unrecognised', () => {
    for (const unknown of ['TRACE', 'BREW', '']) {
      expect(getMethodTone(unknown).pill).toContain('muted');
    }
    expect(getMethodTone(null).pill).toContain('muted');
    expect(getMethodTone(undefined).pill).toContain('muted');
    expect(getMethodTone(null)).toEqual(getMethodTone('TRACE'));
  });
});

describe('getStatusTone', () => {
  it('separates the status families at their boundaries', () => {
    // 1xx informational
    expect(getStatusTone(100)).toEqual(getStatusTone(199));
    // 2xx success — the boundary that matters most, 199 vs 200
    expect(getStatusTone(199)).not.toEqual(getStatusTone(200));
    expect(getStatusTone(200)).toEqual(getStatusTone(299));
    expect(getStatusTone(299)).not.toEqual(getStatusTone(300));
    // 3xx redirect
    expect(getStatusTone(300)).toEqual(getStatusTone(399));
    expect(getStatusTone(399)).not.toEqual(getStatusTone(400));
    // 4xx client error
    expect(getStatusTone(400)).toEqual(getStatusTone(499));
    expect(getStatusTone(499)).not.toEqual(getStatusTone(500));
    // 5xx server error
    expect(getStatusTone(500)).toEqual(getStatusTone(599));
  });

  it('treats a missing status as neutral rather than as a failure', () => {
    // A request that was never forwarded has no status; showing it rose would claim a failure.
    for (const missing of [null, undefined, 0]) {
      expect(getStatusTone(missing).pill).toContain('muted');
    }
  });
});

describe('getDirectionTreatment', () => {
  it('distinguishes the two directions', () => {
    const outbound = getDirectionTreatment('request');
    const inbound = getDirectionTreatment('response');
    expect(outbound.text).not.toBe(inbound.text);
    expect(outbound.label).not.toBe(inbound.label);
  });

  it('describes what the arrow means, not which way it points', () => {
    expect(getDirectionTreatment('request').label).toBe('Outgoing request');
    expect(getDirectionTreatment('response').label).toBe('Returning response');
  });
});

describe('light-mode safety', () => {
  it('never returns a bare -300/-400/-500 text shade', () => {
    const cases: Array<[string, Tone]> = [
      ...METHODS.map((method) => [`getMethodTone(${method})`, getMethodTone(method)] as [string, Tone]),
      ...STATUSES.map((status) => [`getStatusTone(${status})`, getStatusTone(status)] as [string, Tone]),
    ];

    const offenders = cases.flatMap(([label, tone]) =>
      [...bareTextShadesIn(tone.pill), ...bareTextShadesIn(tone.text)].map(
        (token) => `${label} → ${token}`
      )
    );

    expect(offenders, 'add a dark: companion, e.g. text-emerald-600 dark:text-emerald-400').toEqual([]);
  });

  it('checks the direction arrows too', () => {
    const offenders = ['request', 'response'].flatMap((direction) =>
      bareTextShadesIn(getDirectionTreatment(direction as 'request' | 'response').text)
    );
    expect(offenders).toEqual([]);
  });

  it('would catch a bare shade if one were introduced', () => {
    // Guards the guard: without this, a checker that matched nothing would pass vacuously.
    expect(bareTextShadesIn('text-green-500')).toEqual(['text-green-500']);
    expect(bareTextShadesIn('text-green-600 dark:text-green-400')).toEqual([]);
  });
});
