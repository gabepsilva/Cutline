import { expect, test } from '@playwright/test';
import { totalDuration } from '$lib/editor/editor-derive';
import { buildMockTranscript, MOCK_EMPTY_TRANSCRIPT_PROJECT_ID } from '$lib/mocks/editor.mock';
import { loginAsE2eUser } from '$lib/test/e2e-auth';
import { formatTimecode } from '$lib/utils/format-timecode';

test.describe('editor route', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsE2eUser(page);
	});

	test('renders editor workspace with transcript and preview for a seeded project', async ({
		page
	}) => {
		await page.goto('/projects/proj-hero');

		await expect(page.getByTestId('editor-workspace')).toBeVisible();
		await expect(page.getByText('How I edit videos 3x faster')).toBeVisible();
		await expect(page.getByText('Auto-saved')).toBeVisible();
		await expect(page.getByRole('region', { name: 'Transcript' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Preview' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Timeline' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Okay, current' })).toBeVisible();
	});

	test('shows import gateway when reopening a draft project', async ({ page }) => {
		await page.goto(`/projects/${MOCK_EMPTY_TRANSCRIPT_PROJECT_ID}`);

		await expect(page.getByTestId('project-import-shell')).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Start your video' })).toBeVisible();
		await expect(page.getByTestId('editor-workspace')).not.toBeVisible();
	});

	test('opens full editor when the project has a completed upload', async ({ page }) => {
		await page.goto('/projects/e2e-upload-ready');

		await expect(page.getByTestId('editor-workspace')).toBeVisible();
		await expect(page.getByTestId('project-import-shell')).not.toBeVisible();
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

		const { words } = buildMockTranscript();
		const seekRatio = 0.75;
		const expectedTime = formatTimecode(totalDuration(words) * seekRatio);

		const transport = page.getByRole('group', { name: 'Transport controls' });
		const currentTime = transport.locator('.timecode-display__current');
		await expect(currentTime).toHaveText('0:00');

		const timelineLanes = page.getByRole('group', { name: 'Timeline tracks' });
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

	test('media shelf opens and adds a clip to the timeline', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		await page.getByRole('button', { name: /Media ·/ }).click();
		await expect(page.getByRole('region', { name: 'Media library' })).toBeVisible();
		await expect(page.getByText('City timelapse')).toBeVisible();

		await page.getByRole('button', { name: 'City timelapse' }).click();
		await expect(page.getByRole('region', { name: 'Media library' })).not.toBeVisible();
	});

	test('export modal runs through config and progress states', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		await page.getByRole('button', { name: 'Export' }).click();
		await expect(page.getByRole('dialog', { name: 'Export video' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Export ·/ })).toBeVisible();

		await page.getByRole('button', { name: /Export ·/ }).click();
		await expect(page.getByText('Exporting…')).toBeVisible();
	});

	test('record modal opens from timeline toolbar', async ({ page }) => {
		await page.goto('/projects/proj-hero');

		await page
			.getByRole('region', { name: 'Timeline' })
			.getByRole('button', { name: 'Record' })
			.click();
		await expect(page.getByRole('dialog', { name: 'Record' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
	});

	test('shows transcribing gated UI while a transcription job runs', async ({ page }) => {
		await page.goto('/projects/e2e-transcribing');

		await expect(page.getByTestId('editor-workspace')).toBeVisible();
		await expect(page.getByText('Transcribing · 45%')).toBeVisible();
		await expect(page.getByText('Generating transcript…')).toBeVisible();
		await expect(page.getByRole('searchbox', { name: 'Search transcript' })).not.toBeVisible();
		await expect(page.getByText('Captions appear once transcription finishes.')).toBeVisible();

		const transport = page.getByRole('group', { name: 'Transport controls' });
		await expect(transport.getByRole('button', { name: 'Play' })).toBeVisible();
	});

	test('mock transcription completes and unlocks transcript editing', async ({ page }) => {
		await page.goto('/projects/e2e-transcribing-mock');

		await expect(page.getByRole('button', { name: /^Remove fillers · [1-9]/ })).toBeVisible({
			timeout: 15_000
		});
		await expect(page.getByText(/Transcribing ·/)).not.toBeVisible();
		await expect(page.getByRole('searchbox', { name: 'Search transcript' })).toBeVisible();
	});
});
