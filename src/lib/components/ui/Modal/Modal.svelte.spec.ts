import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ModalHarness from './Modal.harness.svelte';

describe('Modal.svelte', () => {
	it('renders dialog with title when open', async () => {
		render(ModalHarness, { open: true, title: 'Export video' });

		await expect.element(page.getByRole('dialog', { name: 'Export video' })).toBeInTheDocument();
		await expect.element(page.getByText('Modal body content')).toBeInTheDocument();
	});

	it('hides dialog when closed', async () => {
		render(ModalHarness, { open: false, title: 'Export video' });

		await expect
			.element(page.getByRole('dialog', { name: 'Export video' }))
			.not.toBeInTheDocument();
	});

	it('fires onclose when close button is clicked', async () => {
		const onclose = vi.fn();
		render(ModalHarness, { open: true, title: 'Record', onclose });

		await userEvent.click(page.getByRole('button', { name: 'Close' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('fires onclose on Escape key', async () => {
		const onclose = vi.fn();
		render(ModalHarness, { open: true, title: 'Record', onclose });

		await userEvent.keyboard('{Escape}');

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('applies modal surface and shadow tokens', async () => {
		render(ModalHarness, { open: true, title: 'Export video' });

		const dialog = await page.getByRole('dialog', { name: 'Export video' }).element();
		const styles = getComputedStyle(dialog);

		expect(styles.backgroundColor).toBe('rgb(19, 19, 22)');
		expect(styles.borderColor).toBe('rgb(42, 42, 48)');
		expect(styles.borderRadius).toBe('18px');
	});
});
