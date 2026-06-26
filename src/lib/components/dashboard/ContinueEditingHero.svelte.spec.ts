import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ContinueEditingHeroHarness from './ContinueEditingHero.harness.svelte';

describe('ContinueEditingHero.svelte', () => {
	it('renders hero content from design', async () => {
		render(ContinueEditingHeroHarness);

		await expect.element(page.getByText('Continue editing')).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: 'How I edit videos 3x faster', level: 2 }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText(/Talking-head tutorial · 1080p · transcript ready/))
			.toBeInTheDocument();
		await expect.element(page.getByText('Edited 2h ago · 1,142 words · MP4')).toBeInTheDocument();
	});

	it('shows duration on thumbnail', async () => {
		render(ContinueEditingHeroHarness);

		await expect.element(page.getByText('4:32')).toBeInTheDocument();
	});

	it('fires onclick with project payload', async () => {
		const onclick = vi.fn();
		render(ContinueEditingHeroHarness, { onclick, showMenu: false });

		await userEvent.click(page.getByRole('button', { name: /How I edit videos 3x faster/i }));

		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0]?.[0]).toMatchObject({ id: 'proj-hero' });
	});
});
