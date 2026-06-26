import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { project, transcript } from '$lib/server/db/domain.schema';
import { user } from '$lib/server/db/auth.schema';
import {
	parsePersistEditorTranscriptBody,
	persistEditorTranscript
} from '$lib/server/editor-transcript-persist';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import { createTestDb } from '$lib/test/test-db';

const authUser = { id: 'user-a', email: 'alex@cutline.test' };
const otherUser = { id: 'user-b', email: 'other@cutline.test' };

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
	seed: { id: string; userId: string; withTranscript?: boolean }
) {
	await db.insert(project).values({
		id: seed.id,
		userId: seed.userId,
		title: 'Seed project',
		kind: 'DEMO',
		durationSeconds: 60,
		thumb: 'thumb'
	});

	if (seed.withTranscript ?? true) {
		await db.insert(transcript).values({
			projectId: seed.id,
			words: JSON.stringify(fixtureTranscriptWords),
			captionStyle: 'karaoke'
		});
	}
}

describe('parsePersistEditorTranscriptBody', () => {
	it('accepts a valid words and caption style payload', () => {
		const parsed = parsePersistEditorTranscriptBody({
			words: fixtureTranscriptWords,
			captionStyle: 'clean'
		});

		expect(parsed).toEqual({
			words: fixtureTranscriptWords,
			captionStyle: 'clean'
		});
	});

	it('rejects malformed words arrays', () => {
		const parsed = parsePersistEditorTranscriptBody({
			words: [{ id: 'w0' }],
			captionStyle: 'karaoke'
		});

		expect(parsed).toEqual({
			ok: false,
			status: 400,
			message: 'Invalid words payload'
		});
	});
});

describe('persistEditorTranscript', () => {
	it('replaces words and caption style for an owned project', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });

			const updatedWords = fixtureTranscriptWords.map((word) =>
				word.id === 'w2' ? { ...word, deleted: true } : word
			);

			const result = await persistEditorTranscript(db, authUser.id, 'proj-1', {
				words: updatedWords,
				captionStyle: 'clean'
			});

			expect(result).toEqual({ ok: true });

			const [row] = await db.select().from(transcript).where(eq(transcript.projectId, 'proj-1'));

			expect(JSON.parse(row.words)).toEqual(updatedWords);
			expect(row.captionStyle).toBe('clean');
		} finally {
			client.close();
		}
	});

	it('inserts a transcript row when one is missing', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id, withTranscript: false });

			const result = await persistEditorTranscript(db, authUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke'
			});

			expect(result).toEqual({ ok: true });

			const rows = await db.select().from(transcript).where(eq(transcript.projectId, 'proj-1'));
			expect(rows).toHaveLength(1);
			expect(JSON.parse(rows[0].words)).toEqual(fixtureTranscriptWords);
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

			const missing = await persistEditorTranscript(db, authUser.id, 'missing', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke'
			});
			const other = await persistEditorTranscript(db, otherUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke'
			});

			expect(missing).toEqual({ ok: false, status: 404, message: 'Project not found' });
			expect(other).toEqual({ ok: false, status: 404, message: 'Project not found' });
		} finally {
			client.close();
		}
	});
});
