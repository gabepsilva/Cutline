import { eq, inArray } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { media, overlay, transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { assertProjectOwned } from '$lib/server/project-access';
import type { ServerError, ServerOk } from '$lib/server/result';
import type { CaptionStyle, Word } from '$lib/types/transcript';
import type { Overlay } from '$lib/types/timeline';

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
		Number.isFinite(value.start) &&
		value.start >= 0 &&
		typeof value.dur === 'number' &&
		Number.isFinite(value.dur) &&
		value.dur > 0 &&
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

export type PersistEditorPayload = {
	words: Word[];
	captionStyle: CaptionStyle;
	overlays: Overlay[];
};

export function parsePersistEditorBody(body: unknown): PersistEditorPayload | ServerError {
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

async function transcriptExists(database: Database, projectId: string): Promise<boolean> {
	const [existing] = await database
		.select({ id: transcript.id })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	return existing !== undefined;
}

/** Builds the transcript upsert as a query builder so it can be awaited directly or batched. */
function buildTranscriptWrite(
	database: Database,
	projectId: string,
	payload: PersistEditorPayload,
	exists: boolean
) {
	const wordsJson = JSON.stringify(payload.words);

	return exists
		? database
				.update(transcript)
				.set({ words: wordsJson, captionStyle: payload.captionStyle })
				.where(eq(transcript.projectId, projectId))
		: database.insert(transcript).values({
				projectId,
				words: wordsJson,
				captionStyle: payload.captionStyle
			});
}

async function upsertTranscript(
	database: Database,
	projectId: string,
	payload: PersistEditorPayload
): Promise<void> {
	const exists = await transcriptExists(database, projectId);
	await buildTranscriptWrite(database, projectId, payload, exists);
}

/** Owner-gated whole-document transcript replace — upserts by project id. */
export async function persistEditorTranscript(
	database: Database,
	userId: string,
	projectId: string,
	payload: PersistEditorPayload
): Promise<ServerOk | ServerError> {
	const ownershipError = await assertProjectOwned(database, userId, projectId);
	if (ownershipError) return ownershipError;

	await upsertTranscript(database, projectId, payload);
	return { ok: true };
}

async function planOverlayMedia(
	database: Database,
	projectId: string,
	overlays: Overlay[]
): Promise<{ error: ServerError | null; toInsert: Overlay[] }> {
	const resIds = [...new Set(overlays.map((item) => item.resId))];
	if (resIds.length === 0) return { error: null, toInsert: [] };

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
				return {
					error: { ok: false, status: 400, message: 'Invalid overlay media reference' },
					toInsert: []
				};
			}
			continue;
		}

		if (!toInsert.has(item.resId)) {
			toInsert.set(item.resId, item);
		}
	}

	return { error: null, toInsert: [...toInsert.values()] };
}

function mediaRowsFromOverlays(projectId: string, overlays: Overlay[]) {
	return overlays.map((item) => ({
		id: item.resId,
		projectId,
		name: item.name,
		durationSeconds: Math.max(1, Math.round(item.dur)),
		kind: inferMediaKind(item.resId),
		thumb: item.thumb,
		sizeBytes: 0
	}));
}

/** Owner-gated whole-document editor replace — transcript + overlays (atomic batch). */
export async function persistEditorProject(
	database: Database,
	userId: string,
	projectId: string,
	payload: PersistEditorPayload
): Promise<ServerOk | ServerError> {
	const ownershipError = await assertProjectOwned(database, userId, projectId);
	if (ownershipError) return ownershipError;

	// These reads (existence probe + media planning) run before the batch, so they are not part
	// of the atomic write. That is safe here because this is a single-user, debounced autosave
	// doing an idempotent whole-document replace: a stale read at worst causes a retriable failure,
	// and re-running converges to the same state.
	const exists = await transcriptExists(database, projectId);

	const { error: mediaError, toInsert } = await planOverlayMedia(
		database,
		projectId,
		payload.overlays
	);
	if (mediaError) return mediaError;

	const transcriptWrite = buildTranscriptWrite(database, projectId, payload, exists);

	const batch = [
		transcriptWrite,
		...(toInsert.length > 0
			? [database.insert(media).values(mediaRowsFromOverlays(projectId, toInsert))]
			: []),
		database.delete(overlay).where(eq(overlay.projectId, projectId)),
		...(payload.overlays.length > 0
			? [
					database.insert(overlay).values(
						payload.overlays.map((item) => ({
							id: item.id,
							projectId,
							mediaId: item.resId,
							name: item.name,
							startSeconds: item.start,
							durationSeconds: item.dur,
							thumb: item.thumb
						}))
					)
				]
			: [])
	] as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]];

	await database.batch(batch);

	return { ok: true };
}
