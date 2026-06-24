import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import TimelinePlayheadHarness from './TimelinePlayhead.harness.svelte';

describe('TimelinePlayhead.svelte', () => {
	it('positions playhead at the given percentage', async () => {
		render(TimelinePlayheadHarness, { positionPercent: 42 });

		const playhead = page.getByTestId('timeline-playhead');
		await expect.element(playhead).toHaveStyle({ left: '42%' });
	});
});
