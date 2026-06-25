import { mockLatestProject, mockProjects } from '$lib/mocks/dashboard.mock';
import { resolveSidebarUser } from '$lib/server/sidebar-user';
import { resolveStorageUsage } from '$lib/server/storage-usage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	user: resolveSidebarUser(locals.user),
	usage: resolveStorageUsage(),
	projects: mockProjects,
	latestProject: mockLatestProject
});
