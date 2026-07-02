import { describe, expect, it } from 'vitest';
import { EditorState } from './editor-state.svelte';
import { fixtureSentence, fixtureTranscriptWords } from '$lib/test/fixtures';
import { totalDuration } from './editor-derive';

function createEditor(overrides: Partial<ConstructorParameters<typeof EditorState>[0]> = {}) {
	return new EditorState({
		words: fixtureTranscriptWords.map((w) => ({ ...w })),
		sentences: [
			{
				...fixtureSentence,
				words: fixtureTranscriptWords.map((w) => ({ ...w }))
			}
		],
		...overrides
	});
}

describe('EditorState', () => {
	it('starts paused at time zero', () => {
		const editor = createEditor();
		expect(editor.playing).toBe(false);
		expect(editor.currentTime).toBe(0);
		expect(editor.timecode).toBe('0:00');
	});

	it('toggles playback and rewinds when at the end', () => {
		const editor = createEditor();
		editor.currentTime = editor.duration;
		editor.togglePlay();
		expect(editor.playing).toBe(true);
		expect(editor.currentTime).toBe(0);
	});

	it('seeks within duration and clamps past the end', () => {
		const editor = createEditor();
		editor.seek(0.5);
		expect(editor.currentTime).toBe(0.5);
		editor.seek(editor.duration + 100);
		expect(editor.currentTime).toBe(editor.duration);
	});

	it('seeks from a timeline lane click', () => {
		const editor = createEditor();
		const target = {
			getBoundingClientRect: () => ({ left: 0, width: 200 })
		};
		const event = {
			currentTarget: target,
			clientX: 100
		} as unknown as MouseEvent;

		editor.seekFromTimelineClick(event);

		expect(editor.currentTime).toBeCloseTo(editor.duration / 2, 5);
	});

	it('advances time while playing and stops at the end', () => {
		const editor = createEditor();
		editor.playing = true;
		editor.currentTime = editor.duration - 0.01;
		editor.tick(0.05);
		expect(editor.currentTime).toBe(editor.duration);
		expect(editor.playing).toBe(false);
	});

	it('does not advance time when paused', () => {
		const editor = createEditor();
		editor.tick(1);
		expect(editor.currentTime).toBe(0);
	});

	it('selects a word and seeks to its start', () => {
		const editor = createEditor();
		const word = editor.words[1]!;
		editor.selectWord(word);
		expect(editor.selectedId).toBe('w1');
		expect(editor.currentTime).toBeCloseTo(editor.startMap.w1! + 0.0005, 5);
	});

	it('restores a deleted word when clicked', () => {
		const editor = createEditor();
		editor.selectedId = 'w2';
		editor.deleteSelected();
		expect(editor.words.find((w) => w.id === 'w2')?.deleted).toBe(true);

		const deleted = editor.words.find((w) => w.id === 'w2')!;
		editor.selectWord(deleted);
		expect(editor.words.find((w) => w.id === 'w2')?.deleted).toBe(false);
		expect(editor.selectedId).toBe('w2');
	});

	it('toggles delete on the selected word', () => {
		const editor = createEditor();
		editor.selectedId = 'w1';
		editor.deleteSelected();
		expect(editor.words.find((w) => w.id === 'w1')?.deleted).toBe(true);
		editor.deleteSelected();
		expect(editor.words.find((w) => w.id === 'w1')?.deleted).toBe(false);
	});

	it('uses sequence duration when provided instead of transcript EDL length', () => {
		const editor = createEditor({ sequenceDurationSeconds: 90 });
		expect(editor.duration).toBe(90);
	});

	it('soft-deletes all filler words', () => {
		const editor = createEditor();
		editor.removeFillers();
		expect(editor.words.find((w) => w.id === 'w2')?.deleted).toBe(true);
		expect(editor.fillerCount).toBe(0);
		expect(editor.duration).toBeLessThan(totalDuration(fixtureTranscriptWords));
	});

	it('keeps sentences in sync when words change', () => {
		const editor = createEditor();
		editor.selectedId = 'w2';
		editor.deleteSelected();
		expect(editor.sentences[0]?.words.find((w) => w.id === 'w2')?.deleted).toBe(true);
	});

	it('seeks to the first active word in a sentence', () => {
		const editor = createEditor();
		editor.seekSentence(editor.sentences[0]!);
		expect(editor.currentTime).toBeCloseTo(editor.startMap.w0! + 0.0005, 5);
	});

	it('jumps to start and end', () => {
		const editor = createEditor();
		editor.seek(1);
		editor.toStart();
		expect(editor.currentTime).toBe(0);
		editor.toEnd();
		expect(editor.currentTime).toBe(editor.duration);
		expect(editor.playing).toBe(false);
	});

	it('tracks export phase transitions', () => {
		const editor = createEditor();
		editor.startExport();
		expect(editor.exportPhase).toBe('config');
		editor.runExport();
		expect(editor.exportPhase).toBe('exporting');
		editor.setExportProgress(1);
		expect(editor.exportPhase).toBe('exporting');
		editor.markExportDone();
		expect(editor.exportPhase).toBe('done');
		editor.closeExport();
		expect(editor.exportPhase).toBe('none');
		expect(editor.exportProgress).toBe(0);
	});

	it('adds a recording to resources on stop', () => {
		const editor = createEditor();
		editor.openRecord();
		editor.beginRecording();
		editor.recElapsed = 4.2;
		editor.stopRecording();
		expect(editor.recordPhase).toBe('review');
		expect(editor.resources[0]?.kind).toBe('Recording');
		expect(editor.lastResId).toBe(editor.resources[0]?.id);
	});

	it('drops an overlay at the current playhead', () => {
		const editor = createEditor();
		const resource = {
			id: 'r-test',
			name: 'Test clip',
			dur: 3,
			kind: 'B-roll' as const,
			thumb: 'linear-gradient(#000,#111)'
		};
		editor.seek(0.75);
		editor.addOverlay(resource);
		expect(editor.overlays).toHaveLength(1);
		expect(editor.overlays[0]?.start).toBe(0.75);
		expect(editor.showMedia).toBe(false);
	});

	it('toggles media shelf visibility', () => {
		const editor = createEditor();
		expect(editor.showMedia).toBe(false);
		editor.toggleMedia();
		expect(editor.showMedia).toBe(true);
	});

	it('adds the last recording to the timeline and closes review', () => {
		const editor = createEditor();
		editor.openRecord();
		editor.beginRecording();
		editor.stopRecording();
		editor.addLastToTimeline();
		expect(editor.overlays).toHaveLength(1);
		expect(editor.recordPhase).toBe('none');
	});

	it('removes overlays by id', () => {
		const editor = createEditor();
		const resource = {
			id: 'r-test',
			name: 'Test clip',
			dur: 3,
			kind: 'B-roll' as const,
			thumb: 'linear-gradient(#000,#111)'
		};
		editor.addOverlay(resource);
		const overlayId = editor.overlays[0]!.id;
		editor.removeOverlay(overlayId);
		expect(editor.overlays).toHaveLength(0);
	});

	it('updates search query and caption visibility', () => {
		const editor = createEditor();
		editor.setQuery('okay');
		expect(editor.query).toBe('okay');
		expect(editor.showCaptions).toBe(true);
		editor.toggleCaptions();
		expect(editor.showCaptions).toBe(false);
	});

	it('counts down before recording starts', () => {
		const editor = createEditor();
		editor.beginRecording();
		expect(editor.recCount).toBe(3);
		editor.advanceCountdown();
		expect(editor.recCount).toBe(2);
		editor.advanceCountdown();
		editor.advanceCountdown();
		expect(editor.recordPhase).toBe('recording');
	});
});
