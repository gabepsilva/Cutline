import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';

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

function testLocals() {
	const lines: Record<string, unknown>[] = [];
	const log = pino({ level: 'info' }, { write: (s: string) => lines.push(JSON.parse(s)) });
	return {
		locals: {
			user: authUser,
			requestId: 'req-test',
			log
		},
		lines
	};
}

describe('api/projects/[projectId]/media/[mediaId]/complete POST', () => {
	it('returns 401 when unauthenticated', async () => {
		await expect(
			POST({
				params: { projectId: 'proj-1', mediaId: 'media-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/media-1/complete', {
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
				params: { projectId: 'proj-1', mediaId: 'media-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/media-1/complete', {
					method: 'POST',
					body: 'not-json'
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 when multipart payload is invalid', async () => {
		mockedParse.mockReturnValueOnce({
			ok: false,
			status: 400,
			message: 'multipart.parts is required'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1', mediaId: 'media-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/media-1/complete', {
					method: 'POST',
					body: JSON.stringify({ multipart: { uploadId: 'x', parts: [] } })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('completes upload and kicks the worker', async () => {
		mockedParse.mockReturnValueOnce({});
		mockedComplete.mockResolvedValueOnce({ ok: true, jobId: 'job-1' });

		const { locals, lines } = testLocals();
		const response = await POST({
			params: { projectId: 'proj-1', mediaId: 'media-1' },
			request: new Request('http://localhost/api/projects/proj-1/media/media-1/complete', {
				method: 'POST',
				body: JSON.stringify({})
			}),
			locals
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ jobId: 'job-1' });
		expect(mockedComplete).toHaveBeenCalledWith(
			{},
			authUser.id,
			'proj-1',
			'media-1',
			{},
			'req-test'
		);
		expect(mockedKick).toHaveBeenCalledWith({});
		expect(lines[0]).toMatchObject({
			event: 'media.upload.completed',
			actorId: authUser.id,
			target: { type: 'media', id: 'media-1' },
			causationId: 'req-test',
			jobId: 'job-1',
			msg: 'event'
		});
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
