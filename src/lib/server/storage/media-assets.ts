import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { media } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { assertProjectOwned } from '$lib/server/project-access';
import type { ServerError } from '$lib/server/result';
import { findHeadSegmentRow } from '$lib/server/segments/segment-store';
import { presignGetObject } from '$lib/server/storage/r2';
import type { MediaStatus } from '$lib/types/media-upload';

export interface MediaAssetUrls {
	mediaId: string;
	status: MediaStatus;
	transcodeUrl: string | null;
	waveformUrl: string | null;
	filmstripUrl: string | null;
	filmstripMetaUrl: string | null;
}

async function presignIfKey(key: string | null | undefined): Promise<string | null> {
	if (!key) return null;
	return presignGetObject(key);
}

/** Presigned GET URLs for ingest-derived assets when the media row is ready. */
export async function getMediaAssetUrls(
	database: Database,
	userId: string,
	projectId: string,
	mediaId: string
): Promise<MediaAssetUrls | ServerError> {
	const ownerError = await assertProjectOwned(database, userId, projectId);
	if (ownerError) return ownerError;

	const [row] = await database
		.select()
		.from(media)
		.where(and(eq(media.id, mediaId), eq(media.projectId, projectId)))
		.limit(1);

	if (!row) {
		return { ok: false, status: 404, message: 'Media not found' };
	}

	const status = row.status as MediaStatus;
	if (status !== 'ready') {
		return {
			mediaId,
			status,
			transcodeUrl: null,
			waveformUrl: null,
			filmstripUrl: null,
			filmstripMetaUrl: null
		};
	}

	const filmstripMetaKey = row.filmstripKey?.replace(/filmstrip\.jpg$/, 'filmstrip.json') ?? null;

	const [transcodeUrl, waveformUrl, filmstripUrl, filmstripMetaUrl] = await Promise.all([
		presignIfKey(row.transcodeKey),
		presignIfKey(row.waveformKey),
		presignIfKey(row.filmstripKey),
		presignIfKey(filmstripMetaKey)
	]);

	return {
		mediaId,
		status,
		transcodeUrl,
		waveformUrl,
		filmstripUrl,
		filmstripMetaUrl
	};
}

/** Primary A-roll source clip — head of the segment sequence, or legacy earliest upload. */
export async function findPrimaryMediaRow(database: Database, projectId: string) {
	const headSegment = await findHeadSegmentRow(database, projectId);
	if (headSegment?.mediaId) {
		const [row] = await database
			.select()
			.from(media)
			.where(eq(media.id, headSegment.mediaId))
			.limit(1);
		if (row) return row;
	}

	const rows = await database
		.select()
		.from(media)
		.where(and(eq(media.projectId, projectId), isNotNull(media.objectKey)))
		.orderBy(asc(media.createdAt));

	return rows[0] ?? null;
}
