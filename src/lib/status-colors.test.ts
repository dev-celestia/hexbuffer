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
    expect(getMethodColor('GET')).toBe('text-green-700 dark:text-green-400');
    expect(getMethodColor('post')).toBe('text-amber-700 dark:text-amber-400');
    expect(getMethodColor('delete')).toBe('text-red-700 dark:text-red-400');
  });

  it('falls back to gray for unknown methods', () => {
    expect(getMethodColor('TRACE')).toBe('text-gray-700 dark:text-gray-400');
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
    [200, 'bg-success'],
    [204, 'bg-success'],
    [299, 'bg-success'],
    [301, 'bg-info'],
    [404, 'bg-warning'],
    [500, 'bg-destructive'],
    [599, 'bg-destructive'],
  ])('maps %i to the expected class', (status, expected) => {
    expect(getStatusColor(status)).toBe(expected);
  });

  it('falls back to the neutral token for 1xx and falsy statuses', () => {
    expect(getStatusColor(100)).toBe('bg-muted-foreground');
    expect(getStatusColor(null)).toBe('bg-muted-foreground');
    expect(getStatusColor(undefined)).toBe('bg-muted-foreground');
    expect(getStatusColor(0)).toBe('bg-muted-foreground');
  });
});

describe('getLevelColor', () => {
  it('maps each level to its status token', () => {
    expect(getLevelColor('info')).toBe('bg-info');
    expect(getLevelColor('warning')).toBe('bg-warning');
    expect(getLevelColor('error')).toBe('bg-destructive');
  });

  it('falls back to the neutral token for unknown levels', () => {
    expect(getLevelColor('debug' as never)).toBe('bg-muted-foreground');
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
  it('maps known crawl statuses to status tokens', () => {
    expect(getCrawlStatusColor('running')).toBe('bg-success');
    expect(getCrawlStatusColor('paused')).toBe('bg-warning');
    expect(getCrawlStatusColor('completed')).toBe('bg-info');
    expect(getCrawlStatusColor('failed')).toBe('bg-destructive');
    expect(getCrawlStatusColor('stopped')).toBe('bg-muted-foreground');
    expect(getCrawlStatusColor('idle')).toBe('bg-muted-foreground');
  });
});
