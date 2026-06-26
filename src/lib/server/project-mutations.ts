import { eq } from 'drizzle-orm';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { assertProjectOwned, ownedProjectFilter } from '$lib/server/project-access';
import type { ServerError, ServerOk } from '$lib/server/result';
import { projectThumb } from '$lib/types/project';

export const PROJECT_TITLE_MAX_LENGTH = 120;

export type CreateProjectResult = { ok: true; projectId: string };

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
): Promise<ServerOk | ServerError> {
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
		.where(ownedProjectFilter(userId, projectId))
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
): Promise<ServerOk | ServerError> {
	const ownershipError = await assertProjectOwned(database, userId, projectId);
	if (ownershipError) return ownershipError;

	await database.batch([
		database.delete(overlay).where(eq(overlay.projectId, projectId)),
		database.delete(media).where(eq(media.projectId, projectId)),
		database.delete(transcript).where(eq(transcript.projectId, projectId)),
		database.delete(project).where(ownedProjectFilter(userId, projectId))
	]);

	return { ok: true };
}
