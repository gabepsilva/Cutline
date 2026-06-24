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
	latestProject: mockLatestProject,
	projects: mockProjects,
	editorTitle: mockLatestProject.title,
	editorMeta: 'Auto-saved · MP4 1080p'
});
