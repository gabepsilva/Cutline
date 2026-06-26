import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/jobs/job-store', () => ({
	requestJobCancel: vi.fn()
}));

import { requestJobCancel } from '$lib/server/jobs/job-store';
import { POST } from './+server';

const mockedCancel = vi.mocked(requestJobCancel);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/jobs/[id]/cancel POST', () => {
	it('cancels a job for the signed-in owner', async () => {
		mockedCancel.mockResolvedValueOnce(null);

		const response = await POST({
			params: { id: 'job-1' },
			locals: { user: authUser }
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(mockedCancel).toHaveBeenCalledWith({}, authUser.id, 'job-1');
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			POST({
				params: { id: 'job-1' },
				locals: {}
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 401 });
	});

	it('returns 404 when cancel rejects ownership', async () => {
		mockedCancel.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Job not found'
		});

		await expect(
			POST({
				params: { id: 'job-1' },
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});
