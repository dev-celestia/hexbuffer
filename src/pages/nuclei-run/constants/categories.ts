import type { Severity, ProtocolType } from '../types';

export interface ScanCategoryDef {
  id: string;
  name: string;
  badge: string;
  description: string;
  tags: string[];
  severities?: Severity[];
  recommendedNoise: 'Very Low' | 'Low' | 'Medium' | 'Active';
}

export interface TechStackDef {
  id: string;
  name: string;
  tags: string[];
  description: string;
  countKey: string;
}

export interface TaxonomyItem {
  id: string;
  label: string;
  countKey?: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// Standard Nuclei Taxonomy Reference (from projectdiscovery/nuclei-templates)
// ---------------------------------------------------------------------------

export const NUCLEI_DIRECTORIES: TaxonomyItem[] = [
  { id: 'all', label: 'All Directories' },
  { id: 'http', label: 'HTTP Probes', badge: 'http' },
  { id: 'cloud', label: 'Cloud & IAM', badge: 'cloud' },
  { id: 'file', label: 'File Inspection', badge: 'file' },
  { id: 'network', label: 'Network / TCP', badge: 'network' },
  { id: 'code', label: 'Code Execution', badge: 'code' },
  { id: 'dast', label: 'DAST & Fuzzing', badge: 'dast' },
  { id: 'workflows', label: 'Workflows', badge: 'workflows' },
  { id: 'javascript', label: 'JavaScript Probes', badge: 'javascript' },
  { id: 'ssl', label: 'SSL / TLS Ciphers', badge: 'ssl' },
  { id: 'dns', label: 'DNS Records', badge: 'dns' },
  { id: 'headless', label: 'Headless Browser', badge: 'headless' },
  { id: 'websocket', label: 'WebSocket', badge: 'websocket' },
];

export const POPULAR_TAGS: TaxonomyItem[] = [
  { id: 'vuln', label: 'Vulnerabilities (vuln)' },
  { id: 'cve', label: 'Known CVEs (cve)' },
  { id: 'discovery', label: 'Discovery / Recon' },
  { id: 'vkev', label: 'Known Exploited (vkev)' },
  { id: 'panel', label: 'Admin Panels (panel)' },
  { id: 'xss', label: 'Cross-Site Scripting (xss)' },
  { id: 'wordpress', label: 'WordPress (wordpress)' },
  { id: 'exposure', label: 'Exposures (exposure)' },
  { id: 'wp-plugin', label: 'WP Plugins (wp-plugin)' },
  { id: 'osint', label: 'OSINT & Metadata (osint)' },
  { id: 'rce', label: 'Remote Code Exec (rce)' },
  { id: 'lfi', label: 'Local File Inclusion (lfi)' },
  { id: 'ssrf', label: 'Server-Side Forgery (ssrf)' },
  { id: 'auth-bypass', label: 'Auth Bypass (auth-bypass)' },
  { id: 'sqli', label: 'SQL Injection (sqli)' },
  { id: 'misconfig', label: 'Misconfigurations' },
  { id: 'default-login', label: 'Default Credentials' },
  { id: 'fuzzing', label: 'Fuzzing Payloads' },
];

export const TOP_AUTHORS: TaxonomyItem[] = [
  { id: 'dhiyaneshdk', label: 'dhiyaneshdk' },
  { id: 'daffainfo', label: 'daffainfo' },
  { id: 'princechaddha', label: 'princechaddha' },
  { id: 'dwisiswant0', label: 'dwisiswant0' },
  { id: 'ritikchaddha', label: 'ritikchaddha' },
  { id: 'pussycat0x', label: 'pussycat0x' },
  { id: 'pikpikcu', label: 'pikpikcu' },
  { id: 'pdteam', label: 'pdteam' },
  { id: 'pdresearch', label: 'pdresearch' },
  { id: 'iamnoooob', label: 'iamnoooob' },
];

export const PROTOCOL_TYPES: { id: ProtocolType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Protocols' },
  { id: 'http', label: 'HTTP / HTTPS' },
  { id: 'dns', label: 'DNS' },
  { id: 'tcp', label: 'TCP / Network' },
  { id: 'ssl', label: 'SSL / TLS' },
  { id: 'file', label: 'File Inspection' },
  { id: 'code', label: 'Code Execution' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'headless', label: 'Headless Browser' },
  { id: 'websocket', label: 'WebSocket' },
  { id: 'whois', label: 'WHOIS' },
];

// ---------------------------------------------------------------------------
// Curated Phased Scanning Strategies
// ---------------------------------------------------------------------------

export const RESEARCHER_STRATEGIES: ScanCategoryDef[] = [
  {
    id: 'recon-first',
    name: 'Recon & Fingerprint First',
    badge: 'Step A: Recon',
    description: 'Lightweight fingerprinting to identify active tech stacks, admin panels, and configuration exposures without triggering WAF alarms.',
    tags: ['tech', 'panel', 'exposure', 'detection', 'favicon'],
    recommendedNoise: 'Very Low',
  },
  {
    id: 'cves-critical-high',
    name: 'High-Impact CVE Audit',
    badge: 'Step B: Targeted CVEs',
    description: 'Focus purely on severe, confirmed software vulnerabilities with known RCE and authentication bypass exploits.',
    tags: ['cve', 'rce', 'auth-bypass', 'sqli'],
    severities: ['critical', 'high'],
    recommendedNoise: 'Low',
  },
  {
    id: 'recent-cves',
    name: 'Recent CVEs (2025–2026)',
    badge: 'Latest 0-Days',
    description: 'Fastest way to test for fresh disclosures, zero-days, and recently published security advisories.',
    tags: ['cve-2026', 'cve-2025', '2026', '2025'],
    severities: ['critical', 'high', 'medium'],
    recommendedNoise: 'Low',
  },
  {
    id: 'dast-fuzzing',
    name: 'DAST / Active Fuzzing',
    badge: 'Runtime Injection',
    description: 'Active parameter injection testing for XSS, SQLi, LFI, SSRF, and Open Redirects.',
    tags: ['dast', 'fuzzing', 'xss', 'sqli', 'lfi', 'ssrf'],
    recommendedNoise: 'Active',
  },
  {
    id: 'cloud-token-leaks',
    name: 'Cloud & Token Leaks',
    badge: 'Secrets & Cloud',
    description: 'Exposed AWS/GCP credentials, public S3 buckets, JWT weaknesses, and environment configuration dumps.',
    tags: ['token', 'cloud', 'aws', 's3', 'azure', 'env'],
    recommendedNoise: 'Very Low',
  },
];

// ---------------------------------------------------------------------------
// Contextual Tech Stacks
// ---------------------------------------------------------------------------

export const TECH_STACKS: TechStackDef[] = [
  {
    id: 'wordpress',
    name: 'WordPress',
    tags: ['wordpress', 'wp', 'xmlrpc', 'plugin', 'wp-plugin'],
    description: 'Core enumeration, vulnerable plugins, xmlrpc attacks, and REST API exposure.',
    countKey: 'wordpress',
  },
  {
    id: 'react',
    name: 'React / Next.js',
    tags: ['react', 'nextjs', 'next', 'source-map', 'next-auth', 'react-router'],
    description: 'Next.js server action flaws, exposed source maps (.map), SSRF, and debug disclosures.',
    countKey: 'react',
  },
  {
    id: 'vue',
    name: 'Vue / Nuxt',
    tags: ['vue', 'nuxt', 'nuxtjs', 'vuejs'],
    description: 'Nuxt devtools exposure, SSR memory leaks, and client-side source map disclosures.',
    countKey: 'vue',
  },
  {
    id: 'nodejs',
    name: 'Node.js / Express',
    tags: ['nodejs', 'node', 'express', 'package-json', 'npm', 'package.json'],
    description: 'Prototype pollution, package.json leaks, and Express debug endpoints.',
    countKey: 'nodejs',
  },
  {
    id: 'python',
    name: 'Python / Django / Flask',
    tags: ['python', 'django', 'flask', 'fastapi', 'werkzeug'],
    description: 'Werkzeug interactive debug consoles, Django debug secret leaks, and FastAPI Swagger leaks.',
    countKey: 'python',
  },
  {
    id: 'apache',
    name: 'Apache / Tomcat',
    tags: ['apache', 'tomcat', 'struts', 'log4j'],
    description: 'Server status leaks, Tomcat manager, Log4j RCE, and Apache HTTP server misconfigurations.',
    countKey: 'apache',
  },
  {
    id: 'nginx',
    name: 'Nginx',
    tags: ['nginx', 'alias-traversal', 'proxy-pass'],
    description: 'Nginx alias traversal, CRLF injection, and insecure reverse proxy headers.',
    countKey: 'nginx',
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    tags: ['spring', 'actuator', 'spring-boot', 'heapdump'],
    description: 'Unprotected Spring Boot Actuator endpoints, env dumps, and Spring4Shell.',
    countKey: 'spring-boot',
  },
  {
    id: 'laravel',
    name: 'Laravel / PHP',
    tags: ['laravel', 'php', 'ignition', 'debug', 'telescope'],
    description: 'Ignition RCE, debug mode exposure, Telescope leaks, and .env disclosure.',
    countKey: 'laravel',
  },
  {
    id: 'rails',
    name: 'Ruby on Rails',
    tags: ['rails', 'ruby', 'actioncable', 'sidekiq'],
    description: 'Unprotected Sidekiq dashboards, secret_key_base leaks, and Rails database dumps.',
    countKey: 'rails',
  },
  {
    id: 'docker-k8s',
    name: 'Docker / Kubernetes',
    tags: ['docker', 'k8s', 'kubernetes', 'container', 'kubelet'],
    description: 'Exposed Docker daemon API, unauthenticated Kubernetes Kubelet & API server.',
    countKey: 'docker-k8s',
  },
  {
    id: 'jenkins',
    name: 'Jenkins CI/CD',
    tags: ['jenkins', 'ci-cd', 'script-console'],
    description: 'Unauthenticated Jenkins CLI, script console RCE, and credential disclosures.',
    countKey: 'jenkins',
  },
  {
    id: 'git',
    name: 'Git & Source Repos',
    tags: ['git', 'gitlab', 'github', 'bitbucket', '.git', 'repo'],
    description: 'Exposed .git/ folders, .env files, GitLab RCEs, and webhook disclosures.',
    countKey: 'git',
  },
  {
    id: 'graphql-api',
    name: 'GraphQL & Swagger APIs',
    tags: ['graphql', 'apollo', 'hasura', 'swagger', 'openapi', 'api-doc'],
    description: 'GraphQL schema introspection, batching attacks, and public OpenAPI/Swagger schemas.',
    countKey: 'graphql-api',
  },
  {
    id: 'databases',
    name: 'Databases & Cache',
    tags: ['redis', 'elasticsearch', 'mongodb', 'postgres', 'mysql', 'kibana'],
    description: 'Unauthenticated Redis, Elasticsearch data exposure, exposed Kibana panels, and Mongo status.',
    countKey: 'databases',
  },
  {
    id: 'atlassian',
    name: 'Atlassian (Jira / Confluence)',
    tags: ['atlassian', 'jira', 'confluence'],
    description: 'Confluence OGNL injection, Jira user enumeration, and add-on security vulnerabilities.',
    countKey: 'atlassian',
  },
];
