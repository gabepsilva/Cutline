import { env } from '$env/dynamic/private';
import type { Database } from '$lib/server/db/types';
import type { JobType } from '$lib/types/job';
import {
	cancelJob,
	claimJob,
	completeJob,
	extendJobLease,
	failJob,
	isJobCancelRequested,
	reapExpiredJobs,
	reportJobProgress,
	type JobRow
} from './job-store';

export class JobCanceledError extends Error {
	constructor(message = 'Job canceled') {
		super(message);
		this.name = 'JobCanceledError';
	}
}

export interface JobHandlerContext {
	job: JobRow;
	reportProgress: (progress: number) => Promise<void>;
	isCancelRequested: () => Promise<boolean>;
	complete: (result: unknown) => Promise<void>;
}

export type JobHandler = (ctx: JobHandlerContext) => Promise<void>;

const handlers = new Map<JobType, JobHandler>();

export function registerJobHandler(type: JobType, handler: JobHandler) {
	handlers.set(type, handler);
}

export function getJobHandler(type: JobType): JobHandler | undefined {
	return handlers.get(type);
}

export function clearJobHandlers() {
	handlers.clear();
}

/** Echo handler for substrate tests — returns the payload in the result. */
export function registerEchoHandler(type: JobType = 'ingest') {
	registerJobHandler(type, async (ctx) => {
		await ctx.reportProgress(0.5);
		if (await ctx.isCancelRequested()) {
			throw new JobCanceledError();
		}
		await ctx.reportProgress(1);
		await ctx.complete({ echo: JSON.parse(ctx.job.payload) });
	});
}

/**
 * Stub export handler until #143 — simulates render progress server-side.
 * TODO(backend): Replace with real ffmpeg export handler in M10-01 (#143).
 */
export function registerExportStubHandler(stepDelayMs = 80) {
	registerJobHandler('export', async (ctx) => {
		const steps = 10;
		for (let step = 1; step <= steps; step++) {
			if (await ctx.isCancelRequested()) {
				throw new JobCanceledError();
			}
			if (stepDelayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
			}
			await ctx.reportProgress(step / steps);
		}
		await ctx.complete({
			stub: true,
			message: 'Export render deferred to M10-01 (#143)',
			config: JSON.parse(ctx.job.payload)
		});
	});
}

function registerDefaultHandlers() {
	if (!handlers.has('export')) {
		registerExportStubHandler();
	}
}

async function runClaimedJob(
	database: Database,
	workerId: string,
	claimed: JobRow
): Promise<'done' | 'retry' | 'failed' | 'canceled'> {
	registerDefaultHandlers();

	const handler = handlers.get(claimed.type as JobType);
	if (!handler) {
		await failJob(
			database,
			claimed.id,
			workerId,
			`No handler registered for type: ${claimed.type}`
		);
		return 'failed';
	}

	const ctx: JobHandlerContext = {
		job: claimed,
		reportProgress: async (progress) => {
			await reportJobProgress(database, claimed.id, workerId, progress);
			await extendJobLease(database, claimed.id, workerId);
		},
		isCancelRequested: () => isJobCancelRequested(database, claimed.id),
		complete: async (result) => {
			await completeJob(database, claimed.id, workerId, result);
		}
	};

	try {
		await handler(ctx);
		return 'done';
	} catch (error) {
		if (error instanceof JobCanceledError) {
			await cancelJob(database, claimed.id, workerId);
			return 'canceled';
		}

		const message = error instanceof Error ? error.message : 'Job handler failed';
		const outcome = await failJob(database, claimed.id, workerId, message);
		return outcome === 'missing' ? 'failed' : outcome;
	}
}

/** Claim and run one job. Returns true when a job was processed. */
export async function runWorkerOnce(database: Database, workerId: string): Promise<boolean> {
	await reapExpiredJobs(database);

	const claimed = await claimJob(database, workerId);
	if (!claimed) {
		return false;
	}

	await runClaimedJob(database, workerId, claimed);
	return true;
}

/** Process queued jobs until the queue is empty or `maxJobs` is reached. */
export async function runWorkerBatch(
	database: Database,
	workerId: string,
	maxJobs = Number.POSITIVE_INFINITY
): Promise<number> {
	let processed = 0;

	while (processed < maxJobs) {
		const ran = await runWorkerOnce(database, workerId);
		if (!ran) break;
		processed += 1;
	}

	return processed;
}

/** Long-running worker loop for standalone process (`bun run jobs:worker`). */
export async function runWorkerLoop(
	database: Database,
	workerId: string,
	options: { pollIntervalMs?: number; signal?: AbortSignal } = {}
) {
	const pollIntervalMs = options.pollIntervalMs ?? 1_000;

	while (!options.signal?.aborted) {
		const processed = await runWorkerBatch(database, workerId, 10);
		if (processed === 0) {
			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
		}
	}
}

/** Max jobs processed per inline kick — avoids draining the queue in one web request. */
const INLINE_WORKER_MAX_JOBS = 3;

/** Fire-and-forget inline worker kick after enqueue (dev/single-node convenience). */
export function kickWorker(database: Database, workerId = 'inline') {
	if (env.INLINE_JOB_WORKER === 'false') {
		return;
	}

	void runWorkerBatch(database, workerId, INLINE_WORKER_MAX_JOBS);
}
