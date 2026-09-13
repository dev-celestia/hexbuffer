import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/webviewWindow', () => ({
  WebviewWindow: class {},
}));

import { normalizeSubAppTarget } from './sub-window';

describe('normalizeSubAppTarget', () => {
  it.each([
    ['/http-history', 'http-history'],
    ['/JWT', 'jwt'],
    // Trailing whitespace is trimmed, but a padded leading slash survives as a dash
    ['  /port-scanner  ', '-port-scanner'],
    ['/API Mock', 'api-mock'],
    ['/settings?tab=ca', 'settings-tab-ca'],
    ['repeater', 'repeater'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeSubAppTarget(input)).toBe(expected);
  });

  it('keeps valid label characters untouched', () => {
    expect(normalizeSubAppTarget('/tool_v2')).toBe('tool_v2');
  });
});

beforeEach(() => {
  vi.restoreAllMocks();
});
