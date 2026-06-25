import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '$lib/editor/editor-state.svelte';
import { fixtureSentence, fixtureTranscriptWords } from '$lib/test/fixtures';
import { render } from '$lib/test/render';
import TransportControlsHarness from './TransportControls.harness.svelte';

function createEditorState() {
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

describe('TransportControls.svelte', () => {
	it('renders transport group with timecode', async () => {
		render(TransportControlsHarness, { playing: false, current: 65, total: 272 });

		await expect
			.element(page.getByRole('group', { name: 'Transport controls' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('1:05')).toBeInTheDocument();
		await expect.element(page.getByText('4:32')).toBeInTheDocument();
	});

	it('shows Play label when paused', async () => {
		render(TransportControlsHarness, { playing: false });

		await expect.element(page.getByRole('button', { name: 'Play' })).toBeInTheDocument();
	});

	it('shows Pause label when playing', async () => {
		render(TransportControlsHarness, { playing: true });

		await expect.element(page.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
	});

	it('fires ontogglePlay on play button click', async () => {
		const ontogglePlay = vi.fn();
		render(TransportControlsHarness, { playing: false, ontogglePlay });

		await userEvent.click(page.getByRole('button', { name: 'Play' }));

		expect(ontogglePlay).toHaveBeenCalledOnce();
	});

	it('fires ontoStart and ontoEnd on skip buttons', async () => {
		const ontoStart = vi.fn();
		const ontoEnd = vi.fn();
		render(TransportControlsHarness, { ontoStart, ontoEnd });

		await userEvent.click(page.getByRole('button', { name: 'Skip to start' }));
		await userEvent.click(page.getByRole('button', { name: 'Skip to end' }));

		expect(ontoStart).toHaveBeenCalledOnce();
		expect(ontoEnd).toHaveBeenCalledOnce();
	});

	it('wires play button to EditorState.togglePlay', async () => {
		const editor = createEditorState();
		render(TransportControlsHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: 'Play' }));

		expect(editor.playing).toBe(true);
	});

	it('wires skip buttons to EditorState seek methods', async () => {
		const editor = createEditorState();
		editor.seek(0.5);
		render(TransportControlsHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: 'Skip to start' }));
		expect(editor.currentTime).toBe(0);

		await userEvent.click(page.getByRole('button', { name: 'Skip to end' }));
		expect(editor.currentTime).toBe(editor.duration);
		expect(editor.playing).toBe(false);
	});

	it('reflects EditorState timecode in the UI', async () => {
		const editor = createEditorState();
		editor.seek(0.5);
		render(TransportControlsHarness, { editor });

		await expect.element(page.getByText(editor.timecode)).toBeInTheDocument();
	});
});
