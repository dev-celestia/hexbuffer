// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getAppTarget } from './page-resolver';

function setQuery(search: string) {
  window.history.replaceState(null, '', search ? `/${search}` : '/');
}

const ENV_BACKUP = { ...import.meta.env };

describe('getAppTarget', () => {
  afterEach(() => {
    Object.assign(import.meta.env, ENV_BACKUP);
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('');
  });

  it('returns null in the suite (no env target, no query param)', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('');
    expect(getAppTarget()).toBeNull();
  });

  it('prefers the build-time VITE_APP_TARGET', () => {
    import.meta.env.VITE_APP_TARGET = 'Jwt';
    setQuery('?target=http');
    expect(getAppTarget()).toBe('jwt');
  });

  it('ignores suite/main env values', () => {
    import.meta.env.VITE_APP_TARGET = 'suite';
    setQuery('');
    expect(getAppTarget()).toBeNull();

    import.meta.env.VITE_APP_TARGET = 'main';
    expect(getAppTarget()).toBeNull();
  });

  it('falls back to the ?target query parameter', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('?target=port-scanner');
    expect(getAppTarget()).toBe('port-scanner');
  });

  it('also accepts ?standalone as the query parameter', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('?standalone=repeater');
    expect(getAppTarget()).toBe('repeater');
  });

  it('ignores suite query values case-insensitively', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('?target=SUITE');
    expect(getAppTarget()).toBeNull();

    setQuery('?target=suite');
    expect(getAppTarget()).toBeNull();
  });

  it('lets the query parameter win when the env value is a suite alias', () => {
    import.meta.env.VITE_APP_TARGET = 'main';
    setQuery('?target=jwt');
    expect(getAppTarget()).toBe('jwt');
  });
});
