import { asc, eq } from 'drizzle-orm';
import { segment, type segment as segmentTable } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import type { ARollSegment, SegmentType } from '$lib/types/segment';

export function mapSegmentRow(row: typeof segmentTable.$inferSelect): ARollSegment {
	return {
		id: row.id,
		projectId: row.projectId,
		order: row.segmentOrder,
		type: row.type as SegmentType,
		mediaId: row.mediaId,
		durationSeconds: row.durationSeconds,
		trimIn: row.trimIn,
		trimOut: row.trimOut
	};
}

/** Sum of segment durations — timeline length when a storyline exists. */
export function totalSegmentDuration(segments: ARollSegment[]): number {
	if (segments.length === 0) return 0;
	return segments.reduce((sum, entry) => sum + entry.durationSeconds, 0);
}

export async function listProjectSegments(
	database: Database,
	projectId: string
): Promise<ARollSegment[]> {
	const rows = await database
		.select()
		.from(segment)
		.where(eq(segment.projectId, projectId))
		.orderBy(asc(segment.segmentOrder));

	return rows.map(mapSegmentRow);
}

/** Head of the A-roll sequence (`segment_order = 0`). */
export async function findHeadSegmentRow(database: Database, projectId: string) {
	const rows = await database
		.select()
		.from(segment)
		.where(eq(segment.projectId, projectId))
		.orderBy(asc(segment.segmentOrder))
		.limit(1);

	return rows[0] ?? null;
}

export async function insertVideoSegmentForMedia(
	database: Database,
	projectId: string,
	mediaId: string,
	durationSeconds = 0
): Promise<void> {
	await database.insert(segment).values({
		projectId,
		segmentOrder: 0,
		type: 'video',
		mediaId,
		durationSeconds: Math.max(0, durationSeconds)
	});
}

export async function syncSegmentDurationForMedia(
	database: Database,
	mediaId: string,
	durationSeconds: number
): Promise<void> {
	await database
		.update(segment)
		.set({ durationSeconds: Math.max(1, durationSeconds) })
		.where(eq(segment.mediaId, mediaId));
}
