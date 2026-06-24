import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ChipHarness from './Chip.harness.svelte';

describe('Chip.svelte', () => {
	it('renders label text', async () => {
		render(ChipHarness, { label: 'Karaoke' });

		await expect.element(page.getByRole('button', { name: 'Karaoke' })).toBeInTheDocument();
	});

	it('applies selected token colors', async () => {
		render(ChipHarness, { label: 'Karaoke', selected: true });

		const chip = await page.getByRole('button', { name: 'Karaoke' }).element();
		const styles = getComputedStyle(chip);

		expect(chip.getAttribute('aria-pressed')).toBe('true');
		expect(styles.borderColor).toBe('rgb(255, 106, 61)');
		expect(styles.color).toBe('rgb(243, 242, 240)');
		expect(chip.classList.contains('chip--selected')).toBe(true);
	});

	it('applies unselected token colors', async () => {
		render(ChipHarness, { label: 'Clean', selected: false });

		const chip = await page.getByRole('button', { name: 'Clean' }).element();
		const styles = getComputedStyle(chip);

		expect(chip.getAttribute('aria-pressed')).toBe('false');
		expect(styles.backgroundColor).toBe('rgb(23, 23, 26)');
		expect(styles.borderColor).toBe('rgb(38, 38, 43)');
		expect(styles.color).toBe('rgb(163, 162, 168)');
	});

	it('fires onclick on click', async () => {
		const onclick = vi.fn();
		render(ChipHarness, { label: 'Clean', onclick });

		await userEvent.click(page.getByRole('button', { name: 'Clean' }));

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('does not fire onclick when disabled', async () => {
		const onclick = vi.fn();
		render(ChipHarness, { label: 'Clean', disabled: true, onclick });

		const chip = page.getByRole('button', { name: 'Clean' });
		await expect.element(chip).toBeDisabled();

		const el = (await chip.element()) as HTMLButtonElement;
		el.click();

		expect(onclick).not.toHaveBeenCalled();
	});

	it('activates on keyboard Enter', async () => {
		const onclick = vi.fn();
		render(ChipHarness, { label: 'Karaoke', onclick });

		const el = (await page.getByRole('button', { name: 'Karaoke' }).element()) as HTMLButtonElement;
		el.focus();
		await userEvent.keyboard('{Enter}');

		expect(onclick).toHaveBeenCalledOnce();
	});
});
