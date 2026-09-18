import { describe, expect, it, vi } from 'vitest';
import {
  registerJob,
  getJob,
  listJobs,
  cancelJob,
  nextJobId,
  isTerminalJobStatus,
} from './job-registry';
import { getTrackedActions } from '../ai-tools/tracker';

type UpdateFn = (patch: { progress?: number | null; message?: string | null }) => void;
type SettleFn = (status: 'completed' | 'error' | 'cancelled', message?: string | null) => void;

/** Registers a job and hands back its live update/settle callbacks. */
function registerWithHandles(kind: string): { id: string; update: UpdateFn; settle: SettleFn } {
  let update!: UpdateFn;
  let settle!: SettleFn;
  const id = nextJobId(kind);
  registerJob({
    id,
    kind,
    label: `Job ${kind}`,
    cancel: () => {},
    subscribe: (u, s) => {
      update = u;
      settle = s;
      return () => {};
    },
  });
  return { id, update, settle };
}

describe('job registry', () => {
  it('registers a job as running and mirrors it into the tracked-actions list', () => {
    const id = nextJobId('tracker-mirror');
    registerJob({
      id,
      kind: 'tracker-mirror',
      label: 'Mirrored job',
      cancel: () => {},
      subscribe: () => () => {},
    });

    expect(getJob(id)?.status).toBe('running');
    expect(getTrackedActions().some((a) => a.label === 'Mirrored job' && a.status === 'in_progress')).toBe(true);
  });

  it('applies progress updates while running', () => {
    const { id, update } = registerWithHandles('progress');
    update({ progress: 42, message: 'halfway there' });

    const job = getJob(id)!;
    expect(job.progress).toBe(42);
    expect(job.lastMessage).toBe('halfway there');
  });

  it('settles once, pins completion progress, and ignores late updates', () => {
    const { id, update, settle } = registerWithHandles('settle');
    settle('completed', 'done');
    update({ progress: 99 });
    settle('error', 'late arrival');

    const job = getJob(id)!;
    expect(job.status).toBe('completed');
    expect(job.progress).toBe(100);
    expect(job.lastMessage).toBe('done');
    expect(job.endedAt).not.toBeNull();
  });

  it('marks errored and cancelled jobs terminal without forcing progress', () => {
    const failed = registerWithHandles('failed');
    failed.settle('error', 'boom');
    expect(getJob(failed.id)?.status).toBe('error');
    expect(getJob(failed.id)?.progress).toBeNull();

    const cancelled = registerWithHandles('cancelled');
    cancelled.settle('cancelled', 'stopped');
    expect(getJob(cancelled.id)?.status).toBe('cancelled');
  });

  it('cancelJob runs the cancel callback, settles the job, and rejects double-cancel', () => {
    const cancelSpy = vi.fn();
    const id = nextJobId('cancellable');
    registerJob({
      id,
      kind: 'cancellable',
      label: 'Cancellable',
      cancel: cancelSpy,
      subscribe: () => () => {},
    });

    expect(cancelJob(id).ok).toBe(true);
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(getJob(id)?.status).toBe('cancelled');
    expect(cancelJob(id).ok).toBe(false);
    expect(cancelJob('job-does-not-exist').ok).toBe(false);
  });

  it('completes the mirrored tracked action when the job settles', () => {
    const { id, settle } = registerWithHandles('mirror-settle');
    settle('completed', 'finished');

    const tracked = getTrackedActions().find((a) => a.label === 'Job mirror-settle');
    expect(tracked?.status).toBe('completed');
  });

  it('listJobs separates active from settled jobs', () => {
    const running = registerWithHandles('listing');
    const settled = registerWithHandles('listing');
    settled.settle('completed');

    const active = listJobs({ activeOnly: true }).filter((j) => j.kind === 'listing');
    expect(active.map((j) => j.id)).toContain(running.id);
    expect(active.map((j) => j.id)).not.toContain(settled.id);

    const all = listJobs().filter((j) => j.kind === 'listing');
    expect(all.map((j) => j.id)).toEqual(expect.arrayContaining([running.id, settled.id]));
  });

  it('classifies terminal statuses', () => {
    expect(isTerminalJobStatus('completed')).toBe(true);
    expect(isTerminalJobStatus('error')).toBe(true);
    expect(isTerminalJobStatus('cancelled')).toBe(true);
    expect(isTerminalJobStatus('running')).toBe(false);
    expect(isTerminalJobStatus('queued')).toBe(false);
  });
});