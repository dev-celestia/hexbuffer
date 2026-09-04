import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Severity } from '../types';

export interface UiScanConfig {
  targets: string[];
  template_paths?: string[];
  raw_templates?: string[];
  concurrency: number;
  rate_limit_rps: number;
  timeout_seconds: number;
}

export interface RustFindingPayload {
  template_id: string;
  template_name: string;
  severity: string;
  matched_url: string;
  matched_at: string;
  extracted_results: string[];
}

export interface RustProgressPayload {
  completed_requests: number;
  total_requests: number;
  rps: number;
}

export interface RustScanStartedPayload {
  total_templates: number;
  total_targets: number;
}

export interface RustScanErrorPayload {
  target: string;
  message: string;
}

export interface RustScanCompletedPayload {
  elapsed_millis: number;
  total_findings: number;
}

export interface NucleiEventListeners {
  onScanStarted?: (data: RustScanStartedPayload) => void;
  onProgress?: (data: RustProgressPayload) => void;
  onFinding?: (finding: RustFindingPayload) => void;
  onScanError?: (error: RustScanErrorPayload) => void;
  onScanCompleted?: (data: RustScanCompletedPayload) => void;
}

/**
 * Start a Nuclei scan through the Rust engine.
 */
export async function startNucleiScan(config: UiScanConfig): Promise<void> {
  return invoke('start_nuclei_scan', { config });
}

/**
 * Pause the active Nuclei scan session.
 */
export async function pauseNucleiScan(): Promise<void> {
  return invoke('pause_nuclei_scan');
}

/**
 * Resume the paused Nuclei scan session.
 */
export async function resumeNucleiScan(): Promise<void> {
  return invoke('resume_nuclei_scan');
}

/**
 * Stop / Cancel the active Nuclei scan session.
 */
export async function stopNucleiScan(): Promise<void> {
  return invoke('stop_nuclei_scan');
}

/**
 * Get active scan status from the Rust engine.
 */
export async function getNucleiStatus(): Promise<string> {
  return invoke('get_nuclei_status');
}

/**
 * Subscribe to real-time events emitted by the Nuclei Rust engine.
 */
export async function subscribeNucleiEvents(listeners: NucleiEventListeners): Promise<() => void> {
  const unlistens: UnlistenFn[] = [];

  if (listeners.onScanStarted) {
    const u = await listen<RustScanStartedPayload>('nuclei://scan-started', (e) => {
      listeners.onScanStarted?.(e.payload);
    });
    unlistens.push(u);
  }

  if (listeners.onProgress) {
    const u = await listen<RustProgressPayload>('nuclei://progress', (e) => {
      listeners.onProgress?.(e.payload);
    });
    unlistens.push(u);
  }

  if (listeners.onFinding) {
    const u = await listen<RustFindingPayload>('nuclei://finding', (e) => {
      listeners.onFinding?.(e.payload);
    });
    unlistens.push(u);
  }

  if (listeners.onScanError) {
    const u = await listen<RustScanErrorPayload>('nuclei://scan-error', (e) => {
      listeners.onScanError?.(e.payload);
    });
    unlistens.push(u);
  }

  if (listeners.onScanCompleted) {
    const u = await listen<RustScanCompletedPayload>('nuclei://scan-completed', (e) => {
      listeners.onScanCompleted?.(e.payload);
    });
    unlistens.push(u);
  }

  return () => {
    unlistens.forEach((fn) => fn());
  };
}

export interface RustSyncProgressPayload {
  status: 'downloading' | 'indexing' | 'completed' | 'error';
  message: string;
  total?: number;
}

export interface SyncResultPayload {
  total_templates: number;
  cache_path: string;
  templates: Array<{
    id: string;
    name: string;
    severity: string;
    protocol: string;
    tags: string[];
    description: string;
    author: string;
    category: string;
    source_path?: string;
  }>;
}

export interface CachedTemplatesPayload {
  is_cached: boolean;
  total_templates: number;
  cache_path?: string;
  templates: Array<{
    id: string;
    name: string;
    severity: string;
    protocol: string;
    tags: string[];
    description: string;
    author: string;
    category: string;
    source_path?: string;
  }>;
}

/**
 * Synchronize official Nuclei templates from GitHub (projectdiscovery/nuclei-templates).
 */
export async function syncOfficialNucleiTemplates(force = false): Promise<SyncResultPayload> {
  return invoke('sync_official_nuclei_templates', { force });
}

/**
 * Get cached official Nuclei templates from disk if previously synced.
 */
export async function getCachedOfficialTemplates(): Promise<CachedTemplatesPayload> {
  return invoke('get_cached_official_templates');
}

/**
 * Listen to official template sync progress events from the backend.
 */
export async function listenToSyncProgress(
  onProgress: (data: RustSyncProgressPayload) => void,
): Promise<() => void> {
  return listen<RustSyncProgressPayload>('nuclei://sync-progress', (e) => {
    onProgress(e.payload);
  });
}

/**
 * Read raw YAML content for a disk-based template on demand.
 */
export async function readTemplateYaml(sourcePath: string): Promise<string> {
  return invoke('read_template_yaml', { sourcePath });
}

