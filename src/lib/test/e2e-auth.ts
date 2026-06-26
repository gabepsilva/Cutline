import { expect, type Page } from '@playwright/test';

export const E2E_EMAIL = 'e2e@cutline.test';
export const E2E_PASSWORD = 'e2e-password-123';

/** Sign in with the seeded e2e account used by `scripts/e2e-setup.ts`. */
export async function loginAsE2eUser(page: Page): Promise<void> {
	await page.goto('/login');
	await page.getByLabel('Email').fill(E2E_EMAIL);
	await page.getByLabel('Password').fill(E2E_PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL('/');
}
