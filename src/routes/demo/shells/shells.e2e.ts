import { expect, test } from '@playwright/test';

test.describe('/demo/shells smoke', () => {
	test('app boots and both layout shells mount', async ({ page }) => {
		await page.goto('/demo/shells');

		await expect(page.getByTestId('app-root')).toBeVisible();
		await expect(page.getByTestId('shells-preview')).toBeVisible();
		await expect(page.getByTestId('shells-dashboard')).toBeVisible();
		await expect(page.getByTestId('shells-editor')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
		await expect(page.getByTestId('editor-timeline-placeholder')).toContainText(
			'Timeline pending — M2-17'
		);
	});

	test('preview route is not indexed', async ({ page }) => {
		await page.goto('/demo/shells');

		const robots = page.locator('meta[name="robots"]');
		await expect(robots).toHaveAttribute('content', /noindex/);
	});
});
