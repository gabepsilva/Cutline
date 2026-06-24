import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import LayoutHarness from '$lib/test/layout.harness.svelte';

describe('+layout.svelte', () => {
	it('wraps page content in the app root shell', async () => {
		render(LayoutHarness);

		await expect.element(page.getByTestId('app-root')).toBeInTheDocument();
		await expect.element(page.getByTestId('child')).toHaveTextContent('Cutline');
	});

	it('applies design token text color on the root shell', async () => {
		render(LayoutHarness);

		const el = await page.getByTestId('app-root').element();
		expect(getComputedStyle(el).color).toBe('rgb(243, 242, 240)');
	});
});
