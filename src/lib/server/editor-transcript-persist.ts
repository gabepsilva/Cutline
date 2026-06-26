import { and, eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { project, transcript } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import type { CaptionStyle, Word } from '$lib/types/transcript';

type Database = LibSQLDatabase<typeof schema>;

export type PersistEditorTranscriptError = {
	ok: false;
	status: 400 | 404;
	message: string;
};

export type PersistEditorTranscriptOk = { ok: true };

const CAPTION_STYLES = new Set<CaptionStyle>(['karaoke', 'clean']);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isWord(value: unknown): value is Word {
	if (!isRecord(value)) return false;

	return (
		typeof value.id === 'string' &&
		typeof value.text === 'string' &&
		typeof value.clean === 'string' &&
		typeof value.start === 'number' &&
		typeof value.dur === 'number' &&
		Array.isArray(value.bars) &&
		value.bars.every((bar) => typeof bar === 'number') &&
		typeof value.filler === 'boolean' &&
		typeof value.deleted === 'boolean' &&
		typeof value.sid === 'string'
	);
}

export type PersistEditorTranscriptPayload = {
	words: Word[];
	captionStyle: CaptionStyle;
};

export function isPersistEditorTranscriptError(
	value: PersistEditorTranscriptPayload | PersistEditorTranscriptError
): value is PersistEditorTranscriptError {
	return 'ok' in value && value.ok === false;
}

export function parsePersistEditorTranscriptBody(
	body: unknown
): PersistEditorTranscriptPayload | PersistEditorTranscriptError {
	if (!isRecord(body)) {
		return { ok: false, status: 400, message: 'Invalid request body' };
	}

	if (!Array.isArray(body.words) || !body.words.every(isWord)) {
		return { ok: false, status: 400, message: 'Invalid words payload' };
	}

	const captionStyle = body.captionStyle;
	if (typeof captionStyle !== 'string' || !CAPTION_STYLES.has(captionStyle as CaptionStyle)) {
		return { ok: false, status: 400, message: 'Invalid caption style' };
	}

	return { words: body.words, captionStyle: captionStyle as CaptionStyle };
}

/** Owner-gated whole-document transcript replace — upserts by project id. */
export async function persistEditorTranscript(
	database: Database,
	userId: string,
	projectId: string,
	payload: PersistEditorTranscriptPayload
): Promise<PersistEditorTranscriptOk | PersistEditorTranscriptError> {
	const owned = await database
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.userId, userId)))
		.limit(1);

	if (owned.length === 0) {
		return { ok: false, status: 404, message: 'Project not found' };
	}

	const wordsJson = JSON.stringify(payload.words);
	const [existing] = await database
		.select({ id: transcript.id })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	if (existing) {
		await database
			.update(transcript)
			.set({ words: wordsJson, captionStyle: payload.captionStyle })
			.where(eq(transcript.projectId, projectId));
	} else {
		await database.insert(transcript).values({
			projectId,
			words: wordsJson,
			captionStyle: payload.captionStyle
		});
	}

	return { ok: true };
}
