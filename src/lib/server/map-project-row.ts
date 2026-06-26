import type { Project } from '$lib/types/project';
import { formatProjectDuration } from '$lib/types/project';
import { relativeTime } from '$lib/utils/format-relative-time';
import type { project } from '$lib/server/db/domain.schema';

type ProjectRow = typeof project.$inferSelect;

/** Map a drizzle `project` row to the dashboard/editor `Project` UI shape. */
export function mapProjectRow(row: ProjectRow): Project {
	return {
		id: row.id,
		title: row.title,
		kind: row.kind,
		description: row.description ?? undefined,
		durationLabel: formatProjectDuration(row.durationSeconds),
		thumb: row.thumb,
		meta: `Edited ${relativeTime(row.updatedAt)}`
	};
}
