import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/jobs/job-store', () => ({
	enqueueOwnedJob: vi.fn(),
	parseEnqueueBody: vi.fn()
}));

vi.mock('$lib/server/jobs/worker', () => ({
	kickWorker: vi.fn()
}));

import { enqueueOwnedJob, parseEnqueueBody } from '$lib/server/jobs/job-store';
import { kickWorker } from '$lib/server/jobs/worker';
import { POST } from './+server';

const mockedParse = vi.mocked(parseEnqueueBody);
const mockedEnqueue = vi.mocked(enqueueOwnedJob);
const mockedKick = vi.mocked(kickWorker);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/projects/[projectId]/jobs POST', () => {
	it('enqueues a job for the signed-in owner', async () => {
		mockedParse.mockReturnValueOnce({
			ok: true,
			data: { type: 'export', projectId: '', payload: { format: 'mp4' } }
		});
		mockedEnqueue.mockResolvedValueOnce({ ok: true, jobId: 'job-1' });

		const response = await POST({
			params: { projectId: 'proj-1' },
			request: new Request('http://localhost/api/projects/proj-1/jobs', {
				method: 'POST',
				body: JSON.stringify({ type: 'export', payload: { format: 'mp4' } })
			}),
			locals: { user: authUser }
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ id: 'job-1' });
		expect(mockedEnqueue).toHaveBeenCalledWith({}, authUser.id, 'proj-1', 'export', {
			format: 'mp4'
		});
		expect(mockedKick).toHaveBeenCalledWith({});
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/jobs', {
					method: 'POST',
					body: JSON.stringify({})
				}),
				locals: {}
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 401 });
	});

	it('returns 400 for invalid JSON', async () => {
		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/jobs', {
					method: 'POST',
					body: 'not-json'
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 when body validation fails', async () => {
		mockedParse.mockReturnValueOnce({
			ok: false,
			status: 400,
			message: 'Invalid job type'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/jobs', {
					method: 'POST',
					body: JSON.stringify({ type: 'bad' })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 404 when enqueue rejects ownership', async () => {
		mockedParse.mockReturnValueOnce({
			ok: true,
			data: { type: 'export', projectId: '', payload: {} }
		});
		mockedEnqueue.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Project not found'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/jobs', {
					method: 'POST',
					body: JSON.stringify({ type: 'export', payload: {} })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});
