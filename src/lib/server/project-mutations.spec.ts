import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import { user } from '$lib/server/db/auth.schema';
import {
	createOwnedProject,
	deleteOwnedProject,
	renameOwnedProject
} from '$lib/server/project-mutations';
import { createTestDb } from '$lib/test/test-db';

const authUser = {
	id: 'user-a',
	email: 'alex@cutline.test'
};

const otherUser = {
	id: 'user-b',
	email: 'other@cutline.test'
};

async function seedUser(
	db: Awaited<ReturnType<typeof createTestDb>>['db'],
	seed: { id: string; email: string }
) {
	await db.insert(user).values({
		id: seed.id,
		name: 'Test User',
		email: seed.email,
		emailVerified: true,
		createdAt: new Date('2026-06-01T00:00:00.000Z'),
		updatedAt: new Date('2026-06-01T00:00:00.000Z')
	});
}

async function seedProject(
	db: Awaited<ReturnType<typeof createTestDb>>['db'],
	seed: {
		id: string;
		userId: string;
		title?: string;
		withTranscript?: boolean;
		withMedia?: boolean;
		withOverlay?: boolean;
	}
) {
	await db.insert(project).values({
		id: seed.id,
		userId: seed.userId,
		title: seed.title ?? 'Seed project',
		kind: 'DEMO',
		durationSeconds: 60,
		thumb: 'thumb'
	});

	if (seed.withTranscript ?? true) {
		await db.insert(transcript).values({
			projectId: seed.id,
			words: '[]'
		});
	}

	if (seed.withMedia) {
		await db.insert(media).values({
			id: 'media-1',
			projectId: seed.id,
			name: 'Clip',
			durationSeconds: 30,
			kind: 'video',
			thumb: 'thumb',
			sizeBytes: 1024
		});
	}

	if (seed.withOverlay) {
		await db.insert(overlay).values({
			id: 'overlay-1',
			projectId: seed.id,
			mediaId: 'media-1',
			name: 'B-roll',
			startSeconds: 0,
			durationSeconds: 5,
			thumb: 'thumb'
		});
	}
}

describe('createOwnedProject', () => {
	it('inserts a default project and empty transcript in one transaction', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);

			const result = await createOwnedProject(db, authUser.id);

			expect(result.ok).toBe(true);
			if (!result.ok) throw new Error('expected success');

			const [row] = await db.select().from(project).where(eq(project.id, result.projectId));
			expect(row).toMatchObject({
				userId: authUser.id,
				title: 'Untitled project',
				kind: 'TALKING HEAD',
				durationSeconds: 0
			});
			expect(row?.thumb).toContain('repeating-linear-gradient');

			const [transcriptRow] = await db
				.select()
				.from(transcript)
				.where(eq(transcript.projectId, result.projectId));
			expect(transcriptRow).toMatchObject({
				words: '[]',
				captionStyle: 'karaoke'
			});
		} finally {
			client.close();
		}
	});
});

describe('renameOwnedProject', () => {
	it('updates the title for an owned project', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id, title: 'Before' });

			const result = await renameOwnedProject(db, authUser.id, 'proj-1', '  After  ');
			expect(result).toEqual({ ok: true });

			const [row] = await db.select().from(project).where(eq(project.id, 'proj-1'));
			expect(row?.title).toBe('After');
		} finally {
			client.close();
		}
	});

	it('rejects empty titles', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });

			const result = await renameOwnedProject(db, authUser.id, 'proj-1', '   ');
			expect(result).toEqual({ ok: false, status: 400, message: 'Title is required' });
		} finally {
			client.close();
		}
	});

	it('rejects titles longer than 120 characters', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });

			const result = await renameOwnedProject(db, authUser.id, 'proj-1', 'x'.repeat(121));
			expect(result).toEqual({
				ok: false,
				status: 400,
				message: 'Title must be 120 characters or fewer'
			});
		} finally {
			client.close();
		}
	});

	it('returns 404 for another users project', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });

			const result = await renameOwnedProject(db, otherUser.id, 'proj-1', 'Hijacked');
			expect(result).toEqual({ ok: false, status: 404, message: 'Project not found' });

			const [row] = await db.select().from(project).where(eq(project.id, 'proj-1'));
			expect(row?.title).toBe('Seed project');
		} finally {
			client.close();
		}
	});
});

describe('deleteOwnedProject', () => {
	it('deletes project children in FK-safe order', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, {
				id: 'proj-1',
				userId: authUser.id,
				withMedia: true,
				withOverlay: true
			});
			await seedProject(db, { id: 'proj-2', userId: authUser.id, title: 'Sibling' });

			const result = await deleteOwnedProject(db, authUser.id, 'proj-1');
			expect(result).toEqual({ ok: true });

			expect(await db.select().from(project).where(eq(project.id, 'proj-1'))).toHaveLength(0);
			expect(
				await db.select().from(transcript).where(eq(transcript.projectId, 'proj-1'))
			).toHaveLength(0);
			expect(await db.select().from(media).where(eq(media.projectId, 'proj-1'))).toHaveLength(0);
			expect(await db.select().from(overlay).where(eq(overlay.projectId, 'proj-1'))).toHaveLength(
				0
			);
			expect(await db.select().from(project).where(eq(project.id, 'proj-2'))).toHaveLength(1);
		} finally {
			client.close();
		}
	});

	it('returns 404 when the project is missing or not owned', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });

			const result = await deleteOwnedProject(db, otherUser.id, 'proj-1');
			expect(result).toEqual({ ok: false, status: 404, message: 'Project not found' });

			expect(await db.select().from(project).where(eq(project.id, 'proj-1'))).toHaveLength(1);
		} finally {
			client.close();
		}
	});
});
