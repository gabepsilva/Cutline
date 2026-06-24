import { expect, test } from '@playwright/test';

test.describe('home dashboard', () => {
	test('renders dashboard composition with hero and project grid', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByTestId('app-root')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
		await expect(page.getByText('Continue editing')).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'How I edit videos 3x faster', level: 2 })
		).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Recent projects', level: 2 })).toBeVisible();
		await expect(page.getByText('Q3 launch recap')).toBeVisible();
	});
});
