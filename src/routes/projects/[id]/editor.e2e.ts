import { expect, test } from '@playwright/test';
import { totalDuration } from '$lib/editor/editor-derive';
import { loadMockEditorProject, MOCK_EMPTY_TRANSCRIPT_PROJECT_ID } from '$lib/mocks/editor.mock';
import { formatTimecode } from '$lib/utils/format-timecode';

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

		const project = loadMockEditorProject('proj-hero');
		expect(project).not.toBeNull();
		const seekRatio = 0.75;
		const expectedTime = formatTimecode(totalDuration(project!.words) * seekRatio);

		const transport = page.getByRole('group', { name: 'Transport controls' });
		const currentTime = transport.locator('.timecode-display__current');
		await expect(currentTime).toHaveText('0:00');

		const timelineLanes = page.getByRole('button', { name: 'Timeline tracks' });
		const box = await timelineLanes.boundingBox();
		expect(box).not.toBeNull();

		await timelineLanes.click({
			position: { x: box!.width * seekRatio, y: box!.height * 0.5 }
		});
		await expect(currentTime).toHaveText(expectedTime);
	});

	test('spacebar toggles playback when focus is outside inputs', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		const transport = page.getByRole('group', { name: 'Transport controls' });
		await expect(transport.getByRole('button', { name: 'Play' })).toBeVisible();

		await page.getByTestId('editor-workspace').click();
		await page.keyboard.press('Space');
		await expect(transport.getByRole('button', { name: 'Pause' })).toBeVisible();

		await page.keyboard.press('Space');
		await expect(transport.getByRole('button', { name: 'Play' })).toBeVisible();
	});

	test('Remove fillers action soft-deletes all filler words', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		const removeFillers = page.getByRole('button', { name: /^Remove fillers · [1-9]/ });
		await expect(removeFillers).toBeVisible();

		await removeFillers.click();

		await expect(page.getByRole('button', { name: 'Remove fillers · 0' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'um,, deleted' })).toBeVisible();
	});

	test('Delete key toggles delete on the selected word', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		const word = page.getByRole('button', { name: 'people', exact: true });
		await word.click();
		await expect(page.getByText('Selected')).toBeVisible();

		await page.getByTestId('editor-workspace').click();
		await page.keyboard.press('Delete');
		await expect(page.getByRole('button', { name: 'people, deleted' })).toBeVisible();

		await page.keyboard.press('Backspace');
		await expect(page.getByRole('button', { name: 'people, current' })).toBeVisible();
	});
});
