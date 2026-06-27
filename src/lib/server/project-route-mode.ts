import type { ProjectRouteMode } from '$lib/types/editor-load';
import type { MediaStatus } from '$lib/types/media-upload';

/** Media rows still receiving bytes from the browser. */
export const MEDIA_UPLOAD_IN_PROGRESS: readonly MediaStatus[] = ['pending', 'uploading'];

/** Upload finished — ingest may still be running (NP-06 gates transcript separately). */
export const MEDIA_UPLOAD_COMPLETED: readonly MediaStatus[] = ['uploaded', 'ingesting', 'ready'];

/** Chooses import gateway vs full editor from persisted media statuses. */
export function resolveProjectRouteMode(mediaStatuses: MediaStatus[]): ProjectRouteMode {
	const hasInProgress = mediaStatuses.some((status) =>
		(MEDIA_UPLOAD_IN_PROGRESS as readonly string[]).includes(status)
	);
	const completedCount = mediaStatuses.filter((status) =>
		(MEDIA_UPLOAD_COMPLETED as readonly string[]).includes(status)
	).length;

	if (completedCount === 0 || hasInProgress) return 'import';
	return 'editor';
}
