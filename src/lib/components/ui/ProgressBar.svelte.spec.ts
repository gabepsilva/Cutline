import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import ProgressBarHarness from './ProgressBar.harness.svelte';

describe('ProgressBar.svelte', () => {
	it('exposes progressbar role with default aria-label', async () => {
		render(ProgressBarHarness, { value: 62 });

		const bar = await page.getByRole('progressbar').element();
		expect(bar.getAttribute('aria-label')).toBe('Progress: 62%');
	});

	it('uses custom label for aria-label', async () => {
		render(ProgressBarHarness, { value: 40, label: 'Storage used' });

		const bar = await page.getByRole('progressbar', { name: 'Storage used' }).element();
		expect(bar.getAttribute('aria-valuenow')).toBe('40');
	});

	it('sets aria-valuemin and aria-valuemax', async () => {
		render(ProgressBarHarness, { value: 50 });

		const bar = await page.getByRole('progressbar').element();
		expect(bar.getAttribute('aria-valuemin')).toBe('0');
		expect(bar.getAttribute('aria-valuemax')).toBe('100');
	});

	it('clamps value to 0–100 range', async () => {
		render(ProgressBarHarness, { value: 150 });

		const bar = await page.getByRole('progressbar').element();
		expect(bar.getAttribute('aria-valuenow')).toBe('100');
	});

	it('applies track and fill token styles', async () => {
		render(ProgressBarHarness, { value: 62 });

		const bar = (await page.getByRole('progressbar').element()) as HTMLElement;
		const fill = bar.querySelector('.progress-bar__fill') as HTMLElement;
		const track = fill.parentElement as HTMLElement;
		const fillStyles = getComputedStyle(fill);
		const trackStyles = getComputedStyle(track);

		expect(trackStyles.height).toBe('5px');
		expect(trackStyles.backgroundColor).toBe('rgb(31, 31, 36)');
		expect(fill.style.width).toBe('62%');
		expect(fillStyles.backgroundColor).toBe('rgb(255, 106, 61)');
	});
});
