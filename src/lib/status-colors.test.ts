import { describe, expect, it } from 'vitest';
import {
  getActivityStatusColor,
  getCrawlStatusColor,
  getLevelColor,
  getMethodBadgeColor,
  getMethodColor,
  getSeverityColor,
  getStatusColor,
} from './status-colors';

describe('getMethodColor', () => {
  it('maps known methods case-insensitively', () => {
    expect(getMethodColor('GET')).toBe('text-green-500 dark:text-green-400');
    expect(getMethodColor('post')).toBe('text-amber-500 dark:text-amber-400');
    expect(getMethodColor('delete')).toBe('text-red-500 dark:text-red-400');
  });

  it('falls back to gray for unknown methods', () => {
    expect(getMethodColor('TRACE')).toBe('text-gray-500 dark:text-gray-400');
  });
});

describe('getMethodBadgeColor', () => {
  it('maps known methods case-insensitively', () => {
    expect(getMethodBadgeColor('put')).toBe('bg-orange-500 dark:bg-orange-500 border-orange-500 text-white');
  });

  it('falls back to a gray badge for unknown methods', () => {
    expect(getMethodBadgeColor('BREW')).toBe('bg-gray-500 dark:bg-gray-500 border-gray-500 text-white');
  });
});

describe('getStatusColor', () => {
  it.each([
    [200, 'bg-green-500'],
    [204, 'bg-green-500'],
    [299, 'bg-green-500'],
    [301, 'bg-blue-500'],
    [404, 'bg-orange-500'],
    [500, 'bg-red-500'],
    [599, 'bg-red-500'],
  ])('maps %i to the expected class', (status, expected) => {
    expect(getStatusColor(status)).toBe(expected);
  });

  it('falls back to gray for 1xx and falsy statuses', () => {
    expect(getStatusColor(100)).toBe('bg-gray-500');
    expect(getStatusColor(null)).toBe('bg-gray-500');
    expect(getStatusColor(undefined)).toBe('bg-gray-500');
    expect(getStatusColor(0)).toBe('bg-gray-500');
  });
});

describe('getLevelColor', () => {
  it('maps each level to its class', () => {
    expect(getLevelColor('info')).toBe('bg-blue-600');
    expect(getLevelColor('warning')).toBe('bg-orange-600');
    expect(getLevelColor('error')).toBe('bg-red-600');
  });

  it('falls back to gray for unknown levels', () => {
    expect(getLevelColor('debug' as never)).toBe('bg-gray-600');
  });
});

describe('getActivityStatusColor', () => {
  it('maps known activity statuses', () => {
    expect(getActivityStatusColor('session')).toBe('bg-yellow-600');
    expect(getActivityStatusColor('navigation')).toBe('bg-green-600');
    expect(getActivityStatusColor('policy')).toBe('bg-red-600');
    expect(getActivityStatusColor('queue')).toBe('bg-gray-600');
  });
});

describe('getSeverityColor', () => {
  it('maps the severity ladder', () => {
    expect(getSeverityColor('info')).toBe('bg-blue-600');
    expect(getSeverityColor('low')).toBe('bg-green-600');
    expect(getSeverityColor('medium')).toBe('bg-yellow-600');
    expect(getSeverityColor('high')).toBe('bg-orange-600');
    expect(getSeverityColor('critical')).toBe('bg-red-600');
  });

  it('falls back to gray for unknown severities', () => {
    expect(getSeverityColor('catastrophic')).toBe('bg-gray-600');
  });
});

describe('getCrawlStatusColor', () => {
  it('maps known crawl statuses', () => {
    expect(getCrawlStatusColor('running')).toBe('bg-emerald-600');
    expect(getCrawlStatusColor('paused')).toBe('bg-amber-600');
    expect(getCrawlStatusColor('completed')).toBe('bg-sky-600');
    expect(getCrawlStatusColor('failed')).toBe('bg-red-600');
    expect(getCrawlStatusColor('stopped')).toBe('bg-gray-500');
    expect(getCrawlStatusColor('idle')).toBe('bg-gray-500');
  });
});
