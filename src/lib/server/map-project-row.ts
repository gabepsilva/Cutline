import type { Project } from '$lib/types/project';
import { formatProjectDuration, PROJECT_DRAFT_META } from '$lib/types/project';
import { relativeTime } from '$lib/utils/format-relative-time';
import type { project } from '$lib/server/db/domain.schema';

type ProjectRow = typeof project.$inferSelect;

export interface MapProjectRowOptions {
	isDraft?: boolean;
}

/** Map a drizzle `project` row to the dashboard/editor `Project` UI shape. */
export function mapProjectRow(row: ProjectRow, options: MapProjectRowOptions = {}): Project {
	const isDraft = options.isDraft ?? false;

	return {
		id: row.id,
		title: row.title,
		kind: row.kind,
		description: row.description ?? undefined,
		durationLabel: formatProjectDuration(row.durationSeconds),
		thumb: row.thumb,
		meta: isDraft ? PROJECT_DRAFT_META : `Edited ${relativeTime(row.updatedAt)}`,
		isDraft
	};
}
