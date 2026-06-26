import { and, eq, inArray } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import type { CaptionStyle, Word } from '$lib/types/transcript';
import type { Overlay } from '$lib/types/timeline';

type Database = LibSQLDatabase<typeof schema>;

export type PersistEditorError = {
	ok: false;
	status: 400 | 404;
	message: string;
};

export type PersistEditorOk = { ok: true };

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

export function isPersistEditorError(
	value: PersistEditorPayload | PersistEditorError
): value is PersistEditorError {
	return 'ok' in value && value.ok === false;
}

export function parsePersistEditorBody(body: unknown): PersistEditorPayload | PersistEditorError {
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

async function upsertTranscript(
	database: Database,
	projectId: string,
	payload: PersistEditorPayload
): Promise<void> {
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
}

async function assertProjectOwned(
	database: Database,
	userId: string,
	projectId: string
): Promise<PersistEditorError | null> {
	const owned = await database
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.userId, userId)))
		.limit(1);

	if (owned.length === 0) {
		return { ok: false, status: 404, message: 'Project not found' };
	}

	return null;
}

/** Owner-gated whole-document transcript replace — upserts by project id. */
export async function persistEditorTranscript(
	database: Database,
	userId: string,
	projectId: string,
	payload: PersistEditorPayload
): Promise<PersistEditorOk | PersistEditorError> {
	const ownershipError = await assertProjectOwned(database, userId, projectId);
	if (ownershipError) return ownershipError;

	await upsertTranscript(database, projectId, payload);
	return { ok: true };
}

async function planOverlayMedia(
	database: Database,
	projectId: string,
	overlays: Overlay[]
): Promise<{ error: PersistEditorError | null; toInsert: Overlay[] }> {
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
): Promise<PersistEditorOk | PersistEditorError> {
	const ownershipError = await assertProjectOwned(database, userId, projectId);
	if (ownershipError) return ownershipError;

	const wordsJson = JSON.stringify(payload.words);
	const [existing] = await database
		.select({ id: transcript.id })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	const { error: mediaError, toInsert } = await planOverlayMedia(
		database,
		projectId,
		payload.overlays
	);
	if (mediaError) return mediaError;

	const transcriptWrite = existing
		? database
				.update(transcript)
				.set({ words: wordsJson, captionStyle: payload.captionStyle })
				.where(eq(transcript.projectId, projectId))
		: database.insert(transcript).values({
				projectId,
				words: wordsJson,
				captionStyle: payload.captionStyle
			});

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
