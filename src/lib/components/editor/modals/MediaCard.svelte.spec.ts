import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureMediaResource } from '$lib/test/fixtures/media-resource';
import MediaCardHarness from './MediaCard.harness.svelte';

describe('MediaCard.svelte', () => {
	it('renders resource name, kind, and formatted duration', async () => {
		render(MediaCardHarness);

		await expect
			.element(page.getByRole('button', { name: fixtureMediaResource.name }))
			.toBeInTheDocument();
		await expect.element(page.getByText(fixtureMediaResource.kind)).toBeInTheDocument();
		await expect.element(page.getByText('0:12')).toBeInTheDocument();
	});

	it('fires onclick when the card is clicked', async () => {
		const onclick = vi.fn();
		render(MediaCardHarness, { onclick });

		await userEvent.click(page.getByRole('button', { name: fixtureMediaResource.name }));

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('activates on keyboard Enter', async () => {
		const onclick = vi.fn();
		render(MediaCardHarness, { onclick });

		const card = (await page
			.getByRole('button', { name: fixtureMediaResource.name })
			.element()) as HTMLButtonElement;
		card.focus();
		await userEvent.keyboard('{Enter}');

		expect(onclick).toHaveBeenCalledOnce();
	});
});
