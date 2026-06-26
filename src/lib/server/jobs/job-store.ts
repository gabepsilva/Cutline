import { and, eq, lt, sql } from 'drizzle-orm';
import { job } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { assertProjectOwned } from '$lib/server/project-access';
import type { ServerError, ServerResult } from '$lib/server/result';
import type {
	EnqueueJobInput,
	JobStatus,
	JobStatusResponse,
	JobType,
	TerminalJobStatus
} from '$lib/types/job';
import { JOB_STATUSES, JOB_TYPES, TERMINAL_JOB_STATUSES } from '$lib/types/job';

export type JobRow = typeof job.$inferSelect;

const DEFAULT_LEASE_MS = 60_000;
const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 60_000;

function nowMs() {
	return Date.now();
}

function parseJson(value: string): unknown {
	return JSON.parse(value) as unknown;
}

function isJobType(value: string): value is JobType {
	return (JOB_TYPES as readonly string[]).includes(value);
}

function isJobStatus(value: string): value is JobStatus {
	return (JOB_STATUSES as readonly string[]).includes(value);
}

function isTerminalStatus(status: JobStatus): status is TerminalJobStatus {
	return (TERMINAL_JOB_STATUSES as readonly string[]).includes(status);
}

export function toJobStatusResponse(row: JobRow): JobStatusResponse {
	if (!isJobStatus(row.status)) {
		throw new Error(`Invalid job status: ${row.status}`);
	}

	return {
		status: row.status,
		progress: row.progress,
		...(row.result != null ? { result: parseJson(row.result) } : {}),
		...(row.error != null ? { error: row.error } : {})
	};
}

export async function enqueueJob(
	database: Database,
	input: EnqueueJobInput
): Promise<{ id: string }> {
	const id = crypto.randomUUID();
	const now = nowMs();

	await database.insert(job).values({
		id,
		type: input.type,
		projectId: input.projectId,
		status: 'queued',
		payload: JSON.stringify(input.payload),
		priority: input.priority ?? 0,
		maxAttempts: input.maxAttempts ?? 3,
		runAfter: new Date(now),
		createdAt: new Date(now),
		updatedAt: new Date(now)
	});

	return { id };
}

/** Atomically claim the next eligible queued job. Returns null when the queue is empty. */
export async function claimJob(
	database: Database,
	workerId: string,
	leaseMs = DEFAULT_LEASE_MS
): Promise<JobRow | null> {
	const now = nowMs();
	const leaseUntil = now + leaseMs;

	const rows = await database.all<{ id: string }>(
		sql`
			UPDATE job
			SET
				status = 'running',
				locked_by = ${workerId},
				lease_until = ${leaseUntil},
				started_at = COALESCE(started_at, ${now}),
				attempts = attempts + 1,
				updated_at = ${now}
			WHERE id = (
				SELECT id
				FROM job
				WHERE status = 'queued'
					AND run_after <= ${now}
					AND cancel_requested = 0
				ORDER BY priority ASC, created_at ASC
				LIMIT 1
			)
			RETURNING id
		`
	);

	const claimedId = rows[0]?.id;
	if (!claimedId) {
		return null;
	}

	return getJobById(database, claimedId);
}

export async function getJobById(database: Database, jobId: string): Promise<JobRow | null> {
	const [row] = await database.select().from(job).where(eq(job.id, jobId)).limit(1);
	return row ?? null;
}

export async function getOwnedJobStatus(
	database: Database,
	userId: string,
	jobId: string
): Promise<ServerResult & { data?: JobStatusResponse }> {
	const row = await getJobById(database, jobId);
	if (!row) {
		return { ok: false, status: 404, message: 'Job not found' };
	}

	const ownerError = await assertProjectOwned(database, userId, row.projectId);
	if (ownerError) {
		return ownerError;
	}

	return { ok: true, data: toJobStatusResponse(row) };
}

export async function reportJobProgress(
	database: Database,
	jobId: string,
	workerId: string,
	progress: number
): Promise<boolean> {
	const now = nowMs();
	const result = await database
		.update(job)
		.set({
			progress: Math.min(1, Math.max(0, progress)),
			updatedAt: new Date(now)
		})
		.where(and(eq(job.id, jobId), eq(job.lockedBy, workerId), eq(job.status, 'running')));

	return result.rowsAffected > 0;
}

export async function extendJobLease(
	database: Database,
	jobId: string,
	workerId: string,
	leaseMs = DEFAULT_LEASE_MS
): Promise<boolean> {
	const now = nowMs();
	const result = await database
		.update(job)
		.set({
			leaseUntil: new Date(now + leaseMs),
			updatedAt: new Date(now)
		})
		.where(and(eq(job.id, jobId), eq(job.lockedBy, workerId), eq(job.status, 'running')));

	return result.rowsAffected > 0;
}

export async function completeJob(
	database: Database,
	jobId: string,
	workerId: string,
	resultPayload: unknown
): Promise<boolean> {
	const now = nowMs();
	const result = await database
		.update(job)
		.set({
			status: 'succeeded',
			progress: 1,
			result: JSON.stringify(resultPayload),
			error: null,
			finishedAt: new Date(now),
			updatedAt: new Date(now),
			lockedBy: null,
			leaseUntil: null
		})
		.where(and(eq(job.id, jobId), eq(job.lockedBy, workerId), eq(job.status, 'running')));

	return result.rowsAffected > 0;
}

