import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import TranscriptSentenceHarness from './TranscriptSentence.harness.svelte';

const [okayWord, , fillerWord] = fixtureTranscriptWords;

describe('TranscriptSentence.svelte', () => {
	it('renders default sentence timecode and word text', async () => {
		render(TranscriptSentenceHarness);

		await expect.element(page.getByRole('button', { name: 'Seek to 0:00' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: okayWord.text })).toBeInTheDocument();
		await expect.element(page.getByText(fillerWord.text)).toBeInTheDocument();
	});

	it('formats startTime prop as the sentence timecode label', async () => {
		render(TranscriptSentenceHarness, { startTime: 92 });

		await expect.element(page.getByRole('button', { name: 'Seek to 1:32' })).toBeInTheDocument();
		await expect.element(page.getByText('1:32')).toBeInTheDocument();
	});

	it('highlights the current word when currentWordId matches', async () => {
		render(TranscriptSentenceHarness, { currentWordId: okayWord.id });

		const word = await page.getByRole('button', { name: `${okayWord.text}, current` }).element();

		expect(word.classList.contains('transcript-word--current')).toBe(true);
	});

	it('highlights search matches when searchQuery is set', async () => {
		render(TranscriptSentenceHarness, { searchQuery: 'um' });

		const filler = await page.getByRole('button', { name: fillerWord.text }).element();

		expect(filler.classList.contains('transcript-word--match')).toBe(true);
	});

	it('fires onTimeClick when the timecode control is clicked', async () => {
		const onTimeClick = vi.fn();
		render(TranscriptSentenceHarness, { onTimeClick });

		await userEvent.click(page.getByRole('button', { name: 'Seek to 0:00' }));

		expect(onTimeClick).toHaveBeenCalledOnce();
	});

	it('fires onWordClick with the clicked word on word click', async () => {
		const onWordClick = vi.fn();
		render(TranscriptSentenceHarness, { onWordClick });

		await userEvent.click(page.getByRole('button', { name: okayWord.text }));

		expect(onWordClick).toHaveBeenCalledOnce();
		expect(onWordClick.mock.calls[0]?.[0]).toMatchObject({ id: okayWord.id });
	});

	it('activates timecode seek on keyboard Enter', async () => {
		const onTimeClick = vi.fn();
		render(TranscriptSentenceHarness, { onTimeClick });

		const timeButton = (await page
			.getByRole('button', { name: 'Seek to 0:00' })
			.element()) as HTMLButtonElement;
		timeButton.focus();
		await userEvent.keyboard('{Enter}');

		expect(onTimeClick).toHaveBeenCalledOnce();
	});

	it('exposes accessible labels on timecode and word controls', async () => {
		render(TranscriptSentenceHarness, { currentWordId: okayWord.id });

		await expect.element(page.getByRole('button', { name: 'Seek to 0:00' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: `${okayWord.text}, current` }))
			.toBeInTheDocument();
	});

	it('renders gracefully when the sentence has no words', async () => {
		render(TranscriptSentenceHarness, { sentence: { id: 's-empty', words: [], t0: 0 } });

		await expect.element(page.getByRole('button', { name: 'Seek to 0:00' })).toBeInTheDocument();
		expect(page.getByRole('button').elements().length).toBe(1);
	});
});
