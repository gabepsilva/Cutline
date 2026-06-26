import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '$lib/types/project';
import type { StorageUsage } from '$lib/types/storage';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/dashboard-load', () => ({
	loadDashboardProjects: vi.fn()
}));

vi.mock('$lib/server/storage-usage', () => ({
	resolveStorageUsage: vi.fn()
}));

import { loadDashboardProjects } from '$lib/server/dashboard-load';
import { resolveStorageUsage } from '$lib/server/storage-usage';
import { load } from './+page.server';

const mockedLoadDashboardProjects = vi.mocked(loadDashboardProjects);
const mockedResolveStorageUsage = vi.mocked(resolveStorageUsage);

const authUser = {
	id: 'user-jordan',
	name: 'Jordan Lee',
	email: 'jordan@example.com',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

const latestProject: Project = {
	id: 'proj-hero',
	title: 'How I edit videos 3x faster',
	durationLabel: '4:32',
	kind: 'TALKING HEAD',
	meta: 'Edited 2h ago',
	thumb: 'thumb-hero'
};

const gridProject: Project = {
	id: 'proj-grid',
	title: 'Q3 launch recap',
	durationLabel: '7:18',
	kind: 'WEBINAR',
	meta: 'Edited 1d ago',
	thumb: 'thumb-grid'
};

const usage: StorageUsage = {
	percentUsed: 12,
	usageLabel: '7 GB of 60 GB used'
};

describe('+page.server load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns dashboard data for an authenticated user', async () => {
		mockedLoadDashboardProjects.mockResolvedValueOnce({
			latestProject,
			projects: [gridProject]
		});
		mockedResolveStorageUsage.mockResolvedValueOnce(usage);

		const data = await load({
			locals: { user: authUser }
		} as Parameters<typeof load>[0]);

		expect(data).toBeDefined();
		if (!data) throw new Error('expected load data');

		expect(mockedLoadDashboardProjects).toHaveBeenCalledWith({}, authUser.id);
		expect(mockedResolveStorageUsage).toHaveBeenCalledWith({}, authUser.id);
		expect(data.user).toMatchObject({
			id: 'user-jordan',
			name: 'Jordan Lee',
			initials: 'JL',
			planLabel: 'Free plan'
		});
		expect(data.usage).toEqual(usage);
		expect(data.latestProject).toEqual(latestProject);
		expect(data.projects).toEqual([gridProject]);
	});

	it('redirects unauthenticated visitors to login', async () => {
		try {
			await load({
				locals: {}
			} as Parameters<typeof load>[0]);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/login' });
		}

		expect(mockedLoadDashboardProjects).not.toHaveBeenCalled();
		expect(mockedResolveStorageUsage).not.toHaveBeenCalled();
	});
});
