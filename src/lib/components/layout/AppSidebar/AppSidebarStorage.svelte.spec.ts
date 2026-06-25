import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import AppSidebarStorageHarness from './AppSidebarStorage.harness.svelte';

describe('AppSidebarStorage.svelte', () => {
	it('renders storage labels from design', async () => {
		render(AppSidebarStorageHarness);

		await expect.element(page.getByLabelText('Storage usage')).toBeInTheDocument();
		await expect.element(page.getByText('Storage')).toBeInTheDocument();
		await expect.element(page.getByText('62%')).toBeInTheDocument();
		await expect.element(page.getByText('38.4 GB of 60 GB used')).toBeInTheDocument();
	});

	it('updates percent label when usage changes', async () => {
		render(AppSidebarStorageHarness, {
			usage: { percentUsed: 40, usageLabel: '24 GB of 60 GB used' }
		});

		await expect.element(page.getByText('40%')).toBeInTheDocument();
		await expect.element(page.getByText('24 GB of 60 GB used')).toBeInTheDocument();
	});

	it('exposes progressbar semantics', async () => {
		render(AppSidebarStorageHarness);

		await expect.element(page.getByRole('progressbar')).toBeInTheDocument();
	});

	it('renders gracefully with zero usage', async () => {
		render(AppSidebarStorageHarness, {
			usage: { percentUsed: 0, usageLabel: '' }
		});

		await expect.element(page.getByText('0%')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Storage usage')).toBeInTheDocument();
	});
});
