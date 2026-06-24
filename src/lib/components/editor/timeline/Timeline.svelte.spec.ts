import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import TimelineHarness from './Timeline.harness.svelte';

describe('Timeline.svelte', () => {
	it('renders timeline region with track labels and ruler ticks', async () => {
		render(TimelineHarness);

		await expect.element(page.getByRole('region', { name: 'Timeline' })).toBeInTheDocument();
		await expect.element(page.getByText('B-ROLL', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('V1')).toBeInTheDocument();
		await expect.element(page.getByText('A1')).toBeInTheDocument();
		await expect.element(page.getByText('CC')).toBeInTheDocument();
		await expect.element(page.getByText('0:00')).toBeInTheDocument();
	});

	it('renders b-roll empty state and caption clip labels', async () => {
		render(TimelineHarness);

		await expect
			.element(page.getByText('Record or add B-roll — clips drop here at the playhead'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Welcome to Cutline')).toBeInTheDocument();
	});

	it('fires toolbar callbacks and onseek on lane click', async () => {
		const onrecord = vi.fn();
		const onmedia = vi.fn();
		const onseek = vi.fn();
		render(TimelineHarness, { onrecord, onmedia, onseek });

		await userEvent.click(page.getByRole('button', { name: 'Record' }));
		await userEvent.click(page.getByRole('button', { name: /Media ·/ }));
		await userEvent.click(page.getByText('0:00'));

		expect(onrecord).toHaveBeenCalledOnce();
		expect(onmedia).toHaveBeenCalledOnce();
		expect(onseek).toHaveBeenCalledOnce();
	});
});
