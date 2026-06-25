import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { fixtureTimelineOverlay } from '$lib/test/fixtures/timeline-overlay';
import { render } from '$lib/test/render';
import TimelineTrackHarness from './TimelineTrack.harness.svelte';

describe('TimelineTrack.svelte', () => {
	it('renders a generic track row with child content', async () => {
		render(TimelineTrackHarness);

		await expect.element(page.getByTestId('track-content')).toBeInTheDocument();
		await expect.element(page.getByText('Track content')).toBeInTheDocument();
	});

	it('renders waveform variant class', async () => {
		render(TimelineTrackHarness, { label: 'Waveform lane', variant: 'waveform' });

		const track = document.querySelector('.timeline-track--waveform');
		expect(track).not.toBeNull();
		await expect.element(page.getByText('Waveform lane')).toBeInTheDocument();
	});

	it('renders b-roll empty state from the design', async () => {
		render(TimelineTrackHarness, { variant: 'broll', overlays: [] });

		await expect
			.element(page.getByText('Record or add B-roll — clips drop here at the playhead'))
			.toBeInTheDocument();
		await expect.element(page.getByRole('status')).toBeInTheDocument();
	});

	it('positions b-roll overlays from overlay props', async () => {
		render(TimelineTrackHarness, { variant: 'broll' });

		const overlay = document.querySelector<HTMLElement>('[data-overlay-id="o-media-broll-1-0"]');
		expect(overlay).not.toBeNull();
		expect(overlay?.style.left).toBe('20%');
		expect(overlay?.style.width).toBe('10.33%');
		await expect.element(page.getByText('Office wide shot')).toBeInTheDocument();
	});

	it('updates overlay layout when totalDuration changes', async () => {
		render(TimelineTrackHarness, { variant: 'broll', totalDuration: 60 });

		const overlay = document.querySelector<HTMLElement>('[data-overlay-id="o-media-broll-1-0"]');
		expect(overlay?.style.left).toBe('40%');
	});

	it('fires onoverlayclick when an overlay is clicked', async () => {
		const onoverlayclick = vi.fn();
		render(TimelineTrackHarness, { variant: 'broll', onoverlayclick });

		await userEvent.click(page.getByRole('button', { name: 'Seek to Office wide shot' }));

		expect(onoverlayclick).toHaveBeenCalledOnce();
		expect(onoverlayclick).toHaveBeenCalledWith(fixtureTimelineOverlay);
	});

	it('fires onoverlayremove when remove is clicked', async () => {
		const onoverlayremove = vi.fn();
		render(TimelineTrackHarness, { variant: 'broll', onoverlayremove });

		await userEvent.click(page.getByRole('button', { name: 'Remove Office wide shot' }));

		expect(onoverlayremove).toHaveBeenCalledOnce();
		expect(onoverlayremove).toHaveBeenCalledWith('o-media-broll-1-0');
	});

	it('exposes accessible labels on overlay controls', async () => {
		render(TimelineTrackHarness, { variant: 'broll' });

		await expect
			.element(page.getByRole('button', { name: 'Seek to Office wide shot' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Remove Office wide shot' }))
			.toBeInTheDocument();
	});

	it('renders with an empty overlays array without crashing', async () => {
		render(TimelineTrackHarness, { variant: 'broll', overlays: [], totalDuration: 0 });

		await expect
			.element(page.getByText('Record or add B-roll — clips drop here at the playhead'))
			.toBeInTheDocument();
	});
});
