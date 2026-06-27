import { describe, expect, it, vi, beforeEach } from 'vitest';
import { media, project, transcript } from '$lib/server/db/domain.schema';
import { user } from '$lib/server/db/auth.schema';
import { sweepAbandonedUploads } from '$lib/server/storage/orphan-sweep';
import { createTestDb } from '$lib/test/test-db';

vi.mock('$lib/server/storage/r2', () => ({
	deleteObject: vi.fn().mockResolvedValue(undefined)
}));

describe('orphan-sweep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('removes stale pending rows but keeps ready media', async () => {
		const { db } = await createTestDb();
		await db.insert(user).values({
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

		const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
		await db.insert(media).values([
			{
				id: 'stale-1',
				projectId: 'proj-1',
				name: 'abandoned.mp4',
				durationSeconds: 0,
				kind: 'B-roll',
				thumb: 'thumb',
				objectKey: 'users/user-a/projects/proj-1/media/stale-1/source.mp4',
				status: 'pending',
				createdAt: staleDate
			},
			{
				id: 'ready-1',
				projectId: 'proj-1',
				name: 'ready.mp4',
				durationSeconds: 10,
				kind: 'B-roll',
				thumb: 'thumb',
				status: 'ready',
				createdAt: staleDate
			}
		]);

		const removed = await sweepAbandonedUploads(db);
		expect(removed).toBe(1);

		const rows = await db.select({ id: media.id }).from(media);
		expect(rows.map((row) => row.id)).toEqual(['ready-1']);
	});
});
