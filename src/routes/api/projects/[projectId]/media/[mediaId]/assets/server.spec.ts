import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/storage/media-assets', () => ({
	getMediaAssetUrls: vi.fn()
}));

import { getMediaAssetUrls } from '$lib/server/storage/media-assets';
import { GET } from './+server';

const mockedGetMediaAssetUrls = vi.mocked(getMediaAssetUrls);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/projects/[projectId]/media/[mediaId]/assets GET', () => {
	it('returns asset URLs for the owner', async () => {
		mockedGetMediaAssetUrls.mockResolvedValueOnce({
			mediaId: 'media-1',
			status: 'ready',
			transcodeUrl: 'https://cdn.example/transcode.mp4',
			waveformUrl: null,
			filmstripUrl: null,
			filmstripMetaUrl: null
		});

		const response = await GET({
			params: { projectId: 'proj-1', mediaId: 'media-1' },
			locals: { user: authUser }
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			mediaId: 'media-1',
			status: 'ready',
			transcodeUrl: 'https://cdn.example/transcode.mp4',
			waveformUrl: null,
			filmstripUrl: null,
			filmstripMetaUrl: null
		});
	});

	it('returns 401 when unauthenticated', async () => {
		try {
			await GET({
				params: { projectId: 'proj-1', mediaId: 'media-1' },
				locals: {}
			} as Parameters<typeof GET>[0]);
			expect.unreachable('expected error');
		} catch (error) {
			expect(error).toMatchObject({ status: 401 });
		}
	});
});
