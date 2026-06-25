import { error } from '@sveltejs/kit';
import { loadMockEditorProject } from '$lib/mocks/editor.mock';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const data = loadMockEditorProject(params.id);
	if (!data) error(404, 'Project not found');
	return data;
};
