import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { captionWords } from '$lib/editor/editor-derive';
import { render } from '$lib/test/render';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import PreviewCaptionsHarness from './PreviewCaptions.harness.svelte';

const karaokeTokens = captionWords(fixtureTranscriptWords, 'w1', 'karaoke');

describe('PreviewCaptions.svelte', () => {
	it('renders caption words from fixture tokens', async () => {
		render(PreviewCaptionsHarness, { tokens: karaokeTokens });

		await expect.element(page.getByText('Okay')).toBeInTheDocument();
		await expect.element(page.getByText('so,')).toBeInTheDocument();
		await expect.element(page.getByText('this')).toBeInTheDocument();
	});

	it('highlights the current word in karaoke style', async () => {
		render(PreviewCaptionsHarness, { tokens: karaokeTokens, style: 'karaoke' });

		const current = await page.getByText('so,').element();
		const dimmed = await page.getByText('Okay').element();

		expect(current.classList.contains('preview-captions__word--current')).toBe(true);
		expect(dimmed.classList.contains('preview-captions__word--dimmed')).toBe(true);
	});

	it('uses clean styling without karaoke modifiers', async () => {
		render(PreviewCaptionsHarness, {
			tokens: karaokeTokens,
			style: 'clean'
		});

		const text = await page.getByText('so,').element();
		const container = text.closest('.preview-captions__text');

		expect(container?.classList.contains('preview-captions__text--clean')).toBe(true);
		expect(text.classList.contains('preview-captions__word--current')).toBe(false);
		expect(text.classList.contains('preview-captions__word--dimmed')).toBe(false);
	});

	it('hides captions when visible is false', async () => {
		render(PreviewCaptionsHarness, { tokens: karaokeTokens, visible: false });

		await expect.element(page.getByText('Okay')).not.toBeInTheDocument();
	});

	it('renders gracefully with empty tokens', async () => {
		render(PreviewCaptionsHarness, { tokens: [] });

		await expect.element(page.getByText('Okay')).not.toBeInTheDocument();
	});

	it('applies preview caption typography tokens', async () => {
		render(PreviewCaptionsHarness, { tokens: karaokeTokens });

		const text = await page.getByText('so,').element();
		const paragraph = text.closest('.preview-captions__text');
		const styles = getComputedStyle(paragraph as HTMLElement);

		expect(styles.fontSize).toBe('19px');
		expect(styles.fontWeight).toBe('600');
		expect(styles.textAlign).toBe('center');
	});
});
