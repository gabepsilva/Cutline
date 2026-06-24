import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ButtonHarness from './Button.harness.svelte';

describe('Button.svelte', () => {
	it('renders label text', async () => {
		render(ButtonHarness, { label: 'Export' });

		await expect.element(page.getByRole('button', { name: 'Export' })).toBeInTheDocument();
	});

	it('applies primary variant token colors', async () => {
		render(ButtonHarness, { label: 'Export', variant: 'primary' });

		const button = await page.getByRole('button', { name: 'Export' }).element();
		const styles = getComputedStyle(button);

		expect(styles.backgroundColor).toBe('rgb(255, 106, 61)');
		expect(styles.color).toBe('rgb(11, 11, 13)');
		expect(styles.fontWeight).toBe('600');
	});

	it('fires onclick on click', async () => {
		const onclick = vi.fn();
		render(ButtonHarness, { label: 'Share', onclick });

		await userEvent.click(page.getByRole('button', { name: 'Share' }));

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('does not fire onclick when disabled', async () => {
		const onclick = vi.fn();
		render(ButtonHarness, { label: 'Share', disabled: true, onclick });

		const button = page.getByRole('button', { name: 'Share' });
		await expect.element(button).toBeDisabled();

		const el = (await button.element()) as HTMLButtonElement;
		el.click();

		expect(onclick).not.toHaveBeenCalled();
	});

	it('activates on keyboard Enter', async () => {
		const onclick = vi.fn();
		render(ButtonHarness, { label: 'New project', onclick });

		const el = (await page
			.getByRole('button', { name: 'New project' })
			.element()) as HTMLButtonElement;
		el.focus();
		await userEvent.keyboard('{Enter}');

		expect(onclick).toHaveBeenCalledOnce();
	});
});
