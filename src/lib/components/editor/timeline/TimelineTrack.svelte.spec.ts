import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import TimelineTrackHarness from './TimelineTrack.harness.svelte';

describe('TimelineTrack.svelte', () => {
	it('renders empty-state content in a track row', async () => {
		render(TimelineTrackHarness, { showEmpty: true });

		await expect
			.element(page.getByText('Record or add B-roll — clips drop here at the playhead'))
			.toBeInTheDocument();
	});

	it('renders custom track content when not empty', async () => {
		render(TimelineTrackHarness, { showEmpty: false });

		await expect.element(page.getByTestId('track-content')).toBeInTheDocument();
	});
});
