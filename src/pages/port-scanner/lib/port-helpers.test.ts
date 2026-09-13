import { describe, expect, it } from 'vitest';
import {
  describePortPreset,
  formatPortsSummary,
  parsePorts,
  sortScanResults,
} from './port-helpers';

describe('parsePorts', () => {
  it('parses single ports and dedupes + sorts output', () => {
    expect(parsePorts('443 80 443')).toEqual([80, 443]);
  });

  it('parses comma, space, semicolon, and newline separators', () => {
    expect(parsePorts('22,80\n443;8080\t9000')).toEqual([22, 80, 443, 8080, 9000]);
  });

  it('parses ranges with -, .., ... and : operators', () => {
    expect(parsePorts('3-5')).toEqual([3, 4, 5]);
    expect(parsePorts('3 .. 5')).toEqual([3, 4, 5]);
    expect(parsePorts('3...5')).toEqual([3, 4, 5]);
    expect(parsePorts('3 : 5')).toEqual([3, 4, 5]);
  });

  it('normalizes reversed ranges and clamps the upper bound to 65535', () => {
    expect(parsePorts('5-3')).toEqual([3, 4, 5]);
    // Ranges starting at 0 fail validation and are dropped entirely
    expect(parsePorts('0-2')).toEqual([]);
    expect(parsePorts('65530-70000')).toEqual([65530, 65531, 65532, 65533, 65534, 65535]);
  });

  it('ignores comments after # and //', () => {
    expect(parsePorts('80 # http\n443 // tls')).toEqual([80, 443]);
    expect(parsePorts('# only a comment')).toEqual([]);
  });

  it('expands the web keyword to common HTTP ports', () => {
    expect(parsePorts('web')).toEqual([80, 443, 3000, 5000, 8000, 8008, 8080, 8081, 8443, 8888]);
    expect(parsePorts('HTTP')).toEqual(parsePorts('web'));
  });

  it('expands the db keyword to common database ports', () => {
    expect(parsePorts('db')).toEqual([1433, 1521, 3306, 5432, 5984, 6379, 9200, 27017]);
    expect(parsePorts('database')).toEqual(parsePorts('db'));
  });

  it('expands top100 and quick keywords without crashing', () => {
    const top100 = parsePorts('top100');
    const quick = parsePorts('quick');
    expect(top100.length).toBeGreaterThan(50);
    expect(quick.length).toBeGreaterThan(0);
    expect(top100.every((p) => p >= 1 && p <= 65535)).toBe(true);
  });

  it('expands all/full to the full range', () => {
    expect(parsePorts('all')).toHaveLength(65535);
  });

  it('strips protocol decorations from tokens', () => {
    expect(parsePorts('80/tcp')).toEqual([80]);
    expect(parsePorts('53/udp')).toEqual([53]);
    expect(parsePorts('8080(http)')).toEqual([8080]);
    expect(parsePorts('port 22')).toEqual([22]);
  });

  it('drops invalid tokens and empty input', () => {
    expect(parsePorts('')).toEqual([]);
    expect(parsePorts('   ')).toEqual([]);
    expect(parsePorts('abc 0 70000 80')).toEqual([80]);
  });

  it('merges keywords with explicit ports', () => {
    expect(parsePorts('db, 22')).toEqual([22, 1433, 1521, 3306, 5432, 5984, 6379, 9200, 27017]);
  });
});

describe('formatPortsSummary', () => {
  it('summarizes empty, single, and many port lists', () => {
    expect(formatPortsSummary([])).toBe('0 ports');
    expect(formatPortsSummary([443])).toBe('1 port (#443)');
    expect(formatPortsSummary([80, 443])).toBe('2 ports');
    expect(formatPortsSummary(new Array(1234).fill(0).map((_, i) => i + 1))).toBe('1,234 ports');
  });

  it('special-cases the full range', () => {
    expect(formatPortsSummary(parsePorts('all'))).toBe('Full Range (1-65535)');
  });
});

describe('sortScanResults', () => {
  it('sorts by host then port', () => {
    const rows = [
      { host: 'b.example.com', port: 443 },
      { host: 'a.example.com', port: 8080 },
      { host: 'a.example.com', port: 80 },
    ] as Parameters<typeof sortScanResults>[0][];
    const sorted = [...rows].sort(sortScanResults);
    expect(sorted.map((r) => `${r.host}:${r.port}`)).toEqual([
      'a.example.com:80',
      'a.example.com:8080',
      'b.example.com:443',
    ]);
  });
});

describe('describePortPreset', () => {
  it('describes each preset', () => {
    expect(describePortPreset('Quick')).toContain('Quick ports:');
    expect(describePortPreset('Web')).toContain('Web ports:');
    expect(describePortPreset('Top100')).toContain('Top 100 common ports:');
    expect(describePortPreset('Full')).toBe('Full scan: 1-65535');
  });
});
