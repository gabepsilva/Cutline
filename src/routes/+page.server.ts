import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { loadDashboardProjects } from '$lib/server/dashboard-load';
import { resolveSidebarUser } from '$lib/server/sidebar-user';
import { resolveStorageUsage } from '$lib/server/storage-usage';
import type { PageServerLoad } from './$types';

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
