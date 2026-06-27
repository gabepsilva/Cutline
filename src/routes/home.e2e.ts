import { expect, test } from '@playwright/test';
import { loginAsE2eUser } from '$lib/test/e2e-auth';

test.describe('home dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsE2eUser(page);
	});

	test('renders dashboard composition with hero and project grid', async ({ page }) => {
		await expect(page.getByTestId('app-root')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
		await expect(page.getByText('Continue editing')).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'How I edit videos 3x faster', level: 2 })
		).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Recent projects', level: 2 })).toBeVisible();
		await expect(page.getByText('Q3 launch recap')).toBeVisible();
	});

	test('new project navigates to import gateway without creating a project', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'New project' })).toBeVisible();
		await page.getByRole('button', { name: 'New project' }).click();

		await expect(page).toHaveURL('/projects/new');
		await expect(page.getByTestId('new-project-page')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Start your video' })).toBeVisible();
	});

	test('shows draft project cards and opens the import gateway on click', async ({ page }) => {
		await expect(page.getByText('Untitled draft')).toBeVisible();
		await expect(page.getByText('Waiting for footage')).toBeVisible();

		await page.getByRole('button', { name: /Untitled draft/i }).click();

		await expect(page).toHaveURL(/\/projects\/proj-no-transcript$/);
		await expect(page.getByTestId('project-import-shell')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Start your video' })).toBeVisible();
	});
});
