import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import EditorIconRailHarness from './EditorIconRail.harness.svelte';

describe('EditorIconRail.svelte', () => {
	it('renders tool buttons from design', async () => {
		render(EditorIconRailHarness);

		await expect
			.element(page.getByRole('navigation', { name: 'Editor tools' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Record' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Audio' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Media' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
	});

	it('applies rail width token', async () => {
		render(EditorIconRailHarness);

		const rail = await page.getByRole('navigation', { name: 'Editor tools' }).element();
		const styles = getComputedStyle(rail);

		expect(styles.width).toBe('54px');
		expect(styles.backgroundColor).toBe('rgb(12, 12, 14)');
	});

	it('fires onitemclick when a tool is clicked', async () => {
		const onitemclick = vi.fn();
		render(EditorIconRailHarness, { onitemclick });

		await userEvent.click(page.getByRole('button', { name: 'Record' }));

		expect(onitemclick).toHaveBeenCalledOnce();
		expect(onitemclick.mock.calls[0][0].id).toBe('record');
	});
});
