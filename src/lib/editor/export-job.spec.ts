import { describe, expect, it, vi, afterEach } from 'vitest';
import { EditorState } from './editor-state.svelte';
import { exportFilename, startExportJob } from './export-job';
import { fixtureTranscriptWords } from '$lib/test/fixtures';

function createEditor() {
	return new EditorState({
		words: fixtureTranscriptWords.map((word) => ({ ...word })),
		sentences: []
	});
}

describe('export-job', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('startExportJob polls until the export job succeeds', async () => {
		const editor = createEditor();
		editor.runExport();

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 'job-1' })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ status: 'succeeded', progress: 1 })
			});

		vi.stubGlobal('fetch', fetchMock);

		const stop = startExportJob(editor, 'proj-1', {
			format: 'mp4',
			resolution: '1080p',
			burnCaptions: true
		});

		await vi.waitFor(() => {
			expect(editor.exportPhase).toBe('done');
		});

		expect(editor.exportProgress).toBe(1);
		expect(fetchMock).toHaveBeenCalledWith('/api/projects/proj-1/jobs', expect.any(Object));
		stop();
	});

	it('startExportJob closes export when the job fails', async () => {
		const editor = createEditor();
		editor.runExport();

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 'job-1' })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ status: 'failed', progress: 0.2, error: 'render failed' })
			});

		vi.stubGlobal('fetch', fetchMock);

		const stop = startExportJob(editor, 'proj-1', {
			format: 'mp4',
			resolution: '1080p',
			burnCaptions: true
		});

		await vi.waitFor(() => {
			expect(editor.exportPhase).toBe('none');
		});

		stop();
	});

	it('startExportJob closes export when enqueue fails', async () => {
		const editor = createEditor();
		editor.runExport();

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce({
				ok: false,
				status: 500
			})
		);

		const stop = startExportJob(editor, 'proj-1', {
			format: 'mp4',
			resolution: '1080p',
			burnCaptions: true
		});

		await vi.waitFor(() => {
			expect(editor.exportPhase).toBe('none');
		});

		stop();
	});

	it('exportFilename slugifies the project title', () => {
		expect(exportFilename('How I edit videos 3x faster', 'mp4')).toBe(
			'how-i-edit-videos-3x-faster.mp4'
		);
	});
});
