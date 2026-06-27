import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMediaAssets, loadIngestAssets, pollIngestAssets } from '$lib/editor/ingest-assets';

describe('ingest-assets', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('fetchMediaAssets loads asset URLs from the API', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					status: 'ready',
					transcodeUrl: 'https://cdn.example/transcode.mp4',
					waveformUrl: null,
					filmstripUrl: null,
					filmstripMetaUrl: null
				}),
				{ status: 200 }
			)
		);
		vi.stubGlobal('fetch', fetchMock);

		const result = await fetchMediaAssets('proj-1', 'media-1');

		expect(fetchMock).toHaveBeenCalledWith('/api/projects/proj-1/media/media-1/assets');
		expect(result.status).toBe('ready');
	});

	it('loadIngestAssets fetches waveform and filmstrip metadata when present', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						status: 'ingesting',
						transcodeUrl: null,
						waveformUrl: 'https://cdn.example/wave.json',
						filmstripUrl: 'https://cdn.example/film.jpg',
						filmstripMetaUrl: 'https://cdn.example/film.json'
					}),
					{ status: 200 }
				)
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ bars: [1, 2, 3], duration: 10 }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ frameCount: 12, frameWidth: 80 }), { status: 200 })
			);
		vi.stubGlobal('fetch', fetchMock);

		const result = await loadIngestAssets('proj-1', 'media-1');

		expect(result).toEqual({
			mediaId: 'media-1',
			status: 'ingesting',
			transcodeUrl: null,
			waveform: { bars: [1, 2, 3], duration: 10 },
			filmstripUrl: 'https://cdn.example/film.jpg',
			filmstripMeta: { frameCount: 12, frameWidth: 80 }
		});
	});

	it('pollIngestAssets stops when media becomes ready', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					status: 'ready',
					transcodeUrl: 'https://cdn.example/transcode.mp4',
					waveformUrl: null,
					filmstripUrl: null,
					filmstripMetaUrl: null
				}),
				{ status: 200 }
			)
		);
		vi.stubGlobal('fetch', fetchMock);

		const updates: string[] = [];
		const stop = pollIngestAssets('proj-1', 'media-1', (state) => {
			updates.push(state.status);
		});

		await vi.runAllTimersAsync();
		stop();

		expect(updates).toContain('ready');
	});
});
