import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { job, media, project, transcript } from '$lib/server/db/domain.schema';
import { user as authUserTable } from '$lib/server/db/auth.schema';
import {
	enqueueManualTranscription,
	enqueueTranscriptionAfterIngest
} from '$lib/server/transcription/enqueue-transcription';
import { createTestDb } from '$lib/test/test-db';

const authUser = {
	id: 'user-a',
	name: 'Alex',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date()
};

async function seedProject(
	db: Awaited<ReturnType<typeof createTestDb>>['db'],
	options: {
		mediaStatus?: 'uploaded' | 'ingesting' | 'ready';
		hasAudio?: boolean;
	}
) {
	await db.insert(authUserTable).values(authUser);
	await db.insert(project).values({
		id: 'proj-1',
		userId: authUser.id,
		title: 'Demo',
		kind: 'TALKING HEAD',
		description: null,
		durationSeconds: 0,
		thumb: 'thumb'
	});
	await db.insert(transcript).values({ projectId: 'proj-1', words: '[]' });
	await db.insert(media).values({
		id: 'media-1',
		projectId: 'proj-1',
		name: 'clip.mp4',
		durationSeconds: 120,
		kind: 'B-roll',
		thumb: 'thumb',
		sizeBytes: 100,
		objectKey: 'users/user-a/projects/proj-1/media/media-1/source.mp4',
		contentType: 'video/mp4',
		status: options.mediaStatus ?? 'ready',
		hasAudio: options.hasAudio ?? true,
		transcodeKey: 'users/user-a/projects/proj-1/media/media-1/transcode.mp4',
		createdAt: new Date('2026-06-01T00:00:00.000Z')
	});
}

describe('enqueueManualTranscription', () => {
	it('enqueues transcription for ready primary media with audio', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: true });

		const result = await enqueueManualTranscription(db, authUser.id, 'proj-1', 'req-1');
		expect(result).toMatchObject({ ok: true, jobId: expect.any(String) });

		const jobs = await db.select().from(job).where(eq(job.projectId, 'proj-1'));
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.type).toBe('transcription');
		expect(JSON.parse(jobs[0]!.payload)).toMatchObject({
			projectId: 'proj-1',
			actorId: authUser.id,
			causationId: 'req-1'
		});
	});

	it('rejects when source media has no audio', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: false });

		const result = await enqueueManualTranscription(db, authUser.id, 'proj-1');
		expect(result).toMatchObject({ ok: false, status: 400 });
	});

	it('rejects when source media is not ready', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ingesting', hasAudio: true });

		const result = await enqueueManualTranscription(db, authUser.id, 'proj-1');
		expect(result).toMatchObject({ ok: false, status: 400 });
	});

	it('rejects when a transcription job is already active', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: true });
		await db.insert(job).values({
			id: 'job-active',
			type: 'transcription',
			projectId: 'proj-1',
			status: 'running',
			progress: 0.2,
			payload: JSON.stringify({ projectId: 'proj-1' }),
			priority: 0,
			maxAttempts: 3,
			runAfter: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		});

		const result = await enqueueManualTranscription(db, authUser.id, 'proj-1');
		expect(result).toMatchObject({ ok: false, status: 400 });
	});
});

describe('enqueueTranscriptionAfterIngest', () => {
	it('enqueues transcription when ingested media is primary and has audio', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: true });

		const jobId = await enqueueTranscriptionAfterIngest(db, 'proj-1', 'media-1', {
			actorId: authUser.id,
			causationId: 'ingest-1'
		});
		expect(jobId).toEqual(expect.any(String));

		const jobs = await db.select().from(job).where(eq(job.projectId, 'proj-1'));
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.type).toBe('transcription');
	});

	it('skips when ingested media is not primary', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: true });
		await db.insert(media).values({
			id: 'media-2',
			projectId: 'proj-1',
			name: 'broll.mp4',
			durationSeconds: 60,
			kind: 'B-roll',
			thumb: 'thumb',
			sizeBytes: 50,
			objectKey: 'users/user-a/projects/proj-1/media/media-2/source.mp4',
			contentType: 'video/mp4',
			status: 'ready',
			hasAudio: true,
			transcodeKey: 'users/user-a/projects/proj-1/media/media-2/transcode.mp4',
			createdAt: new Date('2026-05-01T00:00:00.000Z')
		});

		const jobId = await enqueueTranscriptionAfterIngest(db, 'proj-1', 'media-1');
		expect(jobId).toBeNull();

		const jobs = await db.select().from(job).where(eq(job.projectId, 'proj-1'));
		expect(jobs).toHaveLength(0);
	});

	it('skips when source media has no audio', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: false });

		const jobId = await enqueueTranscriptionAfterIngest(db, 'proj-1', 'media-1');
		expect(jobId).toBeNull();
	});

	it('skips when a transcription job is already active', async () => {
		const { db } = await createTestDb();
		await seedProject(db, { mediaStatus: 'ready', hasAudio: true });
		await db.insert(job).values({
			id: 'job-active',
			type: 'transcription',
			projectId: 'proj-1',
			status: 'running',
			progress: 0.2,
			payload: JSON.stringify({ projectId: 'proj-1' }),
			priority: 0,
			maxAttempts: 3,
			runAfter: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		});

		const jobId = await enqueueTranscriptionAfterIngest(db, 'proj-1', 'media-1');
		expect(jobId).toBeNull();
	});
});
