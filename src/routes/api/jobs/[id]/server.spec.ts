import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/jobs/job-store', () => ({
	getOwnedJobStatus: vi.fn()
}));

import { getOwnedJobStatus } from '$lib/server/jobs/job-store';
import { GET } from './+server';

const mockedStatus = vi.mocked(getOwnedJobStatus);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/jobs/[id] GET', () => {
	it('returns job status for the owner', async () => {
		mockedStatus.mockResolvedValueOnce({
			ok: true,
			data: { status: 'running', progress: 0.5 }
		});

		const response = await GET({
			params: { id: 'job-1' },
			locals: { user: authUser }
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: 'running', progress: 0.5 });
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			GET({
				params: { id: 'job-1' },
				locals: {}
			} as Parameters<typeof GET>[0])
		).rejects.toMatchObject({ status: 401 });
	});

	it('returns 404 when the job is not owned', async () => {
		mockedStatus.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Project not found'
		});

		await expect(
			GET({
				params: { id: 'job-1' },
				locals: { user: authUser }
			} as Parameters<typeof GET>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});
