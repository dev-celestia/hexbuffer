import type { PortScanResult } from '../types';
import { PORT_PRESETS } from '../constants';
import type { PortPreset } from '../constants';

export function parsePorts(value: string): number[] {
  if (!value || !value.trim()) return [];

  const ports = new Set<number>();

  // 1. Remove line comments (e.g. # comment or // comment)
  const cleanValue = value
    .split('\n')
    .map((line) => {
      const commentIdx = line.search(/(#|\/\/)/);
      return commentIdx !== -1 ? line.substring(0, commentIdx) : line;
    })
    .join('\n');

  // 2. Normalize whitespace around range operators: "1 - 4", "1 .. 4", "1 : 4", "1...4" -> "1-4"
  const normalized = cleanValue
    .replace(/(\d+)\s*(?:-|\.\.\.?|:)\s*(\d+)/g, '$1-$2')
    .replace(/[;\t|\n\r]/g, ',')
    .replace(/\s+/g, ',');

  const parts = normalized.split(',');

  for (const part of parts) {
    let token = part.trim();
    if (!token) continue;

    // Handle named keywords
    const lower = token.toLowerCase();
    if (lower === 'web' || lower === 'http') {
      [80, 443, 8080, 8443, 8000, 8008, 8081, 3000, 5000, 8888].forEach((p) => ports.add(p));
      continue;
    }
    if (lower === 'db' || lower === 'database') {
      [3306, 5432, 1433, 1521, 27017, 6379, 9200, 5984].forEach((p) => ports.add(p));
      continue;
    }
    if (lower === 'top100') {
      parsePorts(PORT_PRESETS.Top100).forEach((p) => ports.add(p));
      continue;
    }
    if (lower === 'quick') {
      parsePorts(PORT_PRESETS.Quick).forEach((p) => ports.add(p));
      continue;
    }
    if (lower === 'all' || lower === 'full') {
      for (let p = 1; p <= 65535; p++) ports.add(p);
      continue;
    }

    // Strip out protocol prefixes/suffixes (e.g. "port 80", "80/tcp", "80(http)")
    token = token.replace(/^(?:port\s*)?/i, '');
    token = token.replace(/(?:\/(?:tcp|udp|http|https))$/i, '');
    token = token.replace(/\(.*\)$/, '').trim();

    // Check if range: "1-4"
    if (token.includes('-')) {
      const segments = token.split('-');
      if (segments.length === 2) {
        const start = Number(segments[0].trim());
        const end = Number(segments[1].trim());
        if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end > 0) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(65535, Math.max(start, end));
          for (let p = min; p <= max; p++) {
            ports.add(p);
          }
          continue;
        }
      }
    }

    // Single port
    const port = Number(token);
    if (Number.isInteger(port) && port >= 1 && port <= 65535) {
      ports.add(port);
    }
  }

  return Array.from(ports).sort((a, b) => a - b);
}

export function formatPortsSummary(ports: number[]): string {
  if (ports.length === 0) return '0 ports';
  if (ports.length === 1) return `1 port (#${ports[0]})`;
  if (ports.length === 65535) return 'Full Range (1-65535)';
  return `${ports.length.toLocaleString()} ports`;
}

export function sortScanResults(a: PortScanResult, b: PortScanResult): number {
  return a.host.localeCompare(b.host) || a.port - b.port;
}

export function describePortPreset(preset: PortPreset): string {
  if (preset === 'Quick') return `Quick ports: ${PORT_PRESETS.Quick}`;
  if (preset === 'Web') return `Web ports: ${PORT_PRESETS.Web}`;
  if (preset === 'Top100') return `Top 100 common ports: ${PORT_PRESETS.Top100}`;
  return 'Full scan: 1-65535';
}
