import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import TimelineRulerHarness from './TimelineRuler.harness.svelte';

describe('TimelineRuler.svelte', () => {
	it('renders tick labels from props', async () => {
		render(TimelineRulerHarness);

		await expect.element(page.getByText('0:00')).toBeInTheDocument();
		await expect.element(page.getByText('0:34')).toBeInTheDocument();
		await expect.element(page.getByText('1:08')).toBeInTheDocument();
	});

	it('renders empty when ticks array is empty', async () => {
		render(TimelineRulerHarness, { ticks: [] });

		await expect.element(page.getByText('0:00')).not.toBeInTheDocument();
	});
});
