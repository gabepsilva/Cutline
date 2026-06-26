import { and, eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { job, project, transcript } from '$lib/server/db/domain.schema';
import * as jobStore from '$lib/server/jobs/job-store';
import {
	claimJob,
	enqueueJob,
	failJob,
	getJobById,
	getOwnedJobStatus,
	reapExpiredJobs,
	requestJobCancel
} from '$lib/server/jobs/job-store';
import {
	clearJobHandlers,
	JobCanceledError,
	registerEchoHandler,
	registerJobHandler,
	runWorkerBatch,
	runWorkerOnce
} from '$lib/server/jobs/worker';
import { seedUser } from '$lib/test/seed-user';
import { createTestDb } from '$lib/test/test-db';

const authUser = { id: 'user-a', email: 'alex@cutline.test' };
const otherUser = { id: 'user-b', email: 'other@cutline.test' };

async function seedProject(db: Awaited<ReturnType<typeof createTestDb>>['db'], projectId: string) {
	await db.insert(project).values({
		id: projectId,
		userId: authUser.id,
		title: 'Demo',
		kind: 'DEMO',
		durationSeconds: 60,
		thumb: 'thumb'
	});
	await db.insert(transcript).values({
		projectId,
		words: '[]'
	});
}

describe('job-store', () => {
	afterEach(() => {
		clearJobHandlers();
	});

	it('enqueue creates a queued job scoped to a project', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');

			const { id } = await enqueueJob(db, {
				type: 'ingest',
				projectId: 'proj-1',
				payload: { mediaId: 'media-1' }
			});

			const [row] = await db.select().from(job).where(eq(job.id, id));
			expect(row?.status).toBe('queued');
			expect(row?.projectId).toBe('proj-1');
			expect(JSON.parse(row?.payload ?? '{}')).toEqual({ mediaId: 'media-1' });
		} finally {
			client.close();
		}
	});

	it('claim is atomic — only one worker gets the job', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });

			const first = await claimJob(db, 'worker-a');
			const second = await claimJob(db, 'worker-b');

			expect(first?.status).toBe('running');
			expect(first?.lockedBy).toBe('worker-a');
			expect(second).toBeNull();
		} finally {
			client.close();
		}
	});

	it('echo handler completes a job with result', async () => {
		const { db, client } = await createTestDb();
		try {
			registerEchoHandler('ingest');
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: { ok: true } });

			await runWorkerOnce(db, 'worker-a');

			const [row] = await db.select().from(job);
			expect(row?.status).toBe('succeeded');
			expect(row?.progress).toBe(1);
			expect(JSON.parse(row?.result ?? '{}')).toEqual({ echo: { ok: true } });
		} finally {
			client.close();
		}
	});

	it('retries with backoff then dead-letters after max attempts', async () => {
		const { db, client } = await createTestDb();
		try {
			registerJobHandler('ingest', async () => {
				throw new Error('boom');
			});

			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			const { id } = await enqueueJob(db, {
				type: 'ingest',
				projectId: 'proj-1',
				payload: {},
				maxAttempts: 2
			});

			await runWorkerOnce(db, 'worker-a');
			let [row] = await db.select().from(job).where(eq(job.id, id));
			expect(row?.status).toBe('queued');
			expect(row?.attempts).toBe(1);

			await db
				.update(job)
				.set({ runAfter: new Date(0) })
				.where(eq(job.id, id));

			await runWorkerOnce(db, 'worker-a');
			[row] = await db.select().from(job).where(eq(job.id, id));
			expect(row?.status).toBe('failed');
			expect(row?.attempts).toBe(2);
		} finally {
			client.close();
		}
	});

	it('cancel queued jobs immediately and running jobs cooperatively', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);
			await seedProject(db, 'proj-1');

			const queued = await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });
			expect(await requestJobCancel(db, authUser.id, queued.id)).toBeNull();

			let [row] = await db.select().from(job).where(eq(job.id, queued.id));
			expect(row?.status).toBe('canceled');

			registerJobHandler('ingest', async (ctx) => {
				await ctx.reportProgress(0.2);
				while (!(await ctx.isCancelRequested())) {
					await new Promise((resolve) => setTimeout(resolve, 10));
				}
				throw new JobCanceledError();
			});

			const running = await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });
			const claimPromise = runWorkerOnce(db, 'worker-a');
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(await requestJobCancel(db, authUser.id, running.id)).toBeNull();
			await claimPromise;

			[row] = await db.select().from(job).where(eq(job.id, running.id));
			expect(row?.status).toBe('canceled');
		} finally {
			client.close();
		}
	});

	it('reaps expired running leases back to queued', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });
			await claimJob(db, 'worker-a');

			await db
				.update(job)
				.set({ leaseUntil: new Date(Date.now() - 1_000) })
				.where(eq(job.status, 'running'));

			expect(await reapExpiredJobs(db)).toBe(1);

			const [row] = await db.select().from(job);
			expect(row?.status).toBe('queued');
			expect(row?.lockedBy).toBeNull();
		} finally {
			client.close();
		}
	});

	it('getOwnedJobStatus returns 404 for non-owners', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);
			await seedProject(db, 'proj-1');
			const { id } = await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });

			const ownerStatus = await getOwnedJobStatus(db, authUser.id, id);
			expect(ownerStatus.ok).toBe(true);

			const otherStatus = await getOwnedJobStatus(db, otherUser.id, id);
			expect(otherStatus).toEqual({
				ok: false,
				status: 404,
				message: 'Project not found'
			});
		} finally {
			client.close();
		}
	});

	it('runWorkerBatch drains multiple queued jobs', async () => {
		const { db, client } = await createTestDb();
		try {
			registerEchoHandler('ingest');
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: { n: 1 } });
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: { n: 2 } });

			const processed = await runWorkerBatch(db, 'worker-a');
			expect(processed).toBe(2);

			const rows = await db.select().from(job);
			expect(rows.every((row) => row.status === 'succeeded')).toBe(true);
		} finally {
			client.close();
		}
	});

	it('runWorkerBatch reaps expired leases once per batch', async () => {
		const { db, client } = await createTestDb();
		const reapSpy = vi.spyOn(jobStore, 'reapExpiredJobs').mockResolvedValue(0);
		try {
			registerEchoHandler('ingest');
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: { n: 1 } });
			await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: { n: 2 } });

			await runWorkerBatch(db, 'worker-a', 2);

			expect(reapSpy).toHaveBeenCalledTimes(1);
		} finally {
			reapSpy.mockRestore();
			client.close();
		}
	});

	it('failJob does not clobber a job reaped while the worker was failing', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			const { id } = await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });
			await claimJob(db, 'worker-a');

			await db
				.update(job)
				.set({ status: 'queued', lockedBy: null, leaseUntil: null })
				.where(eq(job.id, id));

			expect(await failJob(db, id, 'worker-a', 'boom')).toBe('missing');

			const [row] = await db.select().from(job).where(eq(job.id, id));
			expect(row?.status).toBe('queued');
			expect(row?.lockedBy).toBeNull();
		} finally {
			client.close();
		}
	});

	it('requestJobCancel falls through to cooperative cancel when a queued job was claimed', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, 'proj-1');
			const { id } = await enqueueJob(db, { type: 'ingest', projectId: 'proj-1', payload: {} });
			const claimed = await claimJob(db, 'worker-a');
			expect(claimed?.status).toBe('running');

			const staleRow = await getJobById(db, id);
			expect(staleRow).not.toBeNull();
			if (!staleRow) return;

			const now = Date.now();
			const raced = await db
				.update(job)
				.set({
					status: 'canceled',
					cancelRequested: true,
					finishedAt: new Date(now),
					updatedAt: new Date(now)
				})
				.where(and(eq(job.id, id), eq(job.status, 'queued')));
			expect(raced.rowsAffected).toBe(0);

			expect(await requestJobCancel(db, authUser.id, id)).toBeNull();

			const [row] = await db.select().from(job).where(eq(job.id, id));
			expect(row?.status).toBe('running');
			expect(row?.cancelRequested).toBe(true);
			expect(row?.lockedBy).toBe('worker-a');
		} finally {
			client.close();
		}
	});
});
