export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ProtocolType =
  | 'http'
  | 'dns'
  | 'ssl'
  | 'tcp'
  | 'websocket'
  | 'headless'
  | 'javascript'
  | 'code'
  | 'file'
  | 'whois';

export type ScanStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'error';

export type ScanPreset =
  | 'quick-triage'
  | 'full-audit'
  | 'critical-cves'
  | 'passive-recon'
  | 'custom';

export type NucleiTab = 'findings' | 'templates' | 'studio' | 'console';

export interface NucleiFinding {
  id: string;
  template_id: string;
  template_name: string;
  severity: Severity;
  matched_url: string;
  matched_at: string;
  extracted_results: string[];
  protocol: ProtocolType;
  matcher_name?: string;
  tags?: string[];
  description?: string;
  author?: string;
  cve_id?: string;
  cvss_score?: number;
  remediation?: string;
  reference?: string[];
  request_raw?: string;
  response_raw?: string;
  curl_command?: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  severity: Severity;
  protocol: ProtocolType;
  tags: string[];
  description: string;
  author: string;
  cve_id?: string;
  category: 'cves' | 'vulnerabilities' | 'exposures' | 'misconfigurations' | 'default-logins' | 'custom';
  yaml_content?: string;
  selected?: boolean;
}

export interface NucleiScanConfig {
  targets: string[];
  template_ids: string[];
  preset: ScanPreset;
  concurrency: number;
  rate_limit_rps: number;
  timeout_seconds: number;
  retries: number;
  max_redirects: number;
  custom_headers: Record<string, string>;
  proxy_url?: string;
  excluded_targets: string[];
  headless: boolean;
  follow_redirects: boolean;
}

export interface ScanProgress {
  completed_requests: number;
  total_requests: number;
  rps: number;
  percentage: number;
  elapsed_seconds: number;
}

export interface ScanLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'vuln';
  message: string;
  target?: string;
  template_id?: string;
  severity?: Severity;
}

export interface ScanSummaryStats {
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total_requests: number;
  avg_rps: number;
  elapsed_millis: number;
  targets_count: number;
  templates_count: number;
}

export interface ValidationDiagnostic {
  line?: number;
  column?: number;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface TemplateValidationResult {
  valid: boolean;
  diagnostics: ValidationDiagnostic[];
  metadata?: {
    id: string;
    name: string;
    severity: Severity;
    author: string;
    protocol: ProtocolType;
    tags: string[];
  };
}

export interface TemplateTestResult {
  matched: boolean;
  status_code?: number;
  extracted: string[];
  elapsed_ms: number;
  request_sample?: string;
  response_sample?: string;
  error?: string;
}
