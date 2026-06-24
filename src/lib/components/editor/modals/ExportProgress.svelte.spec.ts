import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import ExportProgressHarness from './ExportProgress.harness.svelte';

describe('ExportProgress.svelte', () => {
	it('renders export status with title and detail', async () => {
		render(ExportProgressHarness, {
			detail: 'Encoding 1080p · burn-in captions'
		});

		await expect
			.element(page.getByRole('status', { name: 'Export in progress' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Exporting…')).toBeInTheDocument();
		await expect.element(page.getByText('Encoding 1080p · burn-in captions')).toBeInTheDocument();
	});

	it('renders progress bar with configured value', async () => {
		render(ExportProgressHarness, { progress: 42 });

		const bar = await page.getByRole('progressbar', { name: 'Export progress' }).element();
		expect(bar.getAttribute('aria-valuenow')).toBe('42');
	});

	it('renders progress label text', async () => {
		render(ExportProgressHarness, { progressLabel: '67%' });

		await expect.element(page.getByText('67%')).toBeInTheDocument();
	});
});
