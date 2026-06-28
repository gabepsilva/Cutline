import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb } from '$lib/test/test-db';
import { job, media, project, transcript } from '$lib/server/db/domain.schema';
import { user as authUserTable } from '$lib/server/db/auth.schema';
import { completeMediaUpload } from '$lib/server/storage/media-upload';

describe('completeMediaUpload causation threading', () => {
	it('stamps actorId and causationId on ingest job payload', async () => {
		const { db } = await createTestDb();

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
			status: 'uploading'
		});

		const result = await completeMediaUpload(db, 'user-a', 'proj-1', 'media-1', {}, 'req-xyz');
		expect(result).toMatchObject({ ok: true });

		const jobs = await db.select().from(job).where(eq(job.projectId, 'proj-1'));
		expect(jobs).toHaveLength(1);

		const ingestJob = jobs.find((row) => row.type === 'ingest');
		expect(ingestJob).toBeDefined();

		for (const row of jobs) {
			const payload = JSON.parse(row.payload) as { actorId?: string; causationId?: string };
			expect(payload).toMatchObject({ actorId: 'user-a', causationId: 'req-xyz' });
		}
	});
});
