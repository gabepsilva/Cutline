import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import TimelineToolbarHarness from './TimelineToolbar.harness.svelte';

describe('TimelineToolbar.svelte', () => {
	it('renders title, media count, and snap control', async () => {
		render(TimelineToolbarHarness, { resourceCount: 5 });

		await expect.element(page.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Media · 5/ })).toBeInTheDocument();
		await expect.element(page.getByRole('switch', { name: 'Snap' })).toBeInTheDocument();
	});

	it('fires onrecord and onmedia on toolbar actions', async () => {
		const onrecord = vi.fn();
		const onmedia = vi.fn();
		render(TimelineToolbarHarness, { onrecord, onmedia });

		await userEvent.click(page.getByRole('button', { name: 'Record' }));
		await userEvent.click(page.getByRole('button', { name: /Media ·/ }));

		expect(onrecord).toHaveBeenCalledOnce();
		expect(onmedia).toHaveBeenCalledOnce();
	});

	it('fires onsnapchange when snap toggle is clicked', async () => {
		const onsnapchange = vi.fn();
		render(TimelineToolbarHarness, { snapEnabled: true, onsnapchange });

		await userEvent.click(page.getByRole('switch', { name: 'Snap' }));

		expect(onsnapchange).toHaveBeenCalledOnce();
		expect(onsnapchange.mock.calls[0][0]).toBe(false);
	});
});
