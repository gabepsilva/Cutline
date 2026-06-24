import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import RecordModalHarness from './RecordModal.harness.svelte';

describe('RecordModal.svelte', () => {
	it('renders record dialog with source tabs in preview step', async () => {
		render(RecordModalHarness, { open: true, step: 'preview' });

		await expect.element(page.getByRole('dialog')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Record' })).toBeInTheDocument();
		await expect.element(page.getByRole('group', { name: 'Recording source' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Start recording' })).toBeInTheDocument();
	});

	it('shows stop button while recording', async () => {
		render(RecordModalHarness, { recording: true, elapsedLabel: '0:45' });

		await expect
			.element(page.getByRole('button', { name: 'Stop & save · 0:45' }))
			.toBeInTheDocument();
	});

	it('shows countdown waiting status', async () => {
		render(RecordModalHarness, { countingDown: true, countdown: 2 });

		await expect.element(page.getByText('Get ready…')).toBeInTheDocument();
		await expect.element(page.getByText('2')).toBeInTheDocument();
	});

	it('renders review step actions', async () => {
		render(RecordModalHarness, {
			step: 'review',
			reviewName: 'Screen capture',
			reviewDurationLabel: '0:12'
		});

		await expect.element(page.getByText('Screen capture')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Keep in library' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Add to timeline at playhead' }))
			.toBeInTheDocument();
	});

	it('fires onstart when start recording is clicked', async () => {
		const onstart = vi.fn();
		render(RecordModalHarness, { onstart });

		await userEvent.click(page.getByRole('button', { name: 'Start recording' }));

		expect(onstart).toHaveBeenCalledOnce();
	});

	it('fires onstop when stop button is clicked', async () => {
		const onstop = vi.fn();
		render(RecordModalHarness, { recording: true, elapsedLabel: '0:10', onstop });

		await userEvent.click(page.getByRole('button', { name: 'Stop & save · 0:10' }));

		expect(onstop).toHaveBeenCalledOnce();
	});

	it('fires onsourcechange when a source chip is clicked', async () => {
		const onsourcechange = vi.fn();
		render(RecordModalHarness, { onsourcechange });

		await userEvent.click(page.getByRole('button', { name: 'Screen', exact: true }));

		expect(onsourcechange).toHaveBeenCalledOnce();
		expect(onsourcechange).toHaveBeenCalledWith('screen');
	});

	it('fires onclose on Escape key', async () => {
		const onclose = vi.fn();
		render(RecordModalHarness, { onclose });

		await userEvent.keyboard('{Escape}');

		expect(onclose).toHaveBeenCalledOnce();
	});
});
