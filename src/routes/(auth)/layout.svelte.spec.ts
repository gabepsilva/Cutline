import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import AuthLayoutHarness from '$lib/test/auth-layout.harness.svelte';

describe('(auth)/+layout.svelte', () => {
	it('renders centered auth shell with logo and slot content', async () => {
		render(AuthLayoutHarness);

		await expect.element(page.getByTestId('auth-layout')).toBeInTheDocument();
		await expect.element(page.getByText('Cutline')).toBeInTheDocument();
		await expect.element(page.getByTestId('auth-slot')).toHaveTextContent('Auth page content');
	});

	it('uses main landmark for the auth panel', async () => {
		render(AuthLayoutHarness);

		await expect.element(page.getByRole('main')).toBeInTheDocument();
	});

	it('applies design token panel background', async () => {
		render(AuthLayoutHarness);

		const panel = await page.getByRole('main').element();
		const styles = getComputedStyle(panel);

		expect(styles.backgroundColor).toBe('rgb(19, 19, 22)');
		expect(styles.borderRadius).toBe('16px');
	});
});
