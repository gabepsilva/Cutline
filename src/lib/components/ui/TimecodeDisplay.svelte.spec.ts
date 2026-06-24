import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import TimecodeDisplayHarness from './TimecodeDisplay.harness.svelte';

describe('TimecodeDisplay.svelte', () => {
	it('renders current and total timecodes', async () => {
		render(TimecodeDisplayHarness, { current: 65, total: 272 });

		await expect.element(page.getByText('1:05')).toBeInTheDocument();
		await expect.element(page.getByText('/')).toBeInTheDocument();
		await expect.element(page.getByText('4:32')).toBeInTheDocument();
	});

	it('renders current only when total is omitted', async () => {
		render(TimecodeDisplayHarness, { current: 12, total: undefined });

		await expect.element(page.getByText('0:12')).toBeInTheDocument();
		await expect.element(page.getByText('/')).not.toBeInTheDocument();
	});

	it('applies mono typography tokens', async () => {
		render(TimecodeDisplayHarness, { current: 0, total: 60, size: 'md' });

		const display = await page.getByText('0:00').element();
		const styles = getComputedStyle(display);

		expect(styles.fontFamily).toContain('JetBrains Mono');
		expect(styles.fontSize).toBe('12.5px');
		expect(styles.color).toBe('rgb(214, 213, 218)');
	});

	it('applies muted color to total segment', async () => {
		render(TimecodeDisplayHarness, { current: 0, total: 60 });

		const total = await page.getByText('1:00').element();
		expect(getComputedStyle(total).color).toBe('rgb(95, 94, 102)');
	});
});
