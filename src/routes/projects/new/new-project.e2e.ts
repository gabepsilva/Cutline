import { expect, test } from '@playwright/test';
import { loginAsE2eUser } from '$lib/test/e2e-auth';

async function mockR2Upload(page: import('@playwright/test').Page) {
	await page.route('**/*', async (route) => {
		const request = route.request();
		if (request.method() === 'PUT' && !request.url().includes('localhost:4173')) {
			await route.fulfill({ status: 200 });
			return;
		}
		await route.continue();
	});
}

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
		await expect(page.getByTestId('project-import-timeline-placeholder')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled();
	});

	test('back to projects navigates home', async ({ page }) => {
		await page.goto('/projects/new');

		await page.getByRole('button', { name: 'Projects' }).click();
		await expect(page).toHaveURL('/');
	});

	test('uploading footage navigates to the full editor', async ({ page }) => {
		await mockR2Upload(page);
		await page.goto('/projects/new');

		const fileInput = page.locator('.import-gateway__file-input');
		await fileInput.setInputFiles({
			name: 'clip.mp4',
			mimeType: 'video/mp4',
			buffer: Buffer.from('fake-video-bytes')
		});

		await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/, { timeout: 30_000 });
		await expect(page.getByTestId('editor-workspace')).toBeVisible({ timeout: 30_000 });
	});
});
