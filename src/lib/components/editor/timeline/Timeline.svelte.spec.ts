import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '$lib/editor/editor-state.svelte';
import { fixtureSentence, fixtureTranscriptWords } from '$lib/test/fixtures';
import { render } from '$lib/test/render';
import TimelineEditorHarness from './TimelineEditor.harness.svelte';
import TimelineHarness from './Timeline.harness.svelte';

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

describe('Timeline.svelte', () => {
	it('renders timeline region with track labels and ruler ticks', async () => {
		render(TimelineHarness);

		await expect.element(page.getByRole('region', { name: 'Timeline' })).toBeInTheDocument();
		await expect.element(page.getByText('B-ROLL', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('V1')).toBeInTheDocument();
		await expect.element(page.getByText('A1')).toBeInTheDocument();
		await expect.element(page.getByText('CC')).toBeInTheDocument();
		await expect.element(page.getByText('0:00')).toBeInTheDocument();
	});

	it('renders b-roll empty state and caption clip labels', async () => {
		render(TimelineHarness);

		await expect
			.element(page.getByText('Record or add B-roll — clips drop here at the playhead'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Welcome to Cutline')).toBeInTheDocument();
	});

	it('fires toolbar callbacks and onseek on lane click', async () => {
		const onrecord = vi.fn();
		const onmedia = vi.fn();
		const onseek = vi.fn();
		render(TimelineHarness, { onrecord, onmedia, onseek });

		await userEvent.click(page.getByRole('button', { name: 'Record' }));
		await userEvent.click(page.getByRole('button', { name: /Media ·/ }));
		await userEvent.click(page.getByRole('button', { name: 'Timeline tracks' }));

		expect(onrecord).toHaveBeenCalledOnce();
		expect(onmedia).toHaveBeenCalledOnce();
		expect(onseek).toHaveBeenCalledOnce();
	});

	it('derives track clips from EditorState', async () => {
		render(TimelineEditorHarness, { editor: createEditorState() });

		await expect.element(page.getByText('Okay', { exact: false })).toBeInTheDocument();
	});

	it('wires lane click to EditorState.seekFromTimelineClick', async () => {
		const editor = createEditorState();
		render(TimelineEditorHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: 'Timeline tracks' }));

		expect(editor.currentTime).toBeCloseTo(editor.duration / 2, 1);
	});

	it('wires Record and Media toolbar actions to EditorState', async () => {
		const editor = createEditorState();
		render(TimelineEditorHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: 'Record' }));
		expect(editor.recordPhase).toBe('live');

		await userEvent.click(page.getByRole('button', { name: /Media ·/ }));
		expect(editor.showMedia).toBe(true);
	});
});
