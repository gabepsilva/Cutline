import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '$lib/editor/editor-state.svelte';
import { mockEditorResources } from '$lib/mocks/editor.mock';
import { fixtureSentence, fixtureTranscriptWords } from '$lib/test/fixtures';
import { render } from '$lib/test/render';
import EditorModalsHarness from './EditorModals.harness.svelte';

function createEditor() {
	return new EditorState({
		words: fixtureTranscriptWords.map((word) => ({ ...word })),
		sentences: [{ ...fixtureSentence, words: fixtureTranscriptWords.map((w) => ({ ...w })) }],
		resources: mockEditorResources.map((resource) => ({ ...resource }))
	});
}

describe('EditorModals.svelte', () => {
	it('shows media shelf when editor.showMedia is true', async () => {
		const editor = createEditor();
		editor.showMedia = true;
		render(EditorModalsHarness, { editor });

		await expect.element(page.getByRole('region', { name: 'Media library' })).toBeInTheDocument();
		await expect.element(page.getByText('City timelapse')).toBeInTheDocument();
	});

	it('adds overlay when a media card is clicked', async () => {
		const editor = createEditor();
		editor.showMedia = true;
		render(EditorModalsHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: 'City timelapse' }));

		expect(editor.overlays).toHaveLength(1);
		expect(editor.showMedia).toBe(false);
	});

	it('opens record modal from media shelf record action', async () => {
		const editor = createEditor();
		editor.showMedia = true;
		render(EditorModalsHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: 'Record new' }));

		expect(editor.recordPhase).toBe('live');
		await expect.element(page.getByRole('dialog', { name: 'Record' })).toBeInTheDocument();
	});

	it('opens export config when export phase is config', async () => {
		const editor = createEditor();
		editor.startExport();
		render(EditorModalsHarness, { editor, projectTitle: 'How I edit videos 3x faster' });

		await expect.element(page.getByRole('dialog', { name: 'Export video' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Export ·/ })).toBeInTheDocument();
	});

	it('starts mock export when export is submitted', async () => {
		vi.useFakeTimers();
		const editor = createEditor();
		editor.startExport();
		render(EditorModalsHarness, { editor });

		await userEvent.click(page.getByRole('button', { name: /Export ·/ }));

		expect(editor.exportPhase).toBe('exporting');
		vi.useRealTimers();
	});
});
