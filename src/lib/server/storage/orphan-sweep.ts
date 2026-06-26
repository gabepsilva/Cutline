import { and, eq, inArray, lt } from 'drizzle-orm';
import { media } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { deleteObject } from '$lib/server/storage/r2';

const ABANDONED_UPLOAD_STATUSES = ['pending', 'uploading'] as const;
const ABANDONED_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Removes abandoned pending/uploading rows and their R2 objects. */
export async function sweepAbandonedUploads(database: Database): Promise<number> {
	const cutoff = new Date(Date.now() - ABANDONED_MAX_AGE_MS);
	const staleRows = await database
		.select({ id: media.id, objectKey: media.objectKey })
		.from(media)
		.where(and(inArray(media.status, [...ABANDONED_UPLOAD_STATUSES]), lt(media.createdAt, cutoff)));

	let removed = 0;
	for (const row of staleRows) {
		if (row.objectKey) {
			try {
				await deleteObject(row.objectKey);
			} catch {
				// Best-effort cleanup — still delete the stale row.
			}
		}
		await database.delete(media).where(eq(media.id, row.id));
		removed += 1;
	}

	return removed;
}
