import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import DashboardHeaderHarness from './DashboardHeader.harness.svelte';

describe('DashboardHeader.svelte', () => {
	it('renders greeting and title from design', async () => {
		render(DashboardHeaderHarness);

		await expect.element(page.getByText('Welcome back, Alex')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Home', level: 1 })).toBeInTheDocument();
	});

	it('renders CTA action slot', async () => {
		render(DashboardHeaderHarness);

		await expect.element(page.getByRole('button', { name: 'New project' })).toBeInTheDocument();
	});

	it('fires onclick on New project button', async () => {
		const onnewProject = vi.fn();
		render(DashboardHeaderHarness, { onnewProject });

		await userEvent.click(page.getByRole('button', { name: 'New project' }));

		expect(onnewProject).toHaveBeenCalledOnce();
	});

	it('applies title typography tokens', async () => {
		render(DashboardHeaderHarness);

		const title = await page.getByRole('heading', { name: 'Home', level: 1 }).element();
		const styles = getComputedStyle(title);

		expect(styles.fontSize).toBe('26px');
		expect(styles.fontWeight).toBe('600');
		expect(styles.letterSpacing).toBe('-0.52px');
	});
});
