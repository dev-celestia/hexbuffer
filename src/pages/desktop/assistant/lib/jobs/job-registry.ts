import { useSyncExternalStore } from 'react';
import { addTrackedAction, completeTrackedAction } from '../ai-tools/tracker';
import { toErrorMessage } from '@/lib/ipc';

export type JobStatus = 'queued' | 'running' | 'completed' | 'error' | 'cancelled';

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  'completed',
  'error',
  'cancelled',
]);

/** Settled jobs are kept so the model can still read final results, but the
 *  registry must not grow unboundedly across a long session. */
const MAX_SETTLED_JOBS = 50;

export interface JobUpdate {
  /** Percent complete, 0-100, or null when the source cannot quantify progress. */
  progress?: number | null;
  /** Latest status line or log detail for this job. */
  message?: string | null;
}

export type JobSettleStatus = 'completed' | 'error' | 'cancelled';

export interface JobRegistration {
  id: string;
  /** Feature tag, e.g. 'intruder-attack' or 'browser-crawl'. */
  kind: string;
  /** Human-readable label mirrored into the tracked-actions UI. */
  label: string;
  /** Stops the underlying operation. Invoked by cancelJob; the source adapter
   *  is expected to also settle() the job through its subscription. */
  cancel: () => void;
  /** Binds the underlying event/store source. Called once at registration;
   *  returns the unsubscribe function. */
  subscribe: (
    update: (patch: JobUpdate) => void,
    settle: (status: JobSettleStatus, message?: string | null) => void,
  ) => () => void;
}

export interface Job {
  id: string;
  kind: string;
  label: string;
  status: JobStatus;
  progress: number | null;
  lastMessage: string | null;
  createdAt: number;
  endedAt: number | null;
}

interface JobEntry {
  job: Job;
  cancel: () => void;
  unsubscribe: (() => void) | null;
  trackedActionId: string | null;
}

let entries: readonly JobEntry[] = [];
const listeners: Set<() => void> = new Set();
let jobCounter = 0;

function notify() {
  listeners.forEach((fn) => fn());
}

function replaceEntry(target: JobEntry, patch: Partial<JobEntry['job']>) {
  target.job = { ...target.job, ...patch } as Job;
}

function pruneSettled() {
  const settled = entries.filter((e) => TERMINAL_STATUSES.has(e.job.status));
  if (settled.length <= MAX_SETTLED_JOBS) return;
  const drop = new Set(settled.slice(0, settled.length - MAX_SETTLED_JOBS).map((e) => e.job.id));
  entries = entries.filter((e) => !drop.has(e.job.id));
}

/** Unique job id for a kind, safe to hand to the model for polling. */
export function nextJobId(kind: string): string {
  jobCounter += 1;
  return `job-${kind}-${Date.now()}-${jobCounter}`;
}

export function registerJob(registration: JobRegistration): Job {
  const entry: JobEntry = {
    job: {
      id: registration.id,
      kind: registration.kind,
      label: registration.label,
      status: 'running',
      progress: null,
      lastMessage: null,
      createdAt: Date.now(),
      endedAt: null,
    },
    cancel: registration.cancel,
    unsubscribe: null,
    trackedActionId: addTrackedAction(registration.kind, undefined, registration.label),
  };

  const applyUpdate = (patch: JobUpdate) => {
    if (TERMINAL_STATUSES.has(entry.job.status)) return;
    const next: Partial<Job> = {};
    if (patch.progress !== undefined) next.progress = patch.progress;
    if (patch.message !== undefined) next.lastMessage = patch.message;
    replaceEntry(entry, next);
    notify();
  };

  const settle = (status: JobSettleStatus, message?: string | null) => {
    if (TERMINAL_STATUSES.has(entry.job.status)) return;
    replaceEntry(entry, {
      status,
      endedAt: Date.now(),
      ...(message !== undefined ? { lastMessage: message } : {}),
      ...(status === 'completed' ? { progress: 100 } : {}),
    });
    entry.unsubscribe?.();
    entry.unsubscribe = null;
    if (entry.trackedActionId) {
      completeTrackedAction(entry.trackedActionId, status === 'error');
      entry.trackedActionId = null;
    }
    pruneSettled();
    notify();
  };

  entries = [...entries, entry];
  const unsub = registration.subscribe(applyUpdate, settle);
  if (TERMINAL_STATUSES.has(entry.job.status)) {
    unsub?.();
  } else {
    entry.unsubscribe = unsub;
  }
  notify();
  return entry.job;
}

export function getJob(id: string): Job | undefined {
  return entries.find((e) => e.job.id === id)?.job;
}

export function listJobs(options?: { activeOnly?: boolean }): Job[] {
  const all = entries.map((e) => e.job);
  if (!options?.activeOnly) return all;
  return all.filter((job) => !TERMINAL_STATUSES.has(job.status));
}

export function cancelJob(id: string): { ok: boolean; message: string } {
  const entry = entries.find((e) => e.job.id === id);
  if (!entry) {
    return { ok: false, message: `No job with id '${id}'.` };
  }
  if (TERMINAL_STATUSES.has(entry.job.status)) {
    return { ok: false, message: `Job '${id}' already finished with status '${entry.job.status}'.` };
  }
  try {
    entry.cancel();
  } catch (error) {
    return {
      ok: false,
      message: `Cancelling job '${id}' failed: ${toErrorMessage(error, 'Unknown error')}`,
    };
  }
  // Sources that settle through their subscription win; this covers sources
  // whose cancellation produces no observable event.
  settleEntry(entry, 'cancelled', 'Cancelled by request.');
  return { ok: true, message: `Cancellation requested for job '${id}'.` };
}

function settleEntry(entry: JobEntry, status: JobSettleStatus, message: string) {
  if (TERMINAL_STATUSES.has(entry.job.status)) return;
  replaceEntry(entry, { status, endedAt: Date.now(), lastMessage: message });
  entry.unsubscribe?.();
  entry.unsubscribe = null;
  if (entry.trackedActionId) {
    completeTrackedAction(entry.trackedActionId, false);
    entry.trackedActionId = null;
  }
  pruneSettled();
  notify();
}

export function isTerminalJobStatus(status: JobStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

function subscribeJobs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getJobsSnapshot(): readonly Job[] {
  return entries.map((e) => e.job);
}

export function useJobs(): readonly Job[] {
  return useSyncExternalStore(subscribeJobs, getJobsSnapshot, getJobsSnapshot);
}