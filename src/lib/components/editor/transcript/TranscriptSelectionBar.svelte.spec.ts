import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
import TranscriptSelectionBarHarness from './TranscriptSelectionBar.harness.svelte';

const fillerWord = fixtureTranscriptWords[2];

describe('TranscriptSelectionBar.svelte', () => {
	it('renders selected word text and delete action when visible', async () => {
		render(TranscriptSelectionBarHarness, { selectedText: fillerWord.text });

		await expect
			.element(page.getByRole('region', { name: 'Selection actions' }))
			.toBeInTheDocument();
		await expect.element(page.getByText(`"${fillerWord.text}"`)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Delete word' })).toBeInTheDocument();
	});

	it('hides the bar when visible is false', async () => {
		render(TranscriptSelectionBarHarness, { visible: false });

		await expect
			.element(page.getByRole('region', { name: 'Selection actions' }))
			.not.toBeInTheDocument();
	});

	it('shows restore label when deleteLabel prop changes', async () => {
		render(TranscriptSelectionBarHarness, {
			selectedText: fillerWord.text,
			deleteLabel: 'Restore word'
		});

		await expect.element(page.getByRole('button', { name: 'Restore word' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Delete word' })).not.toBeInTheDocument();
	});

	it('fires ondelete when the action button is clicked', async () => {
		const ondelete = vi.fn();
		render(TranscriptSelectionBarHarness, { ondelete });

		await userEvent.click(page.getByRole('button', { name: 'Delete word' }));

		expect(ondelete).toHaveBeenCalledOnce();
	});

	it('activates delete action on keyboard Enter', async () => {
		const ondelete = vi.fn();
		render(TranscriptSelectionBarHarness, { ondelete });

		const button = (await page
			.getByRole('button', { name: 'Delete word' })
			.element()) as HTMLButtonElement;
		button.focus();
		await userEvent.keyboard('{Enter}');

		expect(ondelete).toHaveBeenCalledOnce();
	});

	it('applies transcript selection bar layout and accent action tokens', async () => {
		render(TranscriptSelectionBarHarness);

		const region = await page.getByRole('region', { name: 'Selection actions' }).element();
		const action = await page.getByRole('button', { name: 'Delete word' }).element();
		const regionStyles = getComputedStyle(region);
		const actionStyles = getComputedStyle(action);

		expect(regionStyles.backgroundColor).toBe('rgb(16, 16, 19)');
		expect(regionStyles.borderBottomColor).toBe('rgb(26, 26, 30)');
		expect(actionStyles.color).toBe('rgb(230, 147, 107)');
		expect(actionStyles.backgroundColor).not.toBe('rgb(20, 20, 23)');
	});

	it('renders gracefully with empty selectedText', async () => {
		render(TranscriptSelectionBarHarness, { selectedText: '' });

		await expect.element(page.getByText('""')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Delete word' })).toBeInTheDocument();
	});
});
