import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import PreviewPanelHarness from './PreviewPanel.harness.svelte';

describe('PreviewPanel.svelte', () => {
	it('renders default preview structure with player, stats, and caption style', async () => {
		render(PreviewPanelHarness);

		await expect.element(page.getByRole('region', { name: 'Preview' })).toBeInTheDocument();
		await expect.element(page.getByText('REC 1080p')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Clip length')).toHaveTextContent('4:32');
		await expect.element(page.getByText('Caption style')).toBeInTheDocument();
	});

	it('shows edit stats and saved label', async () => {
		render(PreviewPanelHarness, {
			savedLabel: '−2 words trimmed',
			deletedCount: 2,
			wordCount: 1140
		});

		await expect.element(page.getByLabelText('Deleted word count')).toHaveTextContent('2 cut');
		await expect.element(page.getByText('1140 words remain')).toBeInTheDocument();
		await expect.element(page.getByText('−2 words trimmed')).toBeInTheDocument();
	});

	it('updates stats when props change', async () => {
		render(PreviewPanelHarness, {
			totalLabel: '1:05',
			savedLabel: 'Original cut',
			deletedCount: 0,
			wordCount: 42
		});

		await expect.element(page.getByLabelText('Clip length')).toHaveTextContent('1:05');
		await expect.element(page.getByText('Original cut')).toBeInTheDocument();
		await expect.element(page.getByText('42 words remain')).toBeInTheDocument();
	});

	it('fires ontogglePlay when the center play control is clicked', async () => {
		const ontogglePlay = vi.fn();
		render(PreviewPanelHarness, { playing: false, ontogglePlay });

		await userEvent.click(page.getByRole('button', { name: 'Play preview' }));

		expect(ontogglePlay).toHaveBeenCalledOnce();
	});

	it('fires oncaptionstylechange when a caption style chip is clicked', async () => {
		const oncaptionstylechange = vi.fn();
		render(PreviewPanelHarness, { captionStyle: 'karaoke', oncaptionstylechange });

		await userEvent.click(page.getByRole('button', { name: 'Clean' }));

		expect(oncaptionstylechange).toHaveBeenCalledOnce();
		expect(oncaptionstylechange).toHaveBeenCalledWith('clean');
	});

	it('hides captions when showCaptions is false', async () => {
		render(PreviewPanelHarness, { showCaptions: false });

		const region = await page.getByRole('region', { name: 'Preview' }).element();
		expect(region.querySelector('.preview-captions')).toBeNull();
	});

	it('handles empty caption tokens without crashing', async () => {
		render(PreviewPanelHarness, { captionTokens: [], showCaptions: true });

		await expect.element(page.getByRole('region', { name: 'Preview' })).toBeInTheDocument();
		const region = await page.getByRole('region', { name: 'Preview' }).element();
		expect(region.querySelector('.preview-captions')).toBeNull();
	});

	it('applies preview panel surface tokens', async () => {
		render(PreviewPanelHarness);

		const panel = await page.getByRole('region', { name: 'Preview' }).element();
		const styles = getComputedStyle(panel);

		expect(styles.backgroundColor).toBe('rgb(10, 10, 12)');
	});
});
