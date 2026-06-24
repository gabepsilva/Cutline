import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import InputHarness from './Input.harness.svelte';

describe('Input.svelte', () => {
	it('renders search field with placeholder', async () => {
		render(InputHarness, { placeholder: 'Search transcript' });

		await expect
			.element(page.getByRole('searchbox', { name: 'Search transcript' }))
			.toBeInTheDocument();
	});

	it('fires oninput when typing', async () => {
		const oninput = vi.fn();
		render(InputHarness, { value: '', oninput });

		await userEvent.fill(page.getByRole('searchbox', { name: 'Search transcript' }), 'hello');

		expect(oninput).toHaveBeenCalled();
	});

	it('applies surface and border tokens', async () => {
		render(InputHarness);

		const field = await page.getByRole('searchbox', { name: 'Search transcript' }).element();
		const wrapper = field.parentElement as HTMLElement;
		const styles = getComputedStyle(wrapper);

		expect(styles.backgroundColor).toBe('rgb(20, 20, 23)');
		expect(styles.borderColor).toBe('rgb(35, 35, 40)');
	});

	it('does not accept input when disabled', async () => {
		render(InputHarness, { disabled: true });

		await expect.element(page.getByRole('searchbox', { name: 'Search transcript' })).toBeDisabled();
	});
});
