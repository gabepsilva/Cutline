import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import RecordSourceTabsHarness from './RecordSourceTabs.harness.svelte';

describe('RecordSourceTabs.svelte', () => {
	it('renders recording source chip group', async () => {
		render(RecordSourceTabsHarness);

		await expect.element(page.getByRole('group', { name: 'Recording source' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Camera', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Screen', exact: true }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Camera + Screen' })).toBeInTheDocument();
	});

	it('reflects selected source chip', async () => {
		render(RecordSourceTabsHarness, { selected: 'screen' });

		const screen = await page.getByRole('button', { name: 'Screen', exact: true }).element();
		expect(screen.getAttribute('aria-pressed')).toBe('true');
	});

	it('fires onselect when a source chip is clicked', async () => {
		const onselect = vi.fn();
		render(RecordSourceTabsHarness, { onselect });

		await userEvent.click(page.getByRole('button', { name: 'Camera + Screen' }));

		expect(onselect).toHaveBeenCalledOnce();
		expect(onselect).toHaveBeenCalledWith('camera-screen');
	});

	it('activates source chip on keyboard Enter', async () => {
		const onselect = vi.fn();
		render(RecordSourceTabsHarness, { onselect });

		const chip = (await page
			.getByRole('button', { name: 'Screen', exact: true })
			.element()) as HTMLButtonElement;
		chip.focus();
		await userEvent.keyboard('{Enter}');

		expect(onselect).toHaveBeenCalledOnce();
		expect(onselect).toHaveBeenCalledWith('screen');
	});
});
