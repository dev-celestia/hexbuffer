// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { getStandaloneTarget } from './use-standalone';

function setQuery(search: string) {
  window.history.replaceState(null, '', search ? `/${search}` : '/');
}

const ENV_BACKUP = { ...import.meta.env };

describe('getStandaloneTarget', () => {
  afterEach(() => {
    Object.assign(import.meta.env, ENV_BACKUP);
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('');
  });

  it('returns null with no env target and no query param', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('');
    expect(getStandaloneTarget()).toBeNull();
  });

  it('uses the build-time env target first', () => {
    import.meta.env.VITE_APP_TARGET = 'HTTP';
    expect(getStandaloneTarget()).toBe('http');
  });

  it('treats suite/main env values as unset, case-insensitively', () => {
    import.meta.env.VITE_APP_TARGET = 'suite';
    expect(getStandaloneTarget()).toBeNull();

    import.meta.env.VITE_APP_TARGET = 'MAIN';
    expect(getStandaloneTarget()).toBeNull();
  });

  it('reads ?target and ?standalone from the URL', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('?target=intruder');
    expect(getStandaloneTarget()).toBe('intruder');

    setQuery('?standalone=api-mock');
    expect(getStandaloneTarget()).toBe('api-mock');
  });

  it('rejects suite/main query values case-insensitively too', () => {
    delete import.meta.env.VITE_APP_TARGET;
    setQuery('?target=Main');
    expect(getStandaloneTarget()).toBeNull();
  });
});
