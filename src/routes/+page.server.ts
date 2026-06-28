import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { loadDashboardProjects } from '$lib/server/dashboard-load';
import { event } from '$lib/server/log';
import { deleteOwnedProject, renameOwnedProject } from '$lib/server/project-mutations';
import { resolveSidebarUser } from '$lib/server/sidebar-user';
import { resolveStorageUsage } from '$lib/server/storage-usage';
import type { Actions, PageServerLoad } from './$types';

function requireUser(locals: App.Locals) {
	if (!locals.user) throw redirect(302, '/login');
	return locals.user;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const [{ latestProject, projects }, usage] = await Promise.all([
		loadDashboardProjects(db, locals.user.id),
		resolveStorageUsage(db, locals.user.id)
	]);

	return {
		user: resolveSidebarUser(locals.user),
		usage,
		projects,
		latestProject
	};
};

export const actions: Actions = {
	rename: async ({ locals, request }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const projectId = formData.get('projectId')?.toString() ?? '';
		const title = formData.get('title')?.toString() ?? '';

		if (!projectId) {
			return fail(400, { message: 'Project is required' });
		}

		const result = await renameOwnedProject(db, user.id, projectId, title);
		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		return { success: true };
	},

	delete: async ({ locals, request }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const projectId = formData.get('projectId')?.toString() ?? '';

		if (!projectId) {
			return fail(400, { message: 'Project is required' });
		}

		const result = await deleteOwnedProject(db, user.id, projectId);
		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		event(locals.log, 'project.deleted', {
			actorId: user.id,
			target: { type: 'project', id: projectId }
		});

		return { success: true };
	}
};
