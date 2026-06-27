import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { transcript } from '$lib/server/db/domain.schema';
import { writeTranscript } from '$lib/server/transcript/write-transcript-words';
import type { TranscriptSpeaker, Word } from '$lib/types/transcript';

const sampleWords: Word[] = [
	{
		id: 'w0',
		text: 'Hi',
		clean: 'hi',
		start: 0,
		dur: 0.2,
		bars: [],
		filler: false,
		deleted: false,
		sid: 's0',
		speaker: 'A'
	}
];

const sampleSpeakers: TranscriptSpeaker[] = [{ speaker: 'A', name: 'Speaker A', initials: 'A' }];

async function seedTranscript(projectId: string, ownerId: string, words: string) {
	const { createTestDb } = await import('$lib/test/test-db');
	const { project } = await import('$lib/server/db/domain.schema');
	const { user: authUserTable } = await import('$lib/server/db/auth.schema');
	const { db } = await createTestDb();

	await db.insert(authUserTable).values({
		id: ownerId,
		name: 'Alex',
		email: `${ownerId}@cutline.test`,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await db.insert(project).values({
		id: projectId,
		userId: ownerId,
		title: 'Demo',
		kind: 'TALKING HEAD',
		description: null,
		durationSeconds: 0,
		thumb: 'thumb'
	});
	await db.insert(transcript).values({ projectId, words });

	return db;
}

describe('writeTranscript', () => {
	it('writes words and the speaker roster when the transcript is empty', async () => {
		const db = await seedTranscript('proj-1', 'user-a', '[]');

		const count = await writeTranscript(db, 'proj-1', sampleWords, sampleSpeakers);
		expect(count).toBe(1);

		const [row] = await db.select().from(transcript).where(eq(transcript.projectId, 'proj-1'));
		expect(JSON.parse(row!.words)).toHaveLength(1);
		expect(JSON.parse(row!.speakers)).toEqual(sampleSpeakers);
	});

	it('overwrites an existing transcript (re-transcribe = start clean)', async () => {
		const db = await seedTranscript(
			'proj-2',
			'user-b',
			JSON.stringify([{ ...sampleWords[0], id: 'existing' }])
		);

		const count = await writeTranscript(db, 'proj-2', sampleWords, sampleSpeakers);
		expect(count).toBe(1);

		const [row] = await db.select().from(transcript).where(eq(transcript.projectId, 'proj-2'));
		expect(JSON.parse(row!.words)[0].id).toBe('w0');
		expect(JSON.parse(row!.speakers)).toEqual(sampleSpeakers);
	});
});
