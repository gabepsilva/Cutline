import { and, eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import { projectThumb } from '$lib/types/project';

type Database = LibSQLDatabase<typeof schema>;

export const PROJECT_TITLE_MAX_LENGTH = 120;

export type ProjectMutationError = {
	ok: false;
	status: 400 | 404;
	message: string;
};

export type CreateProjectResult = { ok: true; projectId: string };

export type ProjectMutationOk = { ok: true };

export async function createOwnedProject(
	database: Database,
	userId: string
): Promise<CreateProjectResult> {
	const projectId = crypto.randomUUID();

	await database.batch([
		database.insert(project).values({
			id: projectId,
			userId,
			title: 'Untitled project',
			kind: 'TALKING HEAD',
			description: null,
			durationSeconds: 0,
			thumb: projectThumb('TALKING HEAD')
		}),
		database.insert(transcript).values({
			projectId,
			words: '[]'
		})
	]);

	return { ok: true, projectId };
}

export async function renameOwnedProject(
	database: Database,
	userId: string,
	projectId: string,
	rawTitle: string
): Promise<ProjectMutationOk | ProjectMutationError> {
	const title = rawTitle.trim();
	if (!title) {
		return { ok: false, status: 400, message: 'Title is required' };
	}
	if (title.length > PROJECT_TITLE_MAX_LENGTH) {
		return { ok: false, status: 400, message: 'Title must be 120 characters or fewer' };
	}

	const updated = await database
		.update(project)
		.set({ title })
		.where(and(eq(project.id, projectId), eq(project.userId, userId)))
		.returning({ id: project.id });

	if (updated.length === 0) {
		return { ok: false, status: 404, message: 'Project not found' };
	}

	return { ok: true };
}

/** Explicit child-first deletes — do not rely on PRAGMA cascade on Turso. */
export async function deleteOwnedProject(
	database: Database,
	userId: string,
	projectId: string
): Promise<ProjectMutationOk | ProjectMutationError> {
	const owned = await database
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.id, projectId), eq(project.userId, userId)))
		.limit(1);

	if (owned.length === 0) {
		return { ok: false, status: 404, message: 'Project not found' };
	}

	await database.batch([
		database.delete(overlay).where(eq(overlay.projectId, projectId)),
		database.delete(media).where(eq(media.projectId, projectId)),
		database.delete(transcript).where(eq(transcript.projectId, projectId)),
		database.delete(project).where(and(eq(project.id, projectId), eq(project.userId, userId)))
	]);

	return { ok: true };
}
