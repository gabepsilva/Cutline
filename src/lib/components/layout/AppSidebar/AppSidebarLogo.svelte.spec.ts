import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import AppSidebarLogoHarness from './AppSidebarLogo.harness.svelte';

describe('AppSidebarLogo.svelte', () => {
	it('renders brand label', async () => {
		render(AppSidebarLogoHarness);

		await expect.element(page.getByText('Cutline')).toBeInTheDocument();
	});

	it('applies accent mark token', async () => {
		render(AppSidebarLogoHarness);

		const label = await page.getByText('Cutline').element();
		const mark = label.previousElementSibling as HTMLElement;
		const styles = getComputedStyle(mark);

		expect(styles.backgroundColor).toBe('rgb(255, 106, 61)');
		expect(styles.width).toBe('26px');
		expect(styles.height).toBe('26px');
	});
});
