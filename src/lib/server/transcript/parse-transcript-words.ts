import type { Word } from '$lib/types/transcript';

/** Parse persisted transcript.words JSON into a Word array; invalid/missing → []. */
export function parseWords(raw: string | null | undefined): Word[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as Word[]) : [];
	} catch {
		return [];
	}
}
