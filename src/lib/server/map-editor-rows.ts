import type { media, overlay } from '$lib/server/db/domain.schema';
import type { MediaResource } from '$lib/types/media';
import type { Overlay } from '$lib/types/timeline';

type MediaRow = typeof media.$inferSelect;
type OverlayRow = typeof overlay.$inferSelect;

/** Recording resources use a `rec-` id prefix; everything else is imported B-roll. */
export function inferMediaKind(resId: string): string {
	return resId.startsWith('rec-') ? 'Recording' : 'B-roll';
}

/** drizzle `media` row → editor `MediaResource`. */
export function mapMediaRow(row: MediaRow): MediaResource {
	return {
		id: row.id,
		name: row.name,
		dur: row.durationSeconds,
		kind: row.kind,
		thumb: row.thumb
	};
}

/** drizzle `overlay` row → timeline `Overlay`. */
export function mapOverlayRow(row: OverlayRow): Overlay {
	return {
		id: row.id,
		resId: row.mediaId,
		name: row.name,
		start: row.startSeconds,
		dur: row.durationSeconds,
		thumb: row.thumb
	};
}

/** Client-only overlay → `media` insert row (auto-inserted to satisfy the overlay FK). */
export function mediaInsertFromOverlay(
	projectId: string,
	item: Overlay
): typeof media.$inferInsert {
	return {
		id: item.resId,
		projectId,
		name: item.name,
		durationSeconds: Math.max(1, Math.round(item.dur)),
		kind: inferMediaKind(item.resId),
		thumb: item.thumb,
		sizeBytes: 0
	};
}

/** Timeline `Overlay` → `overlay` insert row. */
export function overlayInsertFromDomain(
	projectId: string,
	item: Overlay
): typeof overlay.$inferInsert {
	return {
		id: item.id,
		projectId,
		mediaId: item.resId,
		name: item.name,
		startSeconds: item.start,
		durationSeconds: item.dur,
		thumb: item.thumb
	};
}
