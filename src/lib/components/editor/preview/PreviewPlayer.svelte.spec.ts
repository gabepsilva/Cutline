import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import PreviewPlayerHarness from './PreviewPlayer.harness.svelte';

describe('PreviewPlayer.svelte', () => {
	it('renders default structure with rec badge and timecode', async () => {
		render(PreviewPlayerHarness, { playing: false, currentTime: 65 });

		await expect.element(page.getByText('REC 1080p')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Current time')).toHaveTextContent('1:05');
		await expect.element(page.getByRole('button', { name: 'Play preview' })).toBeInTheDocument();
	});

	it('shows pause label and icon when playing', async () => {
		render(PreviewPlayerHarness, { playing: true, currentTime: 12 });

		await expect.element(page.getByRole('button', { name: 'Pause preview' })).toBeInTheDocument();
		await expect.element(page.getByLabelText('Current time')).toHaveTextContent('0:12');
	});

	it('updates timecode when currentTime prop changes', async () => {
		render(PreviewPlayerHarness, { playing: false, currentTime: 272 });

		await expect.element(page.getByLabelText('Current time')).toHaveTextContent('4:32');
	});

	it('renders custom rec label', async () => {
		render(PreviewPlayerHarness, { recLabel: 'REC 720p' });

		await expect.element(page.getByText('REC 720p')).toBeInTheDocument();
	});

	it('fires ontogglePlay on play button click', async () => {
		const ontogglePlay = vi.fn();
		render(PreviewPlayerHarness, { playing: false, ontogglePlay });

		await userEvent.click(page.getByRole('button', { name: 'Play preview' }));

		expect(ontogglePlay).toHaveBeenCalledOnce();
	});

	it('activates play toggle on keyboard Enter', async () => {
		const ontogglePlay = vi.fn();
		render(PreviewPlayerHarness, { playing: false, ontogglePlay });

		const playButton = (await page
			.getByRole('button', { name: 'Play preview' })
			.element()) as HTMLButtonElement;
		playButton.focus();
		await userEvent.keyboard('{Enter}');

		expect(ontogglePlay).toHaveBeenCalledOnce();
	});

	it('renders video element when videoUrl is provided', async () => {
		render(PreviewPlayerHarness, {
			videoUrl: 'https://example.com/preview.mp4',
			showSimulated: false
		});

		const video = await page.getByLabelText('Project preview video').element();
		expect(video.tagName).toBe('VIDEO');
		expect(video.getAttribute('src')).toBe('https://example.com/preview.mp4');
	});

	it('hides simulated placeholder when videoUrl is set', async () => {
		render(PreviewPlayerHarness, {
			videoUrl: 'https://example.com/preview.mp4',
			showSimulated: true
		});

		const player = await page.getByRole('button', { name: 'Play preview' }).element();
		const simulated = player
			.closest('.preview-player')
			?.querySelector('.preview-player__simulated');

		expect(simulated).toBeNull();
	});

	it('renders simulated framing when no videoUrl', async () => {
		render(PreviewPlayerHarness, { videoUrl: null, showSimulated: true });

		const player = await page.getByRole('button', { name: 'Play preview' }).element();
		const simulated = player
			.closest('.preview-player')
			?.querySelector('.preview-player__simulated');

		expect(simulated).not.toBeNull();
	});

	it('handles zero currentTime gracefully', async () => {
		render(PreviewPlayerHarness, { currentTime: 0 });

		await expect.element(page.getByLabelText('Current time')).toHaveTextContent('0:00');
	});
});
