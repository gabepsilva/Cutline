import { eq } from 'drizzle-orm';
import { transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import type { Word } from '$lib/types/transcript';

function parseTranscriptWordCount(raw: string): number {
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.length : 0;
	} catch {
		return 0;
	}
}

/** Writes words when the project transcript is still empty; returns final word count. */
export async function writeTranscriptWordsIfEmpty(
	database: Database,
	projectId: string,
	words: Word[]
): Promise<number> {
	const [row] = await database
		.select({ id: transcript.id, words: transcript.words })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	if (!row) {
		throw new Error('Transcript row not found');
	}

	const existingCount = parseTranscriptWordCount(row.words);
	if (existingCount > 0) return existingCount;

	await database
		.update(transcript)
		.set({ words: JSON.stringify(words) })
		.where(eq(transcript.projectId, projectId));

	return words.length;
}
