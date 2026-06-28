import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/storage/media-upload', () => ({
	initProjectMediaUpload: vi.fn(),
	parseInitUploadUrlBody: vi.fn()
}));

import { initProjectMediaUpload, parseInitUploadUrlBody } from '$lib/server/storage/media-upload';
import { POST } from './+server';

const mockedParse = vi.mocked(parseInitUploadUrlBody);
const mockedInit = vi.mocked(initProjectMediaUpload);

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
	return { locals: { user: authUser, requestId: 'req-test', log }, lines };
}

describe('api/projects/media/upload-url POST', () => {
	it('creates a project and returns presigned upload data', async () => {
		mockedParse.mockReturnValueOnce({
			title: 'My demo',
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});
		mockedInit.mockResolvedValueOnce({
			projectId: 'proj-new',
			mediaId: 'media-1',
			contentType: 'video/mp4',
			upload: { mode: 'single', url: 'https://r2/put', objectKey: 'key' }
		});

		const { locals, lines } = testLocals();
		const response = await POST({
			request: new Request('http://localhost/api/projects/media/upload-url', {
				method: 'POST',
				body: JSON.stringify({
					title: 'My demo',
					filename: 'clip.mp4',
					contentType: 'video/mp4',
					size: 1024
				})
			}),
			locals
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			projectId: 'proj-new',
			mediaId: 'media-1',
			contentType: 'video/mp4',
			upload: { mode: 'single', url: 'https://r2/put', objectKey: 'key' }
		});
		expect(mockedInit).toHaveBeenCalledWith(
			{},
			authUser.id,
			expect.objectContaining({ title: 'My demo', filename: 'clip.mp4' })
		);
		expect(lines[0]).toMatchObject({
			event: 'project.created',
			actorId: authUser.id,
			target: { type: 'project', id: 'proj-new' },
			msg: 'event'
		});
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			POST({
				request: new Request('http://localhost/api/projects/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({})
				}),
				locals: {}
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 401 });
	});

	it('returns 400 for invalid title', async () => {
		mockedParse.mockReturnValueOnce({
			title: '   ',
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});

		await expect(
			POST({
				request: new Request('http://localhost/api/projects/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({
						title: '   ',
						filename: 'clip.mp4',
						contentType: 'video/mp4',
						size: 1024
					})
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 413 for oversize uploads', async () => {
		mockedParse.mockReturnValueOnce({
			ok: false,
			status: 413,
			message: 'File exceeds the 5 GB upload limit'
		});

		await expect(
			POST({
				request: new Request('http://localhost/api/projects/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({ title: 'Demo', filename: 'big.mp4', size: 999 })
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 413 });
	});

	it('returns 400 for invalid JSON', async () => {
		await expect(
			POST({
				request: new Request('http://localhost/api/projects/media/upload-url', {
					method: 'POST',
					body: 'not-json'
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});

	it('returns 500 when init upload fails', async () => {
		mockedParse.mockReturnValueOnce({
			title: 'Demo',
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});
		mockedInit.mockRejectedValueOnce(new Error('R2 credentials are not configured'));

		await expect(
			POST({
				request: new Request('http://localhost/api/projects/media/upload-url', {
					method: 'POST',
					body: JSON.stringify({
						title: 'Demo',
						filename: 'clip.mp4',
						contentType: 'video/mp4',
						size: 1024
					})
				}),
				locals: { user: authUser }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 500 });
	});
});
