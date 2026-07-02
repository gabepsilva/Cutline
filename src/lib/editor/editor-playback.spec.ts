import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startEditorPlaybackLoop } from './editor-playback';
import { EditorState } from './editor-state.svelte';
import { fixtureSentence, fixtureTranscriptWords } from '$lib/test/fixtures';

function createEditor() {
	return new EditorState({
		words: fixtureTranscriptWords.map((w) => ({ ...w })),
		sentences: [
			{
				...fixtureSentence,
				words: fixtureTranscriptWords.map((w) => ({ ...w }))
			}
		]
	});
}

describe('startEditorPlaybackLoop', () => {
	let rafCallbacks: FrameRequestCallback[] = [];
	let rafId = 0;

	beforeEach(() => {
		rafCallbacks = [];
		rafId = 0;
		vi.stubGlobal(
			'requestAnimationFrame',
			vi.fn((cb: FrameRequestCallback) => {
				rafCallbacks.push(cb);
				rafId += 1;
				return rafId;
			})
		);
		vi.stubGlobal('cancelAnimationFrame', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('advances editor time while playing', () => {
		const editor = createEditor();
		editor.playing = true;
		startEditorPlaybackLoop(editor);

		rafCallbacks[0]?.(0);
		rafCallbacks[1]?.(100);

		expect(editor.currentTime).toBeCloseTo(0.1, 5);
	});

	it('does not advance editor time when paused', () => {
		const editor = createEditor();
		startEditorPlaybackLoop(editor);

		rafCallbacks[0]?.(0);
		rafCallbacks[1]?.(50);

		expect(editor.currentTime).toBe(0);
	});

	it('stops scheduling frames after cleanup', () => {
		const editor = createEditor();
		const stop = startEditorPlaybackLoop(editor);
		stop();

		expect(cancelAnimationFrame).toHaveBeenCalled();
	});

	it('does not advance when video clock drive is active (#214)', () => {
		const editor = createEditor();
		editor.playing = true;
		editor.videoClockDrive = true;
		startEditorPlaybackLoop(editor);

		rafCallbacks[0]?.(0);
		rafCallbacks[1]?.(100);

		expect(editor.currentTime).toBe(0);
	});
});
