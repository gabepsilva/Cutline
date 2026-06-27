import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import {
	parsePersistEditorBody,
	persistEditorProject,
	persistEditorTranscript
} from '$lib/server/editor-transcript-persist';
import { fixtureTimelineOverlay } from '$lib/test/fixtures/timeline-overlay';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import { seedUser } from '$lib/test/seed-user';
import { createTestDb } from '$lib/test/test-db';

const authUser = { id: 'user-a', email: 'alex@cutline.test' };
const otherUser = { id: 'user-b', email: 'other@cutline.test' };

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

describe('parsePersistEditorBody', () => {
	it('accepts a valid words and caption style payload', () => {
		const parsed = parsePersistEditorBody({
			words: fixtureTranscriptWords,
			captionStyle: 'clean'
		});

		expect(parsed).toEqual({
			words: fixtureTranscriptWords,
			captionStyle: 'clean',
			overlays: []
		});
	});

	it('rejects malformed words arrays', () => {
		const parsed = parsePersistEditorBody({
			words: [{ id: 'w0' }],
			captionStyle: 'karaoke'
		});

		expect(parsed).toEqual({
			ok: false,
			status: 400,
			message: 'Invalid words payload'
		});
	});

	it('rejects overlays with non-positive duration', () => {
		const parsed = parsePersistEditorBody({
			words: fixtureTranscriptWords,
			captionStyle: 'karaoke',
			overlays: [{ ...fixtureTimelineOverlay, dur: 0 }]
		});

		expect(parsed).toEqual({
			ok: false,
			status: 400,
			message: 'Invalid overlays payload'
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
				captionStyle: 'clean',
				overlays: []
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
				captionStyle: 'karaoke',
				overlays: []
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
				captionStyle: 'karaoke',
				overlays: []
			});
			const other = await persistEditorTranscript(db, otherUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke',
				overlays: []
			});

			expect(missing).toEqual({ ok: false, status: 404, message: 'Project not found' });
			expect(other).toEqual({ ok: false, status: 404, message: 'Project not found' });
		} finally {
			client.close();
		}
	});
});

describe('persistEditorProject', () => {
	it('replaces overlays and inserts client-only media rows', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });

			const recordingOverlay = {
				id: 'o-rec-1-0',
				resId: 'rec-1',
				name: 'Recording 1',
				start: 12,
				dur: 8,
				thumb: 'repeating-linear-gradient(135deg,#2a1715 0 11px,#221210 11px 22px)'
			};

			const result = await persistEditorProject(db, authUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke',
				overlays: [recordingOverlay]
			});

			expect(result).toEqual({ ok: true });

			const mediaRows = await db.select().from(media).where(eq(media.projectId, 'proj-1'));
			expect(mediaRows).toHaveLength(1);
			expect(mediaRows[0]).toMatchObject({
				id: 'rec-1',
				name: 'Recording 1',
				kind: 'Recording',
				durationSeconds: 8
			});
			expect(mediaRows[0]?.createdAt).toBeInstanceOf(Date);

			const overlayRows = await db.select().from(overlay).where(eq(overlay.projectId, 'proj-1'));
			expect(overlayRows).toHaveLength(1);
			expect(overlayRows[0]).toMatchObject({
				id: 'o-rec-1-0',
				mediaId: 'rec-1',
				startSeconds: 12,
				durationSeconds: 8
			});
		} finally {
			client.close();
		}
	});

	it('persists overlays on existing media without duplicating media rows', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });
			await db.insert(media).values({
				id: fixtureTimelineOverlay.resId,
				projectId: 'proj-1',
				name: fixtureTimelineOverlay.name,
				durationSeconds: Math.round(fixtureTimelineOverlay.dur),
				kind: 'B-roll',
				thumb: fixtureTimelineOverlay.thumb,
				sizeBytes: 0
			});

			const result = await persistEditorProject(db, authUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke',
				overlays: [fixtureTimelineOverlay]
			});

			expect(result).toEqual({ ok: true });

			const mediaRows = await db.select().from(media).where(eq(media.projectId, 'proj-1'));
			expect(mediaRows).toHaveLength(1);

			const overlayRows = await db.select().from(overlay).where(eq(overlay.projectId, 'proj-1'));
			expect(overlayRows).toHaveLength(1);
			expect(overlayRows[0]?.mediaId).toBe(fixtureTimelineOverlay.resId);
		} finally {
			client.close();
		}
	});

	it('removes overlays when the payload is empty', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });
			await db.insert(media).values({
				id: 'media-1',
				projectId: 'proj-1',
				name: 'Clip',
				durationSeconds: 10,
				kind: 'B-roll',
				thumb: 'thumb',
				sizeBytes: 0
			});
			await db.insert(overlay).values({
				id: 'overlay-1',
				projectId: 'proj-1',
				mediaId: 'media-1',
				name: 'Clip',
				startSeconds: 0,
				durationSeconds: 5,
				thumb: 'thumb'
			});

			const result = await persistEditorProject(db, authUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke',
				overlays: []
			});

			expect(result).toEqual({ ok: true });
			expect(await db.select().from(overlay).where(eq(overlay.projectId, 'proj-1'))).toHaveLength(
				0
			);
		} finally {
			client.close();
		}
	});

	it('rejects overlay media owned by another project', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });
			await seedProject(db, { id: 'proj-2', userId: otherUser.id });
			await db.insert(media).values({
				id: 'foreign-media',
				projectId: 'proj-2',
				name: 'Foreign',
				durationSeconds: 10,
				kind: 'B-roll',
				thumb: 'thumb',
				sizeBytes: 0
			});

			const result = await persistEditorProject(db, authUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke',
				overlays: [{ ...fixtureTimelineOverlay, resId: 'foreign-media' }]
			});

			expect(result).toEqual({
				ok: false,
				status: 400,
				message: 'Invalid overlay media reference'
			});
		} finally {
			client.close();
		}
	});

	it('does not remove overlays from sibling projects', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedUser(db, authUser);
			await seedUser(db, otherUser);
			await seedProject(db, { id: 'proj-1', userId: authUser.id });
			await seedProject(db, { id: 'proj-2', userId: otherUser.id });

			for (const [projectId, mediaId, overlayId] of [
				['proj-1', 'media-1', 'overlay-1'],
				['proj-2', 'media-2', 'overlay-2']
			] as const) {
				await db.insert(media).values({
					id: mediaId,
					projectId,
					name: 'Clip',
					durationSeconds: 10,
					kind: 'B-roll',
					thumb: 'thumb',
					sizeBytes: 0
				});
				await db.insert(overlay).values({
					id: overlayId,
					projectId,
					mediaId,
					name: 'Clip',
					startSeconds: 0,
					durationSeconds: 5,
					thumb: 'thumb'
				});
			}

			const result = await persistEditorProject(db, authUser.id, 'proj-1', {
				words: fixtureTranscriptWords,
				captionStyle: 'karaoke',
				overlays: []
			});

			expect(result).toEqual({ ok: true });
			expect(await db.select().from(overlay).where(eq(overlay.projectId, 'proj-1'))).toHaveLength(
				0
			);
			expect(await db.select().from(overlay).where(eq(overlay.projectId, 'proj-2'))).toHaveLength(
				1
			);
		} finally {
			client.close();
		}
	});
});
