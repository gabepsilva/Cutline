import {
	mockLatestProject,
	mockProjects,
	mockStorageUsage,
	mockUser
} from '$lib/mocks/dashboard.mock';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	user: mockUser,
	usage: mockStorageUsage,
	projects: mockProjects,
	latestProject: mockLatestProject
});
