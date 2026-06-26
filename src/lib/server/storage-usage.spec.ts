import { describe, expect, it } from 'vitest';
import { media, project } from '$lib/server/db/domain.schema';
import { resolveStorageUsage, STORAGE_QUOTA_BYTES } from './storage-usage';
import { seedUser } from '$lib/test/seed-user';
import { createTestDb } from '$lib/test/test-db';

const authUser = {
	id: 'user-a',
	email: 'alex@cutline.test'
};

const otherUser = {
	id: 'user-b',
	email: 'other@cutline.test'
};

describe('resolveStorageUsage', () => {
	it('sums media bytes for the current user across projects', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			await db.insert(project).values([
				{
					id: 'proj-1',
					userId: authUser.id,
					title: 'Project 1',
					kind: 'DEMO',
					durationSeconds: 60,
					thumb: 'thumb-1'
				},
				{
					id: 'proj-2',
					userId: authUser.id,
					title: 'Project 2',
					kind: 'DEMO',
					durationSeconds: 60,
					thumb: 'thumb-2'
				}
			]);

			const usedBytes = 2 * 1024 ** 3;
			await db.insert(media).values([
				{
					id: 'media-1',
					projectId: 'proj-1',
					name: 'Clip 1',
					durationSeconds: 30,
					kind: 'video',
					thumb: 'thumb',
					sizeBytes: usedBytes / 2
				},
				{
					id: 'media-2',
					projectId: 'proj-2',
					name: 'Clip 2',
					durationSeconds: 30,
					kind: 'video',
					thumb: 'thumb',
					sizeBytes: usedBytes / 2
				}
			]);

			const usage = await resolveStorageUsage(db, authUser.id);

			expect(usage.usageLabel).toBe('2 GB of 60 GB used');
			expect(usage.percentUsed).toBe(Math.round((usedBytes / STORAGE_QUOTA_BYTES) * 100));
		} finally {
			client.close();
		}
	});

	it('excludes other users media from the total', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);

			await db.insert(project).values([
				{
					id: 'proj-a',
					userId: authUser.id,
					title: 'Project A',
					kind: 'DEMO',
					durationSeconds: 60,
					thumb: 'thumb-a'
				},
				{
					id: 'proj-b',
					userId: otherUser.id,
					title: 'Project B',
					kind: 'DEMO',
					durationSeconds: 60,
					thumb: 'thumb-b'
				}
			]);

			await db.insert(media).values([
				{
					id: 'media-a',
					projectId: 'proj-a',
					name: 'Clip A',
					durationSeconds: 30,
					kind: 'video',
					thumb: 'thumb',
					sizeBytes: 1024
				},
				{
					id: 'media-b',
					projectId: 'proj-b',
					name: 'Clip B',
					durationSeconds: 30,
					kind: 'video',
					thumb: 'thumb',
					sizeBytes: 10 * 1024 ** 3
				}
			]);

			const usage = await resolveStorageUsage(db, authUser.id);

			expect(usage.usageLabel).toBe('1 KB of 60 GB used');
			expect(usage.percentUsed).toBe(0);
		} finally {
			client.close();
		}
	});

	it('returns zero usage when the user has no media', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			const usage = await resolveStorageUsage(db, authUser.id);

			expect(usage).toEqual({
				percentUsed: 0,
				usageLabel: '0 B of 60 GB used'
			});
		} finally {
			client.close();
		}
	});

	it('clamps percentUsed to 100 when usage exceeds the quota', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			await db.insert(project).values({
				id: 'proj-over',
				userId: authUser.id,
				title: 'Over quota',
				kind: 'DEMO',
				durationSeconds: 60,
				thumb: 'thumb'
			});

			await db.insert(media).values({
				id: 'media-over',
				projectId: 'proj-over',
				name: 'Huge clip',
				durationSeconds: 30,
				kind: 'video',
				thumb: 'thumb',
				sizeBytes: STORAGE_QUOTA_BYTES + 1024 ** 3
			});

			const usage = await resolveStorageUsage(db, authUser.id);

			expect(usage.percentUsed).toBe(100);
			expect(usage.usageLabel).toMatch(/^61 GB of 60 GB used$/);
		} finally {
			client.close();
		}
	});
});
