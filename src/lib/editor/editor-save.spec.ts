import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import { createEditorAutosave, editorSaveMeta } from '$lib/editor/editor-save';

describe('editorSaveMeta', () => {
	it('maps save status to top-bar labels', () => {
		expect(editorSaveMeta('idle', 'Auto-saved')).toBe('Auto-saved');
		expect(editorSaveMeta('saving', 'Auto-saved')).toBe('Saving…');
		expect(editorSaveMeta('saved', 'Auto-saved')).toBe('Saved');
		expect(editorSaveMeta('error', 'Auto-saved')).toBe('Save failed');
	});
});

describe('createEditorAutosave', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('debounces rapid edits into a single PUT with the final payload', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		const statuses: string[] = [];

		const autosave = createEditorAutosave({
			delayMs: 1_000,
			fetchFn,
			onStatus: (status) => statuses.push(status)
		});

		autosave.schedule('proj-1', {
			words: fixtureTranscriptWords,
			captionStyle: 'karaoke'
		});
		autosave.schedule('proj-1', {
			words: fixtureTranscriptWords.map((word) =>
				word.id === 'w2' ? { ...word, deleted: true } : word
			),
			captionStyle: 'clean'
		});

		await vi.advanceTimersByTimeAsync(999);
		expect(fetchFn).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		await Promise.resolve();

		expect(fetchFn).toHaveBeenCalledTimes(1);
		expect(fetchFn).toHaveBeenCalledWith('/projects/proj-1', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				words: fixtureTranscriptWords.map((word) =>
					word.id === 'w2' ? { ...word, deleted: true } : word
				),
				captionStyle: 'clean'
			}),
			signal: expect.any(AbortSignal)
		});
		expect(statuses).toContain('saving');
		expect(statuses.at(-1)).toBe('saved');

		autosave.dispose();
	});

	it('surfaces save failures', async () => {
		const fetchFn = vi.fn().mockResolvedValue(new Response('nope', { status: 500 }));
		const statuses: string[] = [];

		const autosave = createEditorAutosave({
			delayMs: 10,
			fetchFn,
			onStatus: (status) => statuses.push(status)
		});

		autosave.flush('proj-1', {
			words: fixtureTranscriptWords,
			captionStyle: 'karaoke'
		});

		await Promise.resolve();
		expect(statuses.at(-1)).toBe('error');

		autosave.dispose();
	});
});
