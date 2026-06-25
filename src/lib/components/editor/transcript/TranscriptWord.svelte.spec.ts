import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import TranscriptWordHarness from './TranscriptWord.harness.svelte';

const [okayWord, , fillerWord] = fixtureTranscriptWords;

describe('TranscriptWord.svelte', () => {
	it('renders default word text with transcript word button role', async () => {
		render(TranscriptWordHarness, { word: okayWord });

		await expect.element(page.getByRole('button', { name: okayWord.text })).toBeInTheDocument();
		await expect.element(page.getByText(okayWord.text)).toBeInTheDocument();
	});

	it('applies current variant tokens when current is true', async () => {
		render(TranscriptWordHarness, { word: okayWord, current: true });

		const word = await page.getByRole('button', { name: `${okayWord.text}, current` }).element();
		const styles = getComputedStyle(word);

		expect(word.classList.contains('transcript-word--current')).toBe(true);
		expect(styles.backgroundColor).toBe('rgb(255, 106, 61)');
		expect(styles.color).toBe('rgb(11, 11, 13)');
		expect(word.getAttribute('aria-current')).toBe('true');
	});

	it('applies selected variant when selected without current playback', async () => {
		render(TranscriptWordHarness, { word: okayWord, selected: true });

		const word = await page.getByRole('button', { name: okayWord.text }).element();
		const styles = getComputedStyle(word);

		expect(word.classList.contains('transcript-word--selected')).toBe(true);
		expect(word.getAttribute('aria-pressed')).toBe('true');
		expect(styles.boxShadow).toContain('rgb(255, 106, 61)');
	});

	it('applies filler underline styling when showFiller is true', async () => {
		render(TranscriptWordHarness, { word: fillerWord, showFiller: true });

		const word = await page.getByRole('button', { name: fillerWord.text }).element();
		const styles = getComputedStyle(word);

		expect(word.classList.contains('transcript-word--filler')).toBe(true);
		expect(styles.color).toBe('rgb(230, 147, 107)');
		expect(styles.textDecorationLine).toContain('underline');
	});

	it('hides filler styling when showFiller is false', async () => {
		render(TranscriptWordHarness, { word: fillerWord, showFiller: false });

		const word = await page.getByRole('button', { name: fillerWord.text }).element();

		expect(word.classList.contains('transcript-word--filler')).toBe(false);
	});

	it('applies search match highlight styling', async () => {
		render(TranscriptWordHarness, { word: okayWord, searchMatch: true });

		const word = await page.getByRole('button', { name: okayWord.text }).element();
		const styles = getComputedStyle(word);

		expect(word.classList.contains('transcript-word--match')).toBe(true);
		expect(styles.color).toBe('rgb(246, 245, 242)');
	});

	it('fires onclick with word payload on click', async () => {
		const onclick = vi.fn();
		render(TranscriptWordHarness, { word: okayWord, onclick });

		await userEvent.click(page.getByRole('button', { name: okayWord.text }));

		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0]?.[0]).toMatchObject({ id: okayWord.id });
	});

	it('activates on keyboard Enter', async () => {
		const onclick = vi.fn();
		render(TranscriptWordHarness, { word: okayWord, onclick });

		const el = (await page
			.getByRole('button', { name: okayWord.text })
			.element()) as HTMLButtonElement;
		el.focus();
		await userEvent.keyboard('{Enter}');

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('renders deleted words with strikethrough and accessible label', async () => {
		const deletedWord = { ...okayWord, deleted: true };
		render(TranscriptWordHarness, { word: deletedWord });

		const word = await page.getByRole('button', { name: `${okayWord.text}, deleted` }).element();
		const styles = getComputedStyle(word);

		expect(word.classList.contains('transcript-word--deleted')).toBe(true);
		expect(styles.textDecorationLine).toContain('line-through');
		expect(styles.color).toBe('rgb(84, 83, 91)');
	});

	it('renders gracefully when word text is empty', async () => {
		const emptyWord = { ...okayWord, text: '', clean: '' };
		render(TranscriptWordHarness, { word: emptyWord });

		await expect.element(page.getByRole('button', { name: '' })).toBeInTheDocument();
	});
});
