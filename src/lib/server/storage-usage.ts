import { eq, sum } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { media, project } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import type { StorageUsage } from '$lib/types/storage';
import { formatBytes } from '$lib/utils/format-bytes';

type Database = LibSQLDatabase<typeof schema>;

/** Documented quota until per-user billing/plans exist. */
export const STORAGE_QUOTA_BYTES = 60 * 1024 ** 3;

/** Sum the current user's media bytes across their projects vs the storage quota. */
export async function resolveStorageUsage(
	database: Database,
	userId: string
): Promise<StorageUsage> {
	const [row] = await database
		.select({ total: sum(media.sizeBytes) })
		.from(media)
		.innerJoin(project, eq(media.projectId, project.id))
		.where(eq(project.userId, userId));

	const used = Number(row?.total ?? 0);
	const percentUsed = Math.min(100, Math.round((used / STORAGE_QUOTA_BYTES) * 100));
	const usageLabel = `${formatBytes(used)} of ${formatBytes(STORAGE_QUOTA_BYTES)} used`;

	return { percentUsed, usageLabel };
}
