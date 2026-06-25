import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import CaptionStylePickerHarness from './CaptionStylePicker.harness.svelte';

describe('CaptionStylePicker.svelte', () => {
	it('renders caption style label and options', async () => {
		render(CaptionStylePickerHarness);

		await expect.element(page.getByText('Caption style')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Karaoke' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Clean' })).toBeInTheDocument();
	});

	it('marks the selected style with aria-pressed', async () => {
		render(CaptionStylePickerHarness, { value: 'clean' });

		const karaoke = await page.getByRole('button', { name: 'Karaoke' }).element();
		const clean = await page.getByRole('button', { name: 'Clean' }).element();

		expect(karaoke.getAttribute('aria-pressed')).toBe('false');
		expect(clean.getAttribute('aria-pressed')).toBe('true');
	});

	it('fires onchange when a style chip is clicked', async () => {
		const onchange = vi.fn();
		render(CaptionStylePickerHarness, { value: 'karaoke', onchange });

		await userEvent.click(page.getByRole('button', { name: 'Clean' }));

		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledWith('clean');
	});

	it('activates style selection on keyboard Enter', async () => {
		const onchange = vi.fn();
		render(CaptionStylePickerHarness, { value: 'karaoke', onchange });

		const clean = (await page
			.getByRole('button', { name: 'Clean' })
			.element()) as HTMLButtonElement;
		clean.focus();
		await userEvent.keyboard('{Enter}');

		expect(onchange).toHaveBeenCalledOnce();
		expect(onchange).toHaveBeenCalledWith('clean');
	});

	it('exposes labelled region and option group for assistive tech', async () => {
		render(CaptionStylePickerHarness);

		await expect.element(page.getByRole('region', { name: 'Caption style' })).toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: 'Caption style options' }))
			.toBeInTheDocument();
	});
});
