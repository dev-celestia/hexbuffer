// Regression feature types — Nuclei YAML script testing

export interface RegressionScript {
  id: string;
  name: string;
  description: string;
  targetUrl: string;
  yaml: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConditionStatus = 'pending' | 'passed' | 'failed';

export interface RegressionCondition {
  id: string;
  name: string;
  severity: string;
  status: ConditionStatus;
  matchedUrl: string | null;
  extracted: string[] | null;
}

export interface RegressionFinding {
  templateId: string;
  templateName: string;
  severity: string;
  matchedUrl: string;
  matchedAt: string;
  extractedResults: string[];
}

export interface RunMessage {
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  at: string;
}

export interface RunProgress {
  completedRequests: number;
  totalRequests: number;
  rps: number;
}

export interface RegressionRun {
  id: string;
  scriptId: string;
  status: string;
  conditions: RegressionCondition[];
  findings: RegressionFinding[];
  messages: RunMessage[];
  totalTemplates: number;
  totalTargets: number;
  passedConditions: number;
  failedConditions: number;
  elapsedMillis: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  templates: { id: string; name: string; severity: string }[];
}

export interface ScriptDraft {
  name: string;
  description: string;
  targetUrl: string;
  yaml: string;
}

export type RegressionScriptInput = Omit<RegressionScript, 'createdAt' | 'updatedAt'>;
