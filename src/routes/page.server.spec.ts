import { beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
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

vi.mock('$lib/server/project-mutations', () => ({
	renameOwnedProject: vi.fn(),
	deleteOwnedProject: vi.fn()
}));

import { loadDashboardProjects } from '$lib/server/dashboard-load';
import { resolveStorageUsage } from '$lib/server/storage-usage';
import { deleteOwnedProject, renameOwnedProject } from '$lib/server/project-mutations';
import { load, actions } from './+page.server';

const mockedLoadDashboardProjects = vi.mocked(loadDashboardProjects);
const mockedResolveStorageUsage = vi.mocked(resolveStorageUsage);
const mockedRenameOwnedProject = vi.mocked(renameOwnedProject);
const mockedDeleteOwnedProject = vi.mocked(deleteOwnedProject);

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

function createActionEvent(
	action: 'rename' | 'delete',
	fields: Record<string, string> = {},
	locals: Partial<App.Locals> = { user: authUser }
) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}

	const lines: Record<string, unknown>[] = [];
	const log = pino({ level: 'info' }, { write: (s: string) => lines.push(JSON.parse(s)) });

	return {
		request: new Request(`http://localhost/?/${action}`, { method: 'POST', body: formData }),
		locals: {
			...locals,
			requestId: 'req-delete-test',
			log
		},
		lines
	};
}

describe('+page.server actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rename returns validation failures from the mutation layer', async () => {
		mockedRenameOwnedProject.mockResolvedValueOnce({
			ok: false,
			status: 400,
			message: 'Title is required'
		});

		const { request, locals } = createActionEvent('rename', { projectId: 'proj-1', title: '   ' });
		const result = await actions.rename?.({ request, locals } as Parameters<
			NonNullable<typeof actions.rename>
		>[0]);

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Title is required' }
		});
	});

	it('rename succeeds for owned projects', async () => {
		mockedRenameOwnedProject.mockResolvedValueOnce({ ok: true });

		const { request, locals } = createActionEvent('rename', {
			projectId: 'proj-1',
			title: 'Renamed'
		});
		const result = await actions.rename?.({ request, locals } as Parameters<
			NonNullable<typeof actions.rename>
		>[0]);

		expect(result).toEqual({ success: true });
	});

	it('delete returns 404 when the project is not owned', async () => {
		mockedDeleteOwnedProject.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Project not found'
		});

		const { request, locals } = createActionEvent('delete', { projectId: 'proj-1' });
		const result = await actions.delete?.({ request, locals } as Parameters<
			NonNullable<typeof actions.delete>
		>[0]);

		expect(result).toMatchObject({
			status: 404,
			data: { message: 'Project not found' }
		});
	});

	it('delete emits project.deleted for owned projects', async () => {
		mockedDeleteOwnedProject.mockResolvedValueOnce({ ok: true });

		const { request, locals, lines } = createActionEvent('delete', { projectId: 'proj-1' });
		const result = await actions.delete?.({ request, locals } as Parameters<
			NonNullable<typeof actions.delete>
		>[0]);

		expect(result).toEqual({ success: true });
		expect(lines[0]).toMatchObject({
			event: 'project.deleted',
			actorId: authUser.id,
			target: { type: 'project', id: 'proj-1' },
			causationId: 'req-delete-test',
			msg: 'event'
		});
	});

	it('rejects unauthenticated mutations with redirect to login', async () => {
		const { request, locals } = createActionEvent(
			'rename',
			{ projectId: 'proj-1', title: 'x' },
			{}
		);
		try {
			await actions.rename?.({ request, locals } as Parameters<
				NonNullable<typeof actions.rename>
			>[0]);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/login' });
		}
	});
});
