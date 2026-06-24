import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import TransportControlsHarness from './TransportControls.harness.svelte';

describe('TransportControls.svelte', () => {
	it('renders transport group with timecode', async () => {
		render(TransportControlsHarness, { playing: false, current: 65, total: 272 });

		await expect
			.element(page.getByRole('group', { name: 'Transport controls' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('1:05')).toBeInTheDocument();
		await expect.element(page.getByText('4:32')).toBeInTheDocument();
	});

	it('shows Play label when paused', async () => {
		render(TransportControlsHarness, { playing: false });

		await expect.element(page.getByRole('button', { name: 'Play' })).toBeInTheDocument();
	});

	it('shows Pause label when playing', async () => {
		render(TransportControlsHarness, { playing: true });

		await expect.element(page.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
	});

	it('fires ontogglePlay on play button click', async () => {
		const ontogglePlay = vi.fn();
		render(TransportControlsHarness, { playing: false, ontogglePlay });

		await userEvent.click(page.getByRole('button', { name: 'Play' }));

		expect(ontogglePlay).toHaveBeenCalledOnce();
	});

	it('fires ontoStart and ontoEnd on skip buttons', async () => {
		const ontoStart = vi.fn();
		const ontoEnd = vi.fn();
		render(TransportControlsHarness, { ontoStart, ontoEnd });

		await userEvent.click(page.getByRole('button', { name: 'Skip to start' }));
		await userEvent.click(page.getByRole('button', { name: 'Skip to end' }));

		expect(ontoStart).toHaveBeenCalledOnce();
		expect(ontoEnd).toHaveBeenCalledOnce();
	});
});
