import type { PaletteItem, NucleiEdgeType } from './types';

export const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'templateInfo',
    title: 'Template Metadata',
    description: 'Root global metadata, severity, author, and classification.',
    category: 'core',
    icon: 'ShieldWarning',
  },
  {
    type: 'requestNode',
    title: 'Protocol Request Probe',
    description: 'HTTP, TCP, DNS, or Headless request probe payload.',
    category: 'probe',
    icon: 'Globe',
  },
  {
    type: 'extractorNode',
    title: 'Dynamic Variable Extractor',
    description: 'Extract tokens (regex/json/dsl) from responses into variables.',
    category: 'analysis',
    icon: 'TreeStructure',
  },
  {
    type: 'matcherNode',
    title: 'Response Matcher Assertion',
    description: 'Evaluate status codes, body words, regexes, or DSL logic.',
    category: 'analysis',
    icon: 'CheckCircle',
  },
  {
    type: 'flowNode',
    title: 'Nuclei v3 Flow Logic',
    description: 'Multi-step JavaScript conditional execution flow graph.',
    category: 'orchestration',
    icon: 'Lightning',
  },
];

export const EDGE_STYLES: Record<NucleiEdgeType, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  default: {
    stroke: 'var(--muted-foreground, #71717a)',
    strokeWidth: 2,
  },
  'condition-true': {
    stroke: '#10b981', // Emerald-500
    strokeWidth: 2.5,
  },
  'condition-false': {
    stroke: '#f43f5e', // Rose-500
    strokeWidth: 2.5,
  },
  'variable-pipe': {
    stroke: '#8b5cf6', // Purple-500
    strokeWidth: 2,
    strokeDasharray: '5,5',
  },
};

export const DEFAULT_TEMPLATE_INFO = {
  id: 'custom-vulnerability-check',
  name: 'Custom Vulnerability Check',
  author: 'Security Analyst',
  severity: 'high' as const,
  description: 'Detects critical exposure or misconfiguration on target.',
  reference: ['https://cve.mitre.org/'],
  tags: ['cve', 'exposure', 'misconfig'],
  protocol: 'http' as const,
};

export const DEFAULT_REQUEST_NODE = {
  stepId: 'http-1',
  protocol: 'http' as const,
  method: 'GET' as const,
  path: ['{{BaseURL}}/api/v1/debug'],
  headers: {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Nuclei-Flow',
  },
  body: '',
  stopAtFirstMatch: true,
  followRedirects: false,
};

export const DEFAULT_EXTRACTOR_NODE = {
  name: 'jwt_token',
  type: 'regex' as const,
  part: 'body' as const,
  internal: true,
  regex: ['"access_token"\\s*:\\s*"([^"]+)"'],
  group: 1,
};

export const DEFAULT_MATCHER_NODE = {
  name: 'is_vulnerable',
  type: 'status' as const,
  part: 'status' as const,
  condition: 'and' as const,
  negative: false,
  status: [200],
  words: ['root:x:0:0:'],
};

export const DEFAULT_FLOW_NODE = {
  flowCode: 'http(1) && http(2)',
  description: 'Execute second probe only if initial handshake succeeds.',
};
