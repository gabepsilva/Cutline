import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorState } from './editor-state.svelte';
import { startRecordCountdown, startRecordingElapsed } from './record-flow';
import { fixtureTranscriptWords } from '$lib/test/fixtures';

function createEditor() {
	return new EditorState({
		words: fixtureTranscriptWords.map((word) => ({ ...word })),
		sentences: []
	});
}

describe('record-flow', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('startRecordCountdown advances countdown until recording starts', () => {
		const editor = createEditor();
		editor.beginRecording();

		const stop = startRecordCountdown(editor);
		vi.advanceTimersByTime(3000);

		expect(editor.recordPhase).toBe('recording');
		expect(editor.recElapsed).toBe(0);

		stop();
	});

	it('startRecordingElapsed increments recElapsed while recording', () => {
		const editor = createEditor();
		editor.beginRecording();
		editor.advanceCountdown();
		editor.advanceCountdown();
		editor.advanceCountdown();

		const stop = startRecordingElapsed(editor);
		vi.advanceTimersByTime(500);

		expect(editor.recElapsed).toBeCloseTo(0.5, 1);

		stop();
	});
});
