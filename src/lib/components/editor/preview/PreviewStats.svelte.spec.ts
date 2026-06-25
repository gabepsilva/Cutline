import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import PreviewStatsHarness from './PreviewStats.harness.svelte';

describe('PreviewStats.svelte', () => {
	it('renders clip length and edit stat cards', async () => {
		render(PreviewStatsHarness);

		await expect.element(page.getByText('Clip length')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Clip length')).toHaveTextContent('4:32');
		await expect.element(page.getByText('Edits')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Deleted word count')).toHaveTextContent('2 cut');
	});

	it('shows saved and remaining word labels', async () => {
		render(PreviewStatsHarness, {
			totalLabel: '4:32',
			savedLabel: '−2 words trimmed',
			deletedCount: 2,
			wordCount: 1140
		});

		await expect.element(page.getByText('−2 words trimmed')).toBeInTheDocument();
		await expect.element(page.getByText('1140 words remain')).toBeInTheDocument();
	});

	it('updates values when props change', async () => {
		render(PreviewStatsHarness, {
			totalLabel: '1:05',
			savedLabel: 'Original cut',
			deletedCount: 0,
			wordCount: 42
		});

		await expect.element(page.getByLabelText('Clip length')).toHaveTextContent('1:05');
		await expect.element(page.getByText('Original cut')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Deleted word count')).toHaveTextContent('0 cut');
		await expect.element(page.getByText('42 words remain')).toBeInTheDocument();
	});

	it('applies preview stats surface tokens', async () => {
		render(PreviewStatsHarness);

		const card = await page.getByText('Clip length').element();
		const styles = getComputedStyle(card.closest('.preview-stats__card') as HTMLElement);

		expect(styles.backgroundColor).toBe('rgb(16, 16, 19)');
		expect(styles.borderColor).toBe('rgb(31, 31, 36)');
	});

	it('styles saved label with accent color', async () => {
		render(PreviewStatsHarness, {
			totalLabel: '4:32',
			savedLabel: '−2 words trimmed',
			deletedCount: 2,
			wordCount: 1140
		});

		const detail = await page.getByText('−2 words trimmed').element();
		const styles = getComputedStyle(detail);

		expect(styles.color).toBe('rgb(255, 106, 61)');
	});
});
