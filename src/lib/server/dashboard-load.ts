import { desc, eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { project } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import { mapProjectRow } from '$lib/server/map-project-row';
import type { Project } from '$lib/types/project';

type Database = LibSQLDatabase<typeof schema>;

export interface DashboardProjectsLoad {
	latestProject: Project | null;
	projects: Project[];
}

/** Session-scoped dashboard project list — newest first; hero excluded from grid. */
export async function loadDashboardProjects(
	database: Database,
	userId: string
): Promise<DashboardProjectsLoad> {
	const rows = await database
		.select()
		.from(project)
		.where(eq(project.userId, userId))
		.orderBy(desc(project.updatedAt));

	const latestProject = rows[0] ? mapProjectRow(rows[0]) : null;
	const projects = rows.slice(1).map(mapProjectRow);

	return { latestProject, projects };
}
