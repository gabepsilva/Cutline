import { describe, expect, it } from 'vitest';
import { buildMockTranscript, mockEditorResources } from '$lib/mocks/editor.mock';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import { fixtureTimelineOverlay } from '$lib/test/fixtures/timeline-overlay';
import { user } from '$lib/server/db/auth.schema';
import { loadEditorProject } from '$lib/server/editor-project-load';
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

async function seedEditorProject(
	db: Awaited<ReturnType<typeof createTestDb>>['db'],
	options: {
		projectId: string;
		ownerId: string;
		withTranscript?: boolean;
		withMedia?: boolean;
		withOverlay?: boolean;
	}
) {
	await db.insert(user).values({
		id: options.ownerId,
		name: options.ownerId === authUser.id ? authUser.name : 'Other User',
		email: options.ownerId === authUser.id ? authUser.email : otherUser.email,
		emailVerified: true,
		createdAt: new Date('2026-06-01T00:00:00.000Z'),
		updatedAt: new Date('2026-06-01T00:00:00.000Z')
	});

	await db.insert(project).values({
		id: options.projectId,
		userId: options.ownerId,
		title: 'How I edit videos 3x faster',
		kind: 'TALKING HEAD',
		description: 'Talking-head tutorial',
		durationSeconds: 272,
		thumb: 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)',
		createdAt: new Date('2026-06-20T00:00:00.000Z'),
		updatedAt: new Date('2026-06-26T10:00:00.000Z')
	});

	if (options.withTranscript) {
		const { words } = buildMockTranscript();
		await db.insert(transcript).values({
			id: 'transcript-1',
			projectId: options.projectId,
			words: JSON.stringify(words),
			captionStyle: 'karaoke'
		});
	}

	if (options.withMedia) {
		await db.insert(media).values(
			mockEditorResources.map((resource) => ({
				id: resource.id,
				projectId: options.projectId,
				name: resource.name,
				durationSeconds: resource.dur,
				kind: resource.kind,
				thumb: resource.thumb,
				sizeBytes: 0
			}))
		);
	}

	if (options.withOverlay) {
		await db.insert(media).values({
			id: fixtureTimelineOverlay.resId,
			projectId: options.projectId,
			name: fixtureTimelineOverlay.name,
			durationSeconds: Math.round(fixtureTimelineOverlay.dur),
			kind: 'B-roll',
			thumb: fixtureTimelineOverlay.thumb,
			sizeBytes: 0
		});
		await db.insert(overlay).values({
			id: fixtureTimelineOverlay.id,
			projectId: options.projectId,
			mediaId: fixtureTimelineOverlay.resId,
			name: fixtureTimelineOverlay.name,
			startSeconds: fixtureTimelineOverlay.start,
			durationSeconds: fixtureTimelineOverlay.dur,
			thumb: fixtureTimelineOverlay.thumb
		});
	}
}

describe('loadEditorProject', () => {
	it('returns parsed words, derived sentences, and session speaker for an owned project', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedEditorProject(db, {
				projectId: 'proj-hero',
				ownerId: authUser.id,
				withTranscript: true,
				withMedia: true
			});

			const data = await loadEditorProject(db, authUser, 'proj-hero');
			expect(data).not.toBeNull();

			expect(data!.mode).toBe('editor');
			expect(data!.project).toMatchObject({
				id: 'proj-hero',
				title: 'How I edit videos 3x faster',
				durationLabel: '4:32'
			});
			expect(data!.meta).toBe('Auto-saved');
			expect(data!.captionStyle).toBe('karaoke');
			expect(data!.words.length).toBeGreaterThan(0);
			expect(data!.sentences.length).toBeGreaterThan(0);
			expect(data!.speaker).toEqual({ name: 'Alex Chen', initials: 'AC' });
			expect(data!.resources).toHaveLength(3);
			expect(data!.overlays).toEqual([]);
			expect(data!.videoUrl).toBeNull();
			expect(data!.aRoll).toBeNull();
		} finally {
			client.close();
		}
	});

	it('returns empty transcript arrays when no transcript row exists', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedEditorProject(db, {
				projectId: 'proj-empty',
				ownerId: authUser.id
			});

			const data = await loadEditorProject(db, authUser, 'proj-empty');
			expect(data).toMatchObject({
				mode: 'import',
				words: [],
				sentences: [],
				meta: 'Draft · no transcript',
				resources: [],
				overlays: [],
				transcriptionJobId: null
			});
		} finally {
			client.close();
		}
	});

	it('returns import mode while an upload is still in progress', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedEditorProject(db, {
				projectId: 'proj-uploading',
				ownerId: authUser.id
			});
			await db.insert(media).values({
				id: 'media-uploading',
				projectId: 'proj-uploading',
				name: 'clip.mp4',
				durationSeconds: 0,
				kind: 'A-roll',
				thumb: 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)',
				sizeBytes: 1024,
				objectKey: 'uploads/clip.mp4',
				status: 'uploading'
			});

			const data = await loadEditorProject(db, authUser, 'proj-uploading');
			expect(data?.mode).toBe('import');
		} finally {
			client.close();
		}
	});

	it('maps media resources with duration, kind, and thumb', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedEditorProject(db, {
				projectId: 'proj-hero',
				ownerId: authUser.id,
				withMedia: true
			});

			const data = await loadEditorProject(db, authUser, 'proj-hero');
			expect(data?.resources[0]).toMatchObject({
				id: 'r1',
				name: 'City timelapse',
				dur: 6,
				kind: 'B-roll'
			});
		} finally {
			client.close();
		}
	});

	it('maps overlay rows to timeline overlays', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedEditorProject(db, {
				projectId: 'proj-hero',
				ownerId: authUser.id,
				withOverlay: true
			});

			const data = await loadEditorProject(db, authUser, 'proj-hero');
			expect(data?.overlays).toEqual([fixtureTimelineOverlay]);
		} finally {
			client.close();
		}
	});

	it('returns null for projects owned by another user', async () => {
		const { db, client } = await createTestDb();
		try {
			await seedEditorProject(db, {
				projectId: 'proj-hero',
				ownerId: otherUser.id
			});

			const data = await loadEditorProject(db, authUser, 'proj-hero');
			expect(data).toBeNull();
		} finally {
			client.close();
		}
	});
});
