import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
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
});
