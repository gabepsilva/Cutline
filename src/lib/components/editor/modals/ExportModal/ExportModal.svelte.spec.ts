import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ExportModalHarness from './ExportModal.harness.svelte';

describe('ExportModal.svelte', () => {
	it('renders export dialog with format and resolution groups', async () => {
		render(ExportModalHarness, { open: true, totalTimecode: '4:32' });

		await expect.element(page.getByRole('dialog', { name: 'Export video' })).toBeInTheDocument();
		await expect.element(page.getByRole('group', { name: 'Export format' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Export resolution' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Export · 4:32' })).toBeInTheDocument();
	});

	it('hides dialog when closed', async () => {
		render(ExportModalHarness, { open: false });

		await expect
			.element(page.getByRole('dialog', { name: 'Export video' }))
			.not.toBeInTheDocument();
	});

	it('reflects selected format and resolution chips', async () => {
		render(ExportModalHarness, { format: 'mov', resolution: '720p' });

		const mov = await page.getByRole('button', { name: 'MOV' }).element();
		const p720 = await page.getByRole('button', { name: '720p' }).element();

		expect(mov.getAttribute('aria-pressed')).toBe('true');
		expect(p720.getAttribute('aria-pressed')).toBe('true');
	});

	it('fires onformatchange when a format chip is clicked', async () => {
		const onformatchange = vi.fn();
		render(ExportModalHarness, { onformatchange });

		await userEvent.click(page.getByRole('button', { name: 'GIF' }));

		expect(onformatchange).toHaveBeenCalledOnce();
		expect(onformatchange).toHaveBeenCalledWith('gif');
	});

	it('fires onresolutionchange when a resolution chip is clicked', async () => {
		const onresolutionchange = vi.fn();
		render(ExportModalHarness, { onresolutionchange });

		await userEvent.click(page.getByRole('button', { name: '4K' }));

		expect(onresolutionchange).toHaveBeenCalledOnce();
		expect(onresolutionchange).toHaveBeenCalledWith('4k');
	});

	it('fires onburncaptionschange when toggle is clicked', async () => {
		const onburncaptionschange = vi.fn();
		render(ExportModalHarness, { burnCaptions: true, onburncaptionschange });

		await userEvent.click(page.getByRole('switch', { name: 'Burn in captions' }));

		expect(onburncaptionschange).toHaveBeenCalledOnce();
		expect(onburncaptionschange).toHaveBeenCalledWith(false);
	});

	it('fires onexport when export button is clicked', async () => {
		const onexport = vi.fn();
		render(ExportModalHarness, { totalTimecode: '1:05', onexport });

		await userEvent.click(page.getByRole('button', { name: 'Export · 1:05' }));

		expect(onexport).toHaveBeenCalledOnce();
	});

	it('fires onclose on Escape key', async () => {
		const onclose = vi.fn();
		render(ExportModalHarness, { onclose });

		await userEvent.keyboard('{Escape}');

		expect(onclose).toHaveBeenCalledOnce();
	});
});
