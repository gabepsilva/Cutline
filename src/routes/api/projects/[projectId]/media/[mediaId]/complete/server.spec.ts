import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/storage/media-upload', () => ({
	completeMediaUpload: vi.fn(),
	parseCompleteUploadBody: vi.fn()
}));

vi.mock('$lib/server/jobs/worker', () => ({
	kickWorker: vi.fn()
}));

import { completeMediaUpload, parseCompleteUploadBody } from '$lib/server/storage/media-upload';
import { kickWorker } from '$lib/server/jobs/worker';
import { POST } from './+server';

const mockedParse = vi.mocked(parseCompleteUploadBody);
const mockedComplete = vi.mocked(completeMediaUpload);
const mockedKick = vi.mocked(kickWorker);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/projects/[projectId]/media/[mediaId]/complete POST', () => {
	it('completes upload and kicks the worker', async () => {
		mockedParse.mockReturnValueOnce({});
		mockedComplete.mockResolvedValueOnce({ ok: true, jobId: 'job-1' });

		const response = await POST({
			params: { projectId: 'proj-1', mediaId: 'media-1' },
			request: new Request('http://localhost/api/projects/proj-1/media/media-1/complete', {
				method: 'POST',
				body: JSON.stringify({})
			}),
			locals: { user: authUser }
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ jobId: 'job-1' });
		expect(mockedComplete).toHaveBeenCalledWith({}, authUser.id, 'proj-1', 'media-1', {});
		expect(mockedKick).toHaveBeenCalledWith({});
	});

	it('returns 404 when media is missing', async () => {
		mockedParse.mockReturnValueOnce({});
		mockedComplete.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Media not found'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1', mediaId: 'missing' },
				request: new Request('http://localhost/api/projects/proj-1/media/missing/complete', {
					method: 'POST',
					body: JSON.stringify({})
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});
