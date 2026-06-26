import { and, eq, inArray } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import type { CaptionStyle, Word } from '$lib/types/transcript';
import type { Overlay } from '$lib/types/timeline';

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

function isOverlay(value: unknown): value is Overlay {
	if (!isRecord(value)) return false;

	return (
		typeof value.id === 'string' &&
		typeof value.resId === 'string' &&
		typeof value.name === 'string' &&
		typeof value.start === 'number' &&
		typeof value.dur === 'number' &&
		typeof value.thumb === 'string'
	);
}

function inferMediaKind(resId: string): string {
	return resId.startsWith('rec-') ? 'Recording' : 'B-roll';
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
	overlays: Overlay[];
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

	const overlays = body.overlays;
	if (overlays !== undefined) {
		if (!Array.isArray(overlays) || !overlays.every(isOverlay)) {
			return { ok: false, status: 400, message: 'Invalid overlays payload' };
		}
	}

	return {
		words: body.words,
		captionStyle: captionStyle as CaptionStyle,
		overlays: (overlays as Overlay[] | undefined) ?? []
	};
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

async function ensureOverlayMedia(
	database: Database,
	projectId: string,
	overlays: Overlay[]
): Promise<PersistEditorTranscriptError | null> {
	const resIds = [...new Set(overlays.map((item) => item.resId))];
	if (resIds.length === 0) return null;

	const rows = await database
		.select({ id: media.id, projectId: media.projectId })
		.from(media)
		.where(inArray(media.id, resIds));

	const byId = new Map(rows.map((row) => [row.id, row.projectId]));
	const toInsert = new Map<string, Overlay>();

	for (const item of overlays) {
		const ownerProjectId = byId.get(item.resId);
		if (ownerProjectId !== undefined) {
			if (ownerProjectId !== projectId) {
				return { ok: false, status: 400, message: 'Invalid overlay media reference' };
			}
			continue;
		}

		if (!toInsert.has(item.resId)) {
			toInsert.set(item.resId, item);
		}
	}

	if (toInsert.size === 0) return null;

	await database.insert(media).values(
		[...toInsert.values()].map((item) => ({
			id: item.resId,
			projectId,
			name: item.name,
			durationSeconds: Math.max(1, Math.round(item.dur)),
			kind: inferMediaKind(item.resId),
			thumb: item.thumb,
			sizeBytes: 0
		}))
	);

	return null;
}

async function persistEditorOverlays(
	database: Database,
	projectId: string,
	overlays: Overlay[]
): Promise<void> {
	await database.delete(overlay).where(eq(overlay.projectId, projectId));

	if (overlays.length === 0) return;

	await database.insert(overlay).values(
		overlays.map((item) => ({
			id: item.id,
			projectId,
			mediaId: item.resId,
			name: item.name,
			startSeconds: item.start,
			durationSeconds: item.dur,
			thumb: item.thumb
		}))
	);
}

/** Owner-gated whole-document editor replace — transcript + overlays. */
export async function persistEditorProject(
	database: Database,
	userId: string,
	projectId: string,
	payload: PersistEditorTranscriptPayload
): Promise<PersistEditorTranscriptOk | PersistEditorTranscriptError> {
	const transcriptResult = await persistEditorTranscript(database, userId, projectId, payload);
	if (!transcriptResult.ok) return transcriptResult;

	const mediaError = await ensureOverlayMedia(database, projectId, payload.overlays);
	if (mediaError) return mediaError;

	await persistEditorOverlays(database, projectId, payload.overlays);
	return { ok: true };
}
