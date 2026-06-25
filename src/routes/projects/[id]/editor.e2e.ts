import { expect, test } from '@playwright/test';
import { MOCK_EMPTY_TRANSCRIPT_PROJECT_ID } from '$lib/mocks/editor.mock';

test.describe('editor route', () => {
	test('renders editor workspace with transcript and preview for a seeded project', async ({
		page
	}) => {
		await page.goto('/projects/proj-hero');

		await expect(page.getByTestId('editor-workspace')).toBeVisible();
		await expect(page.getByText('How I edit videos 3x faster')).toBeVisible();
		await expect(page.getByText('Auto-saved · MP4 1080p')).toBeVisible();
		await expect(page.getByRole('region', { name: 'Transcript' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Preview' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Timeline' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Okay, current' })).toBeVisible();
	});

	test('shows empty transcript state for projects without transcript data', async ({ page }) => {
		await page.goto(`/projects/${MOCK_EMPTY_TRANSCRIPT_PROJECT_ID}`);

		await expect(page.getByTestId('editor-workspace')).toBeVisible();
		await expect(page.getByText('No transcript yet')).toBeVisible();
		await expect(page.getByRole('region', { name: 'Transcript' })).not.toBeVisible();
	});

	test('transport play button toggles playback', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		const transport = page.getByRole('group', { name: 'Transport controls' });
		const playButton = transport.getByRole('button', { name: 'Play' });
		await expect(playButton).toBeVisible();
		await playButton.click();
		await expect(transport.getByRole('button', { name: 'Pause' })).toBeVisible();
	});

	test('timeline lane click seeks playback', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		const transport = page.getByRole('group', { name: 'Transport controls' });
		const currentTime = transport.locator('.timecode-display__current');
		await expect(currentTime).toHaveText('0:00');

		const timelineLanes = page.getByRole('button', { name: 'Timeline tracks' });
		const box = await timelineLanes.boundingBox();
		expect(box).not.toBeNull();
		if (!box) return;

		await timelineLanes.click({ position: { x: box.width * 0.75, y: box.height * 0.5 } });
		await expect(currentTime).not.toHaveText('0:00');
	});
});
