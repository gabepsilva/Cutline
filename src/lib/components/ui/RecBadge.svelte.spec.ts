import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import RecBadgeHarness from './RecBadge.harness.svelte';

describe('RecBadge.svelte', () => {
	it('renders default REC label', async () => {
		render(RecBadgeHarness);

		await expect.element(page.getByText('REC')).toBeInTheDocument();
	});

	it('renders custom label text', async () => {
		render(RecBadgeHarness, { label: 'REC 1:05' });

		await expect.element(page.getByText('REC 1:05')).toBeInTheDocument();
	});

	it('renders badge structure with decorative dot', async () => {
		render(RecBadgeHarness, { label: 'REC' });

		const badge = await page.getByText('REC').element();
		const dot = badge.querySelector('.rec-badge__dot');

		expect(badge.classList.contains('rec-badge')).toBe(true);
		expect(dot).not.toBeNull();
		expect(dot?.getAttribute('aria-hidden')).toBe('true');
	});
});
