import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorState } from './editor-state.svelte';
import { exportFilename, startMockExportJob } from './export-job';
import { fixtureTranscriptWords } from '$lib/test/fixtures';

function createEditor() {
	return new EditorState({
		words: fixtureTranscriptWords.map((word) => ({ ...word })),
		sentences: []
	});
}

describe('export-job', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('startMockExportJob advances export progress until done', () => {
		const editor = createEditor();
		editor.runExport();

		const stop = startMockExportJob(editor);

		for (let step = 0; step < 200 && editor.exportPhase !== 'done'; step++) {
			vi.advanceTimersByTime(40);
		}

		expect(editor.exportPhase).toBe('done');
		expect(editor.exportProgress).toBe(1);

		stop();
	});

	it('exportFilename slugifies the project title', () => {
		expect(exportFilename('How I edit videos 3x faster', 'mp4')).toBe(
			'how-i-edit-videos-3x-faster.mp4'
		);
	});
});
