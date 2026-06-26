import { error, redirect } from '@sveltejs/kit';
import { loadEditorProject } from '$lib/server/editor-project-load';
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const data = await loadEditorProject(db, locals.user, params.id);
	if (!data) error(404, 'Project not found');

	return data;
};
