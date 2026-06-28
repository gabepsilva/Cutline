import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { eq } from 'drizzle-orm';
import { createTestDb } from '$lib/test/test-db';
import { job, media, project, transcript } from '$lib/server/db/domain.schema';
import { user as authUserTable } from '$lib/server/db/auth.schema';
import type { JobRow } from '$lib/server/jobs/job-store';
import type { JobHandlerContext } from '$lib/server/jobs/worker';

const mockPipeline = vi.hoisted(() => ({
	runLocalIngestPipeline: vi.fn(),
	readOutputFiles: vi.fn(),
	cleanupIngestOutputs: vi.fn(),
	cleanupTempPath: vi.fn()
}));

vi.mock('$lib/server/media/ffmpeg-ingest', () => ({
	runLocalIngestPipeline: mockPipeline.runLocalIngestPipeline,
	readOutputFiles: mockPipeline.readOutputFiles,
	cleanupIngestOutputs: mockPipeline.cleanupIngestOutputs,
	cleanupTempPath: mockPipeline.cleanupTempPath,
	writeTempSourceFile: vi.fn().mockResolvedValue('/tmp/source.mp4')
}));

vi.mock('$lib/server/storage/r2', () => ({
	getObjectBytes: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
	putObjectBytes: vi.fn().mockResolvedValue(undefined),
	putObjectJson: vi.fn().mockResolvedValue(undefined)
}));

import { runIngestJob } from './ingest';

function capture() {
	const lines: Record<string, unknown>[] = [];
	const log = pino({ level: 'info' }, { write: (s: string) => lines.push(JSON.parse(s)) });
	return { log, lines };
}

function ingestContext(job: JobRow, log: pino.Logger): JobHandlerContext {
	return {
		job,
		log,
		reportProgress: vi.fn().mockResolvedValue(undefined),
		isCancelRequested: vi.fn().mockResolvedValue(false),
		complete: vi.fn().mockResolvedValue(undefined)
	};
}

describe('runIngestJob transcription enqueue', () => {
	it('enqueues transcription for audio-bearing A-roll after probe', async () => {
		const { db } = await createTestDb();
		const { log } = capture();

		await db.insert(authUserTable).values({
			id: 'user-a',
			name: 'Alex',
			email: 'alex@cutline.test',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await db.insert(project).values({
			id: 'proj-1',
			userId: 'user-a',
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
			durationSeconds: 0,
			kind: 'A-roll',
			thumb: 'thumb',
			sizeBytes: 100,
			objectKey: 'users/user-a/projects/proj-1/media/media-1/source.mp4',
			contentType: 'video/mp4',
			status: 'uploaded'
		});

		mockPipeline.runLocalIngestPipeline.mockResolvedValue({
			transcodePath: '/tmp/transcode.mp4',
			filmstripPath: '/tmp/filmstrip.jpg',
			filmstripMeta: { frameCount: 1, intervalSec: 1, frameW: 64, frameH: 48, cols: 1, rows: 1 },
			waveform: { version: 1, peaksPerSecond: 50, length: 10, data: [0.1] },
			probe: { durationSeconds: 2, width: 320, height: 240, hasAudio: true }
		});
		mockPipeline.readOutputFiles.mockResolvedValue({
			transcode: new Uint8Array([1]),
			filmstrip: new Uint8Array([2])
		});

		const jobRow = {
			id: 'job-1',
			type: 'ingest',
			projectId: 'proj-1',
			status: 'running',
			progress: 0,
			payload: JSON.stringify({
				mediaId: 'media-1',
				actorId: 'user-a',
				causationId: 'req-xyz'
			}),
			result: null,
			error: null,
			attempts: 1,
			maxAttempts: 3,
			priority: 0,
			cancelRequested: false,
			lockedBy: 'worker-1',
			leaseUntil: new Date(Date.now() + 60_000),
			runAfter: new Date(),
			createdAt: new Date(),
			startedAt: new Date(),
			finishedAt: null,
			updatedAt: new Date()
		} satisfies JobRow;

		await runIngestJob(db, ingestContext(jobRow, log));

		const jobs = await db.select().from(job).where(eq(job.projectId, 'proj-1'));
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.type).toBe('transcription');
		expect(JSON.parse(jobs[0]!.payload)).toMatchObject({
			projectId: 'proj-1',
			actorId: 'user-a',
			causationId: 'req-xyz'
		});

		const [updated] = await db.select().from(media).where(eq(media.id, 'media-1'));
		expect(updated?.hasAudio).toBe(true);
	});

	it('does not enqueue transcription for silent A-roll', async () => {
		const { db } = await createTestDb();
		const { log } = capture();

		await db.insert(authUserTable).values({
			id: 'user-a',
			name: 'Alex',
			email: 'alex@cutline.test',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await db.insert(project).values({
			id: 'proj-1',
			userId: 'user-a',
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
			durationSeconds: 0,
			kind: 'A-roll',
			thumb: 'thumb',
			sizeBytes: 100,
			objectKey: 'users/user-a/projects/proj-1/media/media-1/source.mp4',
			contentType: 'video/mp4',
			status: 'uploaded'
		});

		mockPipeline.runLocalIngestPipeline.mockResolvedValue({
			transcodePath: '/tmp/transcode.mp4',
			filmstripPath: '/tmp/filmstrip.jpg',
			filmstripMeta: { frameCount: 1, intervalSec: 1, frameW: 64, frameH: 48, cols: 1, rows: 1 },
			waveform: { version: 1, peaksPerSecond: 50, length: 0, data: [] },
			probe: { durationSeconds: 2, width: 320, height: 240, hasAudio: false }
		});
		mockPipeline.readOutputFiles.mockResolvedValue({
			transcode: new Uint8Array([1]),
			filmstrip: new Uint8Array([2])
		});

		const jobRow = {
			id: 'job-1',
			type: 'ingest',
			projectId: 'proj-1',
			status: 'running',
			progress: 0,
			payload: JSON.stringify({ mediaId: 'media-1' }),
			result: null,
			error: null,
			attempts: 1,
			maxAttempts: 3,
			priority: 0,
			cancelRequested: false,
			lockedBy: 'worker-1',
			leaseUntil: new Date(Date.now() + 60_000),
			runAfter: new Date(),
			createdAt: new Date(),
			startedAt: new Date(),
			finishedAt: null,
			updatedAt: new Date()
		} satisfies JobRow;

		await runIngestJob(db, ingestContext(jobRow, log));

		const jobs = await db.select().from(job).where(eq(job.projectId, 'proj-1'));
		expect(jobs).toHaveLength(0);

		const [updated] = await db.select().from(media).where(eq(media.id, 'media-1'));
		expect(updated?.hasAudio).toBe(false);
	});
});
