import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureSentence, fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import { fixtureUser } from '$lib/test/fixtures/user';
import type { Sentence } from '$lib/types/transcript';
import TranscriptPanelHarness from './TranscriptPanel.harness.svelte';

const [okayWord, , fillerWord] = fixtureTranscriptWords;

describe('TranscriptPanel.svelte', () => {
	it('renders transcript header, search, filler action, speaker, and sentences', async () => {
		render(TranscriptPanelHarness, { fillerCount: 2 });

		await expect.element(page.getByRole('region', { name: 'Transcript' })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Transcript' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('searchbox', { name: 'Search transcript' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Remove fillers · 2' }))
			.toBeInTheDocument();
		await expect.element(page.getByText(fixtureUser.name)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Seek to 0:00' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: okayWord.text })).toBeInTheDocument();
	});

	it('reflects fillerCount in the remove fillers label', async () => {
		render(TranscriptPanelHarness, { fillerCount: 5 });

		await expect
			.element(page.getByRole('button', { name: 'Remove fillers · 5' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Remove fillers · 2' }))
			.not.toBeInTheDocument();
	});

	it('shows selection bar when hasSelection is true', async () => {
		render(TranscriptPanelHarness, {
			hasSelection: true,
			selectedText: fillerWord.text
		});

		await expect
			.element(page.getByRole('region', { name: 'Selection actions' }))
			.toBeInTheDocument();
		await expect.element(page.getByText(`"${fillerWord.text}"`)).toBeInTheDocument();
	});

	it('fires onsearch when typing in the search field', async () => {
		const onsearch = vi.fn();
		render(TranscriptPanelHarness, { searchQuery: '', onsearch });

		await userEvent.fill(
			page.getByRole('searchbox', { name: 'Search transcript' }),
			fillerWord.clean
		);

		expect(onsearch).toHaveBeenCalled();
	});

	it('fires onremovefillers when the filler action is clicked', async () => {
		const onremovefillers = vi.fn();
		render(TranscriptPanelHarness, { onremovefillers });

		await userEvent.click(page.getByRole('button', { name: 'Remove fillers · 1' }));

		expect(onremovefillers).toHaveBeenCalledOnce();
	});

	it('fires ondelete when the selection bar delete action is clicked', async () => {
		const ondelete = vi.fn();
		render(TranscriptPanelHarness, {
			hasSelection: true,
			selectedText: fillerWord.text,
			ondelete
		});

		await userEvent.click(page.getByRole('button', { name: 'Delete word' }));

		expect(ondelete).toHaveBeenCalledOnce();
	});

	it('fires onsentenceclick when a sentence timecode is clicked', async () => {
		const onsentenceclick = vi.fn();
		render(TranscriptPanelHarness, { onsentenceclick });

		await userEvent.click(page.getByRole('button', { name: 'Seek to 0:00' }));

		expect(onsentenceclick).toHaveBeenCalledOnce();
		expect(onsentenceclick.mock.calls[0]?.[0]).toMatchObject({ id: fixtureSentence.id });
	});

	it('fires onwordclick when a transcript word is clicked', async () => {
		const onwordclick = vi.fn();
		render(TranscriptPanelHarness, { onwordclick });

		await userEvent.click(page.getByRole('button', { name: okayWord.text }));

		expect(onwordclick).toHaveBeenCalledOnce();
		expect(onwordclick.mock.calls[0]?.[0]).toMatchObject({ id: okayWord.id });
	});

	it('applies transcript panel surface and border tokens', async () => {
		render(TranscriptPanelHarness);

		const panel = await page.getByRole('region', { name: 'Transcript' }).element();
		const panelStyles = getComputedStyle(panel);

		expect(panelStyles.backgroundColor).toBe('rgb(13, 13, 15)');
		expect(panelStyles.borderRightColor).toBe('rgb(26, 26, 30)');
	});

	it('renders gracefully with empty sentences', async () => {
		render(TranscriptPanelHarness, { sentences: [], fillerCount: 0 });

		await expect.element(page.getByRole('region', { name: 'Transcript' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Remove fillers · 0' }))
			.toBeInTheDocument();
		await expect.element(page.getByText(fixtureUser.name)).toBeInTheDocument();
		expect(page.getByRole('button', { name: /Seek to/ }).elements()).toHaveLength(0);
	});

	it('hides search and filler actions while transcribing', async () => {
		render(TranscriptPanelHarness, {
			status: 'transcribing',
			transcriptionProgress: 0.45,
			transcriptionStage: 'Generating transcript…',
			sentences: []
		});

		await expect
			.element(page.getByRole('searchbox', { name: 'Search transcript' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /Remove fillers/ }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText('Generating transcript…')).toBeInTheDocument();
		await expect.element(page.getByText('45%')).toBeInTheDocument();
	});

	it('shows unavailable copy when transcription cannot run', async () => {
		render(TranscriptPanelHarness, { status: 'unavailable', sentences: [] });

		await expect.element(page.getByText('Transcription not available')).toBeInTheDocument();
	});

	it('renders a header per speaker for diarized transcripts', async () => {
		const speakerA: Sentence = {
			id: 's0',
			t0: 0,
			words: [{ ...okayWord, speaker: 'A' }]
		};
		const speakerB: Sentence = {
			id: 's1',
			t0: 1,
			words: [{ ...okayWord, id: 'w9', text: 'Right', clean: 'right', sid: 's1', speaker: 'B' }]
		};

		render(TranscriptPanelHarness, {
			sentences: [speakerA, speakerB],
			speakersByLabel: {
				A: { name: 'Speaker A', initials: 'A' },
				B: { name: 'Speaker B', initials: 'B' }
			}
		});

		await expect.element(page.getByText('Speaker A')).toBeInTheDocument();
		await expect.element(page.getByText('Speaker B')).toBeInTheDocument();
	});
});
