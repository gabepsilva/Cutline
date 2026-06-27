import { describe, expect, it } from 'vitest';
import { media, project } from '$lib/server/db/domain.schema';
import { loadDashboardProjects } from '$lib/server/dashboard-load';
import { seedUser } from '$lib/test/seed-user';
import { createTestDb } from '$lib/test/test-db';

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

const otherUser = {
	...authUser,
	id: 'user-b',
	email: 'other@cutline.test'
};

describe('loadDashboardProjects', () => {
	it('returns the newest project as hero and the remainder in the grid', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			await db.insert(project).values([
				{
					id: 'proj-old',
					userId: authUser.id,
					title: 'Older project',
					kind: 'DEMO',
					durationSeconds: 120,
					thumb: 'thumb-old',
					updatedAt: new Date('2026-06-20T00:00:00.000Z')
				},
				{
					id: 'proj-new',
					userId: authUser.id,
					title: 'Newest project',
					kind: 'VLOG',
					description: 'Latest edit',
					durationSeconds: 300,
					thumb: 'thumb-new',
					updatedAt: new Date('2026-06-26T10:00:00.000Z')
				},
				{
					id: 'proj-mid',
					userId: authUser.id,
					title: 'Middle project',
					kind: 'WEBINAR',
					durationSeconds: 180,
					thumb: 'thumb-mid',
					updatedAt: new Date('2026-06-24T00:00:00.000Z')
				}
			]);

			await db.insert(media).values([
				{
					id: 'media-old',
					projectId: 'proj-old',
					name: 'old.mp4',
					durationSeconds: 120,
					kind: 'A-roll',
					thumb: 'thumb-old',
					sizeBytes: 1024,
					status: 'ready',
					createdAt: new Date()
				},
				{
					id: 'media-new',
					projectId: 'proj-new',
					name: 'new.mp4',
					durationSeconds: 300,
					kind: 'A-roll',
					thumb: 'thumb-new',
					sizeBytes: 1024,
					status: 'ready',
					createdAt: new Date()
				},
				{
					id: 'media-mid',
					projectId: 'proj-mid',
					name: 'mid.mp4',
					durationSeconds: 180,
					kind: 'A-roll',
					thumb: 'thumb-mid',
					sizeBytes: 1024,
					status: 'ready',
					createdAt: new Date()
				}
			]);

			const result = await loadDashboardProjects(db, authUser.id);

			expect(result.latestProject).toMatchObject({
				id: 'proj-new',
				title: 'Newest project',
				durationLabel: '5:00',
				description: 'Latest edit'
			});
			expect(result.latestProject?.meta).toMatch(/^Edited /);
			expect(result.projects).toHaveLength(2);
			expect(result.projects.map((item) => item.id)).toEqual(['proj-mid', 'proj-old']);
		} finally {
			client.close();
		}
	});

	it('scopes projects to the requesting user', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);

			await db.insert(project).values([
				{
					id: 'proj-a',
					userId: authUser.id,
					title: 'User A project',
					kind: 'DEMO',
					durationSeconds: 60,
					thumb: 'thumb-a'
				},
				{
					id: 'proj-b',
					userId: otherUser.id,
					title: 'User B project',
					kind: 'DEMO',
					durationSeconds: 60,
					thumb: 'thumb-b'
				}
			]);

			await db.insert(media).values({
				id: 'media-a',
				projectId: 'proj-a',
				name: 'a.mp4',
				durationSeconds: 60,
				kind: 'A-roll',
				thumb: 'thumb-a',
				sizeBytes: 1024,
				status: 'ready',
				createdAt: new Date()
			});

			const result = await loadDashboardProjects(db, authUser.id);

			expect(result.latestProject?.id).toBe('proj-a');
			expect(result.projects).toHaveLength(0);
		} finally {
			client.close();
		}
	});

	it('returns empty lists when the user has no projects', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			const result = await loadDashboardProjects(db, authUser.id);

			expect(result.latestProject).toBeNull();
			expect(result.projects).toEqual([]);
		} finally {
			client.close();
		}
	});

	it('marks draft projects and keeps them in the grid instead of the hero', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			await db.insert(project).values([
				{
					id: 'proj-draft',
					userId: authUser.id,
					title: 'Untitled draft',
					kind: 'DEMO',
					durationSeconds: 0,
					thumb: 'thumb-draft',
					updatedAt: new Date('2026-06-27T00:00:00.000Z')
				},
				{
					id: 'proj-ready',
					userId: authUser.id,
					title: 'Ready project',
					kind: 'VLOG',
					durationSeconds: 90,
					thumb: 'thumb-ready',
					updatedAt: new Date('2026-06-26T00:00:00.000Z')
				}
			]);

			await db.insert(media).values({
				id: 'media-ready',
				projectId: 'proj-ready',
				name: 'clip.mp4',
				durationSeconds: 90,
				kind: 'A-roll',
				thumb: 'thumb-ready',
				sizeBytes: 1024,
				status: 'ready',
				createdAt: new Date()
			});

			const result = await loadDashboardProjects(db, authUser.id);

			expect(result.latestProject).toMatchObject({
				id: 'proj-ready',
				isDraft: false
			});
			expect(result.projects).toHaveLength(1);
			expect(result.projects[0]).toMatchObject({
				id: 'proj-draft',
				isDraft: true,
				meta: 'Waiting for footage'
			});
		} finally {
			client.close();
		}
	});

	it('omits the hero when the user only has draft projects', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			await db.insert(project).values({
				id: 'proj-draft-only',
				userId: authUser.id,
				title: 'Draft only',
				kind: 'DEMO',
				durationSeconds: 0,
				thumb: 'thumb-draft',
				updatedAt: new Date('2026-06-27T00:00:00.000Z')
			});

			const result = await loadDashboardProjects(db, authUser.id);

			expect(result.latestProject).toBeNull();
			expect(result.projects).toHaveLength(1);
			expect(result.projects[0]?.isDraft).toBe(true);
		} finally {
			client.close();
		}
	});
});
