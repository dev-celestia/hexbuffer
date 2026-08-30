import type { Severity, ScanPreset, ProtocolType } from './types';

export const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline';
    iconColor: string;
    dotColor: string;
  }
> = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    badgeVariant: 'destructive',
    iconColor: 'text-red-500',
    dotColor: 'bg-red-500',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    badgeVariant: 'destructive',
    iconColor: 'text-orange-500',
    dotColor: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    badgeVariant: 'secondary',
    iconColor: 'text-yellow-500',
    dotColor: 'bg-yellow-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    badgeVariant: 'outline',
    iconColor: 'text-blue-500',
    dotColor: 'bg-blue-500',
  },
  info: {
    label: 'Info',
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
    badgeVariant: 'outline',
    iconColor: 'text-slate-400',
    dotColor: 'bg-slate-400',
  },
};

export const PROTOCOL_BADGES: Record<
  ProtocolType,
  { label: string; bg: string; text: string }
> = {
  http: { label: 'HTTP', bg: 'bg-sky-500/15', text: 'text-sky-400' },
  dns: { label: 'DNS', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  ssl: { label: 'SSL/TLS', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  tcp: { label: 'TCP', bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
  websocket: { label: 'WS', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  headless: { label: 'HEADLESS', bg: 'bg-rose-500/15', text: 'text-rose-400' },
  javascript: { label: 'JS', bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  code: { label: 'CODE', bg: 'bg-teal-500/15', text: 'text-teal-400' },
  file: { label: 'FILE', bg: 'bg-stone-500/15', text: 'text-stone-400' },
  whois: { label: 'WHOIS', bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400' },
};

export const PRESET_OPTIONS: Array<{
  id: ScanPreset;
  title: string;
  description: string;
  concurrency: number;
  rateLimit: number;
  timeout: number;
  severityFilter?: Severity[];
}> = [
  {
    id: 'quick-triage',
    title: 'Quick Triage',
    description: 'Fast high-priority probe (50 concurrency, 150 RPS, critical/high)',
    concurrency: 50,
    rateLimit: 150,
    timeout: 5,
    severityFilter: ['critical', 'high'],
  },
  {
    id: 'full-audit',
    title: 'Full Vulnerability Scan',
    description: 'Comprehensive assessment across all templates & protocols',
    concurrency: 25,
    rateLimit: 100,
    timeout: 10,
    severityFilter: ['critical', 'high', 'medium', 'low', 'info'],
  },
  {
    id: 'critical-cves',
    title: 'Critical CVEs Only',
    description: 'Targeted scanning for known unauthenticated RCEs and critical exploits',
    concurrency: 40,
    rateLimit: 120,
    timeout: 8,
    severityFilter: ['critical'],
  },
  {
    id: 'passive-recon',
    title: 'Passive / Low Noise Recon',
    description: 'Gentle rate-limited probing with minimal intrusion footprints',
    concurrency: 10,
    rateLimit: 15,
    timeout: 15,
    severityFilter: ['medium', 'low', 'info'],
  },
  {
    id: 'custom',
    title: 'Custom Configuration',
    description: 'Custom fine-tuned parameters, headers, proxies, and template filters',
    concurrency: 25,
    rateLimit: 100,
    timeout: 10,
  },
];

export const TEMPLATE_CATEGORIES: Array<{
  id: 'all' | 'cves' | 'vulnerabilities' | 'exposures' | 'misconfigurations' | 'default-logins';
  label: string;
  description: string;
}> = [
  { id: 'all', label: 'All Templates', description: 'Browse complete template inventory' },
  { id: 'cves', label: 'CVEs', description: 'Standardized vulnerability CVE signatures' },
  { id: 'vulnerabilities', label: 'Vulnerabilities', description: 'RCE, SQLi, SSRF, LFI, and auth bypass checks' },
  { id: 'exposures', label: 'Exposures', description: 'Sensitive files, env configs, api keys, and git repos' },
  { id: 'misconfigurations', label: 'Misconfigurations', description: 'CORS, header, SSL, and debug misconfigs' },
  { id: 'default-logins', label: 'Default Logins', description: 'Weak / default credentials checks on admin portals' },
];

export const DSL_HELPERS_REFERENCE = [
  { name: '{{BaseURL}}', desc: 'Full target URL (scheme://host:port/path)' },
  { name: '{{RootURL}}', desc: 'Scheme + host + port without path' },
  { name: '{{Hostname}}', desc: 'Host without port' },
  { name: '{{Host}}', desc: 'Host with port' },
  { name: '{{Port}}', desc: 'Target port number' },
  { name: '{{Path}}', desc: 'URL path component' },
  { name: '{{Scheme}}', desc: 'Target scheme (http or https)' },
  { name: '{{randstr}}', desc: 'Random 12-character alphanumeric token' },
  { name: '{{rand_int(min, max)}}', desc: 'Random integer within range' },
  { name: 'base64(str)', desc: 'Encodes string into standard Base64' },
  { name: 'md5(str)', desc: 'Calculates MD5 hexadecimal digest' },
  { name: 'url_encode(str)', desc: 'URL percent-encodes input string' },
];