export async function failJob(
	database: Database,
	jobId: string,
	workerId: string,
	errorMessage: string
): Promise<'retry' | 'failed' | 'missing'> {
	const row = await getJobById(database, jobId);
	if (!row || row.lockedBy !== workerId || row.status !== 'running') {
		return 'missing';
	}

	const now = nowMs();
	if (row.attempts >= row.maxAttempts) {
		await database
			.update(job)
			.set({
				status: 'failed',
				error: errorMessage,
				finishedAt: new Date(now),
				updatedAt: new Date(now),
				lockedBy: null,
				leaseUntil: null
			})
			.where(eq(job.id, jobId));
		return 'failed';
	}

	const backoffMs = Math.min(BACKOFF_BASE_MS * 2 ** (row.attempts - 1), BACKOFF_MAX_MS);
	await database
		.update(job)
		.set({
			status: 'queued',
			error: errorMessage,
			runAfter: new Date(now + backoffMs),
			updatedAt: new Date(now),
			lockedBy: null,
			leaseUntil: null
		})
		.where(eq(job.id, jobId));

	return 'retry';
}

export async function cancelJob(
	database: Database,
	jobId: string,
	workerId: string
): Promise<boolean> {
	const now = nowMs();
	const result = await database
		.update(job)
		.set({
			status: 'canceled',
			finishedAt: new Date(now),
			updatedAt: new Date(now),
			lockedBy: null,
			leaseUntil: null
		})
		.where(and(eq(job.id, jobId), eq(job.lockedBy, workerId), eq(job.status, 'running')));

	return result.rowsAffected > 0;
}

export async function requestJobCancel(
	database: Database,
	userId: string,
	jobId: string
): Promise<ServerError | null> {
	const row = await getJobById(database, jobId);
	if (!row) {
		return { ok: false, status: 404, message: 'Job not found' };
	}

	const ownerError = await assertProjectOwned(database, userId, row.projectId);
	if (ownerError) {
		return ownerError;
	}

	if (!isJobStatus(row.status) || isTerminalStatus(row.status)) {
		return { ok: false, status: 400, message: 'Job is already finished' };
	}

	const now = nowMs();

	if (row.status === 'queued') {
		await database
			.update(job)
			.set({
				status: 'canceled',
				cancelRequested: true,
				finishedAt: new Date(now),
				updatedAt: new Date(now)
			})
			.where(eq(job.id, jobId));
		return null;
	}

	await database
		.update(job)
		.set({
			cancelRequested: true,
			updatedAt: new Date(now)
		})
		.where(eq(job.id, jobId));

	return null;
}

export async function isJobCancelRequested(database: Database, jobId: string): Promise<boolean> {
	const row = await getJobById(database, jobId);
	return row?.cancelRequested === true;
}

/** Requeue running jobs whose worker lease expired (crash recovery). */
export async function reapExpiredJobs(database: Database): Promise<number> {
	const now = nowMs();

	const expired = await database
		.select({ id: job.id, attempts: job.attempts, maxAttempts: job.maxAttempts })
		.from(job)
		.where(and(eq(job.status, 'running'), lt(job.leaseUntil, new Date(now))));

	if (expired.length === 0) {
		return 0;
	}

	for (const row of expired) {
		if (row.attempts >= row.maxAttempts) {
			await database
				.update(job)
				.set({
					status: 'failed',
					error: 'Worker lease expired',
					finishedAt: new Date(now),
					updatedAt: new Date(now),
					lockedBy: null,
					leaseUntil: null
				})
				.where(eq(job.id, row.id));
			continue;
		}

		await database
			.update(job)
			.set({
				status: 'queued',
				error: 'Worker lease expired',
				runAfter: new Date(now),
				updatedAt: new Date(now),
				lockedBy: null,
				leaseUntil: null
			})
			.where(eq(job.id, row.id));
	}

	return expired.length;
}

export function parseEnqueueBody(body: unknown): ServerResult & { data?: EnqueueJobInput } {
	if (typeof body !== 'object' || body === null) {
		return { ok: false, status: 400, message: 'Invalid JSON body' };
	}

	const record = body as Record<string, unknown>;
	if (typeof record.type !== 'string' || !isJobType(record.type)) {
		return { ok: false, status: 400, message: 'Invalid job type' };
	}

	if (!('payload' in record)) {
		return { ok: false, status: 400, message: 'Missing job payload' };
	}

	return {
		ok: true,
		data: {
			type: record.type,
			projectId: '',
			payload: record.payload
		}
	};
}

export async function enqueueOwnedJob(
	database: Database,
	userId: string,
	projectId: string,
	type: JobType,
	payload: unknown
): Promise<ServerResult & { jobId?: string }> {
	const ownerError = await assertProjectOwned(database, userId, projectId);
	if (ownerError) {
		return ownerError;
	}

	const { id } = await enqueueJob(database, { type, projectId, payload });
	return { ok: true, jobId: id };
}
