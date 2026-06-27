import { desc, eq, inArray } from 'drizzle-orm';
import { media, project } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { mapProjectRow } from '$lib/server/map-project-row';
import { resolveProjectRouteMode } from '$lib/server/project-route-mode';
import type { Project } from '$lib/types/project';
import type { MediaStatus } from '$lib/types/media-upload';

export interface DashboardProjectsLoad {
	latestProject: Project | null;
	projects: Project[];
}

function groupMediaStatusesByProject(
	rows: { projectId: string; status: string }[]
): Map<string, MediaStatus[]> {
	const grouped = new Map<string, MediaStatus[]>();

	for (const row of rows) {
		const statuses = grouped.get(row.projectId) ?? [];
		statuses.push(row.status as MediaStatus);
		grouped.set(row.projectId, statuses);
	}

	return grouped;
}

function isDashboardDraft(mediaStatuses: MediaStatus[]): boolean {
	return resolveProjectRouteMode(mediaStatuses) === 'import';
}

/** Session-scoped dashboard project list — hero is newest ready project; drafts stay in the grid. */
export async function loadDashboardProjects(
	database: Database,
	userId: string
): Promise<DashboardProjectsLoad> {
	const rows = await database
		.select()
		.from(project)
		.where(eq(project.userId, userId))
		.orderBy(desc(project.updatedAt));

	if (rows.length === 0) {
		return { latestProject: null, projects: [] };
	}

	const projectIds = rows.map((row) => row.id);
	const mediaRows = await database
		.select({ projectId: media.projectId, status: media.status })
		.from(media)
		.where(inArray(media.projectId, projectIds));

	const mediaByProject = groupMediaStatusesByProject(mediaRows);

	const mapped = rows.map((row) => {
		const mediaStatuses = mediaByProject.get(row.id) ?? [];
		return mapProjectRow(row, { isDraft: isDashboardDraft(mediaStatuses) });
	});

	const heroIndex = mapped.findIndex((item) => !item.isDraft);
	const latestProject = heroIndex >= 0 ? mapped[heroIndex]! : null;
	const projects = mapped.filter((_, index) => index !== heroIndex);

	return { latestProject, projects };
}
