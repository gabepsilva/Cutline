import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import TimelineWaveformHarness from './TimelineWaveform.harness.svelte';

describe('TimelineWaveform.svelte', () => {
	it('renders waveform bars', async () => {
		render(TimelineWaveformHarness);

		const bars = document.querySelectorAll('.timeline-waveform__bar--unplayed');
		expect(bars.length).toBeGreaterThan(0);
	});

	it('renders played overlay bars', async () => {
		render(TimelineWaveformHarness, { playedPercent: 50 });

		const playedOverlay = document.querySelector('.timeline-waveform__played') as HTMLElement;
		expect(playedOverlay).not.toBeNull();
		expect(playedOverlay.style.width).toBe('50%');
	});

	it('handles empty bars gracefully', async () => {
		render(TimelineWaveformHarness, { bars: [] });

		const bars = document.querySelectorAll('.timeline-waveform__bar--unplayed');
		expect(bars.length).toBe(0);
	});
});
