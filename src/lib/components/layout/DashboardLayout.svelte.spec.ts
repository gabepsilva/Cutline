import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import DashboardLayoutHarness from './DashboardLayout.harness.svelte';

describe('DashboardLayout.svelte', () => {
	it('renders sidebar and main slot content', async () => {
		render(DashboardLayoutHarness, { slotContent: 'Recent projects' });

		await expect.element(page.getByLabelText('Application sidebar')).toBeInTheDocument();
		await expect.element(page.getByText('Recent projects')).toBeInTheDocument();
	});

	it('uses flex row shell from design', async () => {
		render(DashboardLayoutHarness);

		const main = await page.getByRole('main').element();
		const layout = main.parentElement as HTMLElement;
		const styles = getComputedStyle(layout);

		expect(styles.display).toBe('flex');
		expect(parseInt(styles.minHeight, 10)).toBeGreaterThan(0);
	});

	it('applies main panel padding tokens', async () => {
		render(DashboardLayoutHarness);

		const main = await page.getByRole('main').element();
		const styles = getComputedStyle(main);

		expect(styles.paddingTop).toBe('30px');
		expect(styles.paddingLeft).toBe('40px');
		expect(styles.paddingBottom).toBe('60px');
	});
});
