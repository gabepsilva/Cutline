import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ToggleHarness from './Toggle.harness.svelte';

describe('Toggle.svelte', () => {
	it('exposes switch role with aria-label', async () => {
		render(ToggleHarness, { label: 'Snap' });

		await expect.element(page.getByRole('switch', { name: 'Snap' })).toBeInTheDocument();
	});

	it('reflects checked state via aria-checked', async () => {
		render(ToggleHarness, { label: 'Snap', checked: true });

		const toggle = await page.getByRole('switch', { name: 'Snap' }).element();
		expect(toggle.getAttribute('aria-checked')).toBe('true');
	});

	it('applies sm size dimensions', async () => {
		render(ToggleHarness, { label: 'Snap', size: 'sm', checked: true });

		const toggle = await page.getByRole('switch', { name: 'Snap' }).element();
		const styles = getComputedStyle(toggle);

		expect(styles.width).toBe('30px');
		expect(styles.height).toBe('17px');
		expect(styles.backgroundColor).toBe('rgb(255, 106, 61)');
	});

	it('applies md size dimensions when unchecked', async () => {
		render(ToggleHarness, { label: 'Burn in captions', size: 'md', checked: false });

		const toggle = await page.getByRole('switch', { name: 'Burn in captions' }).element();
		const styles = getComputedStyle(toggle);

		expect(styles.width).toBe('38px');
		expect(styles.height).toBe('22px');
		expect(styles.backgroundColor).toBe('rgb(23, 23, 26)');
	});

	it('calls onchange with toggled value on click', async () => {
		const onchange = vi.fn();
		render(ToggleHarness, { label: 'Snap', checked: false, onchange });

		await userEvent.click(page.getByRole('switch', { name: 'Snap' }));

		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledWith(true);
	});

	it('does not call onchange when disabled', async () => {
		const onchange = vi.fn();
		render(ToggleHarness, { label: 'Snap', disabled: true, onchange });

		const toggle = page.getByRole('switch', { name: 'Snap' });
		await expect.element(toggle).toBeDisabled();

		const el = (await toggle.element()) as HTMLButtonElement;
		el.click();

		expect(onchange).not.toHaveBeenCalled();
	});

	it('toggles on keyboard Space', async () => {
		const onchange = vi.fn();
		render(ToggleHarness, { label: 'Snap', checked: true, onchange });

		const el = (await page.getByRole('switch', { name: 'Snap' }).element()) as HTMLButtonElement;
		el.focus();
		await userEvent.keyboard(' ');

		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledWith(false);
	});
});
