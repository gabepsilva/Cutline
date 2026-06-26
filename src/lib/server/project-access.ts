import { and, eq } from 'drizzle-orm';
import { project } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import type { ServerError } from '$lib/server/result';

/** Shared WHERE predicate: a project row owned by the given user. */
export function ownedProjectFilter(userId: string, projectId: string) {
	return and(eq(project.id, projectId), eq(project.userId, userId));
}

/** Owner gate — resolves to a 404 ServerError when the project is missing or not owned. */
export async function assertProjectOwned(
	database: Database,
	userId: string,
	projectId: string
): Promise<ServerError | null> {
	const [row] = await database
		.select({ id: project.id })
		.from(project)
		.where(ownedProjectFilter(userId, projectId))
		.limit(1);

	return row ? null : { ok: false, status: 404, message: 'Project not found' };
}
