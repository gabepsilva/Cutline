import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import IconButtonHarness from './IconButton.harness.svelte';

describe('IconButton.svelte', () => {
	it('exposes aria-label from label prop', async () => {
		render(IconButtonHarness, { label: 'Close panel' });

		await expect.element(page.getByRole('button', { name: 'Close panel' })).toBeInTheDocument();
	});

	it('fires onclick on click', async () => {
		const onclick = vi.fn();
		render(IconButtonHarness, { label: 'Play', variant: 'primary', onclick });

		await userEvent.click(page.getByRole('button', { name: 'Play' }));

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('applies variant size dimensions', async () => {
		render(IconButtonHarness, { label: 'Previous', variant: 'ghost', size: 'md' });

		const button = await page.getByRole('button', { name: 'Previous' }).element();
		const styles = getComputedStyle(button);

		expect(styles.width).toBe('30px');
		expect(styles.height).toBe('30px');
	});

	it('forwards a custom class onto the button', async () => {
		render(IconButtonHarness, { label: 'Settings', class: 'is-active' });

		const button = await page.getByRole('button', { name: 'Settings' }).element();

		expect(button.classList.contains('is-active')).toBe(true);
	});

	it('does not fire onclick when disabled', async () => {
		const onclick = vi.fn();
		render(IconButtonHarness, { label: 'Zoom in', variant: 'bordered', disabled: true, onclick });

		const button = page.getByRole('button', { name: 'Zoom in' });
		await expect.element(button).toBeDisabled();

		const el = (await button.element()) as HTMLButtonElement;
		el.click();

		expect(onclick).not.toHaveBeenCalled();
	});
});
