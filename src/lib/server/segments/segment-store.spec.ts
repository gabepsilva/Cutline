import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { media, project, segment, transcript } from '$lib/server/db/domain.schema';
import { user } from '$lib/server/db/auth.schema';
import {
	findHeadSegmentRow,
	insertVideoSegmentForMedia,
	listProjectSegments,
	mapSegmentRow,
	syncSegmentDurationForMedia,
	totalSegmentDuration
} from '$lib/server/segments/segment-store';
import { findPrimaryMediaRow } from '$lib/server/storage/media-assets';
import { createTestDb } from '$lib/test/test-db';

async function seedProject(db: Awaited<ReturnType<typeof createTestDb>>['db'], projectId: string) {
	await db.insert(user).values({
		id: 'user-a',
		name: 'Alex',
		email: 'alex@cutline.test',
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await db.insert(project).values({
		id: projectId,
		userId: 'user-a',
		title: 'Demo',
		kind: 'TALKING HEAD',
		durationSeconds: 0,
		thumb: 'thumb',
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await db.insert(transcript).values({ projectId, words: '[]' });
}

describe('segment-store', () => {
	it('maps rows and sums segment durations', () => {
		const mapped = mapSegmentRow({
			id: 'seg-1',
			projectId: 'proj-1',
			segmentOrder: 0,
			type: 'video',
			mediaId: 'media-1',
			durationSeconds: 30,
			trimIn: null,
			trimOut: null,
			createdAt: new Date()
		});
		expect(mapped.order).toBe(0);
		expect(
			totalSegmentDuration([mapped, { ...mapped, id: 'seg-2', order: 1, durationSeconds: 12 }])
		).toBe(42);
	});

	it('inserts a head video segment and resolves primary media via sequence', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedProject(db, 'proj-seg');
			await db.insert(media).values({
				id: 'media-primary',
				projectId: 'proj-seg',
				name: 'clip.mp4',
				durationSeconds: 45,
				kind: 'A-roll',
				thumb: 'thumb',
				sizeBytes: 100,
				objectKey: 'uploads/clip.mp4',
				status: 'ready',
				createdAt: new Date('2026-06-01T00:00:00.000Z')
			});
			await db.insert(media).values({
				id: 'media-broll',
				projectId: 'proj-seg',
				name: 'broll.mp4',
				durationSeconds: 10,
				kind: 'B-roll',
				thumb: 'thumb',
				sizeBytes: 50,
				objectKey: 'uploads/broll.mp4',
				status: 'ready',
				createdAt: new Date('2026-06-02T00:00:00.000Z')
			});

			await insertVideoSegmentForMedia(db, 'proj-seg', 'media-primary', 45);

			const head = await findHeadSegmentRow(db, 'proj-seg');
			expect(head?.mediaId).toBe('media-primary');

			const primary = await findPrimaryMediaRow(db, 'proj-seg');
			expect(primary?.id).toBe('media-primary');

			const segments = await listProjectSegments(db, 'proj-seg');
			expect(segments).toHaveLength(1);
			expect(segments[0]?.durationSeconds).toBe(45);
		} finally {
			client.close();
		}
	});

	it('syncs segment duration after ingest probe', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedProject(db, 'proj-sync');
			await db.insert(media).values({
				id: 'media-sync',
				projectId: 'proj-sync',
				name: 'clip.mp4',
				durationSeconds: 0,
				kind: 'A-roll',
				thumb: 'thumb',
				sizeBytes: 100,
				objectKey: 'uploads/clip.mp4',
				status: 'ingesting'
			});
			await insertVideoSegmentForMedia(db, 'proj-sync', 'media-sync', 0);

			await syncSegmentDurationForMedia(db, 'media-sync', 88);

			const [row] = await db.select().from(segment).where(eq(segment.mediaId, 'media-sync'));
			expect(row?.durationSeconds).toBe(88);
		} finally {
			client.close();
		}
	});
});
