import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/storage/media-upload', () => ({
	createMediaUploadUrl: vi.fn(),
	parseUploadUrlBody: vi.fn()
}));

import { createMediaUploadUrl, parseUploadUrlBody } from '$lib/server/storage/media-upload';
import { POST } from './+server';

const mockedParse = vi.mocked(parseUploadUrlBody);
const mockedCreate = vi.mocked(createMediaUploadUrl);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/projects/[projectId]/media/upload-url POST', () => {
	it('returns presigned upload data for the owner', async () => {
		mockedParse.mockReturnValueOnce({
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});
		mockedCreate.mockResolvedValueOnce({
			mediaId: 'media-1',
			upload: { mode: 'single', url: 'https://r2/put', objectKey: 'key' }
		});

		const response = await POST({
			params: { projectId: 'proj-1' },
			request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
				method: 'POST',
				body: JSON.stringify({ filename: 'clip.mp4', contentType: 'video/mp4', size: 1024 })
			}),
			locals: { user: authUser }
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			mediaId: 'media-1',
			upload: { mode: 'single', url: 'https://r2/put', objectKey: 'key' }
		});
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
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
				request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
					method: 'POST',
					body: 'not-json'
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 404 when project is not owned', async () => {
		mockedParse.mockReturnValueOnce({
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});
		mockedCreate.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Project not found'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({ filename: 'clip.mp4', contentType: 'video/mp4', size: 1024 })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('returns 413 for oversize uploads', async () => {
		mockedParse.mockReturnValueOnce({
			ok: false,
			status: 413,
			message: 'File exceeds the 5 GB upload limit'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({ filename: 'big.mp4', contentType: 'video/mp4', size: 999 })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 413 });
	});

	it('returns 500 when presign fails', async () => {
		mockedParse.mockReturnValueOnce({
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});
		mockedCreate.mockRejectedValueOnce(new Error('R2 credentials are not configured'));

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({ filename: 'clip.mp4', contentType: 'video/mp4', size: 1024 })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 500 });
	});

	it('returns 415 for unsupported content types', async () => {
		mockedParse.mockReturnValueOnce({
			ok: false,
			status: 415,
			message: 'Unsupported content type'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				request: new Request('http://localhost/api/projects/proj-1/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({ filename: 'clip.avi', contentType: 'video/x-msvideo', size: 1 })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 415 });
	});
});
