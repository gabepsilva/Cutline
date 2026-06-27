import { expect, test } from '@playwright/test';
import { loginAsE2eUser } from '$lib/test/e2e-auth';

test.describe('new project route', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsE2eUser(page);
	});

	test('renders import gateway shell for authenticated users', async ({ page }) => {
		await page.goto('/projects/new');

		await expect(page.getByTestId('new-project-page')).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Project title' })).toHaveValue(
			'Untitled project'
		);
		await expect(page.getByRole('heading', { name: 'Start your video' })).toBeVisible();
		await expect(page.getByTestId('new-project-timeline-placeholder')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled();
	});

	test('back to projects navigates home', async ({ page }) => {
		await page.goto('/projects/new');

		await page.getByRole('button', { name: 'Projects' }).click();
		await expect(page).toHaveURL('/');
	});
});
