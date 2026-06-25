import { expect, test } from '@playwright/test';

test.describe('signup page', () => {
	test('renders styled signup shell with form fields', async ({ page }) => {
		await page.goto('/signup');

		await expect(page.getByTestId('app-root')).toBeVisible();
		await expect(page.getByTestId('auth-layout')).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Create your account', level: 1 })
		).toBeVisible();
		await expect(page.getByLabel('Name')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel('Password')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
	});
});
