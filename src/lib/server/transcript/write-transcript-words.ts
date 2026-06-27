import { eq } from 'drizzle-orm';
import { transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import type { TranscriptSpeaker, Word } from '$lib/types/transcript';

/**
 * Overwrites the project transcript with a freshly produced `Word[]` + speaker roster.
 * Re-running replaces any prior result (M9-01 idempotency: re-transcribe = start clean).
 * Returns the written word count.
 */
export async function writeTranscript(
	database: Database,
	projectId: string,
	words: Word[],
	speakers: TranscriptSpeaker[]
): Promise<number> {
	const [row] = await database
		.select({ id: transcript.id })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	if (!row) {
		throw new Error('Transcript row not found');
	}

	await database
		.update(transcript)
		.set({ words: JSON.stringify(words), speakers: JSON.stringify(speakers) })
		.where(eq(transcript.projectId, projectId));

	return words.length;
}
