import { getJob, listJobs, cancelJob, isTerminalJobStatus, type Job } from '../jobs/job-registry';

export const LIST_JOBS_AI_TOOL_DEFINITION = {
  name: 'list_jobs',
  description:
    'List background jobs started by AI tools (Intruder attacks, browser crawls) with their live status, percent progress and job ids. Use this to discover handles for get_job_status and cancel_job.',
  parameters: {
    type: 'object',
    properties: {
      activeOnly: {
        type: 'boolean',
        description: 'When true, only return jobs that have not finished. Defaults to false.',
      },
    },
  },
};

export const GET_JOB_STATUS_AI_TOOL_DEFINITION = {
  name: 'get_job_status',
  description:
    'Poll a background job by id: status (running/completed/error/cancelled), percent progress and the latest message. To wait for a long operation, poll this between rounds instead of blocking.',
  parameters: {
    type: 'object',
    properties: {
      jobId: {
        type: 'string',
        description: 'Job id returned by a launch tool or by list_jobs.',
      },
    },
    required: ['jobId'],
  },
};

export const CANCEL_JOB_AI_TOOL_DEFINITION = {
  name: 'cancel_job',
  description:
    'Cancel a running background job by id, stopping the Intruder attack or browser crawl it drives.',
  parameters: {
    type: 'object',
    properties: {
      jobId: {
        type: 'string',
        description: 'Job id of a running job.',
      },
    },
    required: ['jobId'],
  },
};

function describeJob(job: Job) {
  return JSON.stringify({
    id: job.id,
    kind: job.kind,
    label: job.label,
    status: job.status,
    progress: job.progress,
    lastMessage: job.lastMessage,
    createdAt: new Date(job.createdAt).toISOString(),
    endedAt: job.endedAt ? new Date(job.endedAt).toISOString() : null,
  });
}

function resolveJobId(args: Record<string, any>): string {
  const jobId = args.jobId ?? args.job_id ?? args.id;
  if (!jobId || typeof jobId !== 'string') {
    throw new Error('A string jobId is required.');
  }
  return jobId;
}

export async function executeListJobsAiTool(args: Record<string, any>): Promise<string> {
  const activeOnly = Boolean(args?.activeOnly ?? args?.active_only);
  const jobs = listJobs({ activeOnly });
  if (jobs.length === 0) {
    return activeOnly
      ? 'No active background jobs. Finished jobs are hidden with activeOnly=true; call without it to see history.'
      : 'No background jobs have been started in this session yet.';
  }
  const summary = jobs.map((job) =>
    job.status === 'running' || !isTerminalJobStatus(job.status)
      ? `- ${job.id} [${job.kind}] RUNNING ${job.progress ?? '?'}% — ${job.lastMessage ?? 'no update yet'}`
      : `- ${job.id} [${job.kind}] ${job.status.toUpperCase()} — ${job.lastMessage ?? 'no final message'}`,
  );
  return `Background jobs (${jobs.length}):\n${summary.join('\n')}`;
}

export async function executeGetJobStatusAiTool(args: Record<string, any>): Promise<string> {
  const id = resolveJobId(args);
  const job = getJob(id);
  if (!job) {
    const known = listJobs()
      .slice(-10)
      .map((j) => j.id)
      .join(', ');
    return `No job with id '${id}'.${known ? ` Recently known jobs: ${known}.` : ' No jobs have been started in this session yet.'}`;
  }
  return `Job status:\n${describeJob(job)}`;
}

export async function executeCancelJobAiTool(args: Record<string, any>): Promise<string> {
  const id = resolveJobId(args);
  const result = cancelJob(id);
  return result.ok
    ? `Cancellation requested for job '${id}'. Confirm with get_job_status.`
    : `Could not cancel job '${id}': ${result.message}`;
}