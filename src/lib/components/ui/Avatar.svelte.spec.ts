import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import AvatarHarness from './Avatar.harness.svelte';

describe('Avatar.svelte', () => {
	it('exposes img role with aria-label from name', async () => {
		render(AvatarHarness, { name: 'Alex Chen', initials: 'AC' });

		await expect.element(page.getByRole('img', { name: 'Alex Chen' })).toBeInTheDocument();
	});

	it('renders initials text', async () => {
		render(AvatarHarness, { name: 'Alex Chen', initials: 'AC' });

		await expect.element(page.getByText('AC')).toBeInTheDocument();
	});

	it('applies sm size dimensions', async () => {
		render(AvatarHarness, { name: 'Alex Chen', initials: 'AC', size: 'sm' });

		const avatar = await page.getByRole('img', { name: 'Alex Chen' }).element();
		const styles = getComputedStyle(avatar);

		expect(styles.width).toBe('30px');
		expect(styles.height).toBe('30px');
	});

	it('applies md size and typography tokens', async () => {
		render(AvatarHarness, { name: 'Alex Chen', initials: 'AC', size: 'md' });

		const avatar = await page.getByRole('img', { name: 'Alex Chen' }).element();
		const styles = getComputedStyle(avatar);

		expect(styles.width).toBe('32px');
		expect(styles.height).toBe('32px');
		expect(styles.fontSize).toBe('12px');
		expect(styles.fontWeight).toBe('600');
		expect(styles.color).toBe('rgb(214, 213, 218)');
	});
});
