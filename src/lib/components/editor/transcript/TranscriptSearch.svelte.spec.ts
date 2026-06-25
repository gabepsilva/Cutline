import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import TranscriptSearchHarness from './TranscriptSearch.harness.svelte';

describe('TranscriptSearch.svelte', () => {
	it('renders search field with placeholder and magnifier icon', async () => {
		render(TranscriptSearchHarness);

		const field = page.getByRole('searchbox', { name: 'Search transcript' });
		await expect.element(field).toBeInTheDocument();
		await expect.element(field).toHaveAttribute('placeholder', 'Search transcript');
	});

	it('reflects the value prop in the input', async () => {
		render(TranscriptSearchHarness, { value: fixtureTranscriptWords[0].clean });

		await expect
			.element(page.getByRole('searchbox', { name: 'Search transcript' }))
			.toHaveValue(fixtureTranscriptWords[0].clean);
	});

	it('fires oninput when typing a transcript term', async () => {
		const oninput = vi.fn();
		render(TranscriptSearchHarness, { value: '', oninput });

		await userEvent.fill(
			page.getByRole('searchbox', { name: 'Search transcript' }),
			fixtureTranscriptWords[2].clean
		);

		expect(oninput).toHaveBeenCalled();
	});

	it('applies transcript panel layout tokens and max width', async () => {
		render(TranscriptSearchHarness);

		const field = await page.getByRole('searchbox', { name: 'Search transcript' }).element();
		const wrapper = field.closest('.transcript-search') as HTMLElement;
		const inputShell = field.parentElement as HTMLElement;
		const shellStyles = getComputedStyle(inputShell);
		const layoutStyles = getComputedStyle(wrapper);

		expect(layoutStyles.maxWidth).toBe('260px');
		expect(shellStyles.backgroundColor).toBe('rgb(20, 20, 23)');
		expect(shellStyles.borderColor).toBe('rgb(35, 35, 40)');
	});

	it('exposes an accessible searchbox label', async () => {
		render(TranscriptSearchHarness, { placeholder: 'Find words in transcript' });

		await expect
			.element(page.getByRole('searchbox', { name: 'Find words in transcript' }))
			.toBeInTheDocument();
	});

	it('renders gracefully with empty value and does not accept input when disabled', async () => {
		render(TranscriptSearchHarness, { value: '', disabled: true });

		await expect.element(page.getByRole('searchbox', { name: 'Search transcript' })).toBeDisabled();
		await expect
			.element(page.getByRole('searchbox', { name: 'Search transcript' }))
			.toHaveValue('');
	});
});
