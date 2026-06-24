import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ExportCompleteHarness from './ExportComplete.harness.svelte';

describe('ExportComplete.svelte', () => {
	it('renders export complete status with filename and detail', async () => {
		render(ExportCompleteHarness, {
			filename: 'cutline-export.mp4',
			detail: '1080p · 4:32'
		});

		await expect.element(page.getByRole('status', { name: 'Export complete' })).toBeInTheDocument();
		await expect.element(page.getByText('Export complete')).toBeInTheDocument();
		await expect.element(page.getByText('cutline-export.mp4 · 1080p · 4:32')).toBeInTheDocument();
	});

	it('fires ondone when Done is clicked', async () => {
		const ondone = vi.fn();
		render(ExportCompleteHarness, { ondone });

		await userEvent.click(page.getByRole('button', { name: 'Done' }));

		expect(ondone).toHaveBeenCalledOnce();
	});

	it('fires ondownload when Download is clicked', async () => {
		const ondownload = vi.fn();
		render(ExportCompleteHarness, { ondownload });

		await userEvent.click(page.getByRole('button', { name: 'Download' }));

		expect(ondownload).toHaveBeenCalledOnce();
	});
});
