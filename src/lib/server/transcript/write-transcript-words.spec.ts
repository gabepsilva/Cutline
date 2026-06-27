import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { transcript } from '$lib/server/db/domain.schema';
import { writeTranscriptWordsIfEmpty } from '$lib/server/transcript/write-transcript-words';
import type { Word } from '$lib/types/transcript';

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
		sid: 's0'
	}
];

describe('writeTranscriptWordsIfEmpty', () => {
	it('writes words when the transcript is empty', async () => {
		const { createTestDb } = await import('$lib/test/test-db');
		const { project } = await import('$lib/server/db/domain.schema');
		const { user: authUserTable } = await import('$lib/server/db/auth.schema');
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

		const count = await writeTranscriptWordsIfEmpty(db, 'proj-1', sampleWords);
		expect(count).toBe(1);

		const [row] = await db.select().from(transcript).where(eq(transcript.projectId, 'proj-1'));
		expect(JSON.parse(row!.words)).toHaveLength(1);
	});

	it('does not overwrite an existing transcript', async () => {
		const { createTestDb } = await import('$lib/test/test-db');
		const { project } = await import('$lib/server/db/domain.schema');
		const { user: authUserTable } = await import('$lib/server/db/auth.schema');
		const { db } = await createTestDb();

		await db.insert(authUserTable).values({
			id: 'user-b',
			name: 'Alex',
			email: 'alex2@cutline.test',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await db.insert(project).values({
			id: 'proj-2',
			userId: 'user-b',
			title: 'Demo',
			kind: 'TALKING HEAD',
			description: null,
			durationSeconds: 0,
			thumb: 'thumb'
		});
		await db.insert(transcript).values({
			projectId: 'proj-2',
			words: JSON.stringify([{ ...sampleWords[0], id: 'existing' }])
		});

		const count = await writeTranscriptWordsIfEmpty(db, 'proj-2', sampleWords);
		expect(count).toBe(1);

		const [row] = await db.select().from(transcript).where(eq(transcript.projectId, 'proj-2'));
		expect(JSON.parse(row!.words)[0].id).toBe('existing');
	});
});
