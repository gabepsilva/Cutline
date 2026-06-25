import { expect, test } from '@playwright/test';

test.describe('login page', () => {
	test('renders styled sign-in shell with form fields', async ({ page }) => {
		await page.goto('/login');

		await expect(page.getByTestId('app-root')).toBeVisible();
		await expect(page.getByTestId('auth-layout')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel('Password')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/signup');
	});
});
