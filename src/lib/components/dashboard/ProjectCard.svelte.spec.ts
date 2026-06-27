import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureDraftProjectCard } from '$lib/test/fixtures/project';
import ProjectCardHarness from './ProjectCard.harness.svelte';

describe('ProjectCard.svelte', () => {
	it('renders title, kind badge, and duration from design', async () => {
		render(ProjectCardHarness);

		await expect.element(page.getByText('Q3 launch recap')).toBeInTheDocument();
		await expect.element(page.getByText('WEBINAR')).toBeInTheDocument();
		await expect.element(page.getByText('7:18')).toBeInTheDocument();
	});

	it('renders meta line', async () => {
		render(ProjectCardHarness);

		await expect.element(page.getByText('Edited 1d ago')).toBeInTheDocument();
	});

	it('fires onclick with project payload', async () => {
		const onclick = vi.fn();
		render(ProjectCardHarness, { onclick, showMenu: false });

		await userEvent.click(page.getByRole('button', { name: /Q3 launch recap/i }));

		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0]?.[0]).toMatchObject({ id: 'proj-q3-recap' });
	});

	it('renders draft state with waiting-for-footage meta and draft badge', async () => {
		render(ProjectCardHarness, {
			project: fixtureDraftProjectCard,
			showMenu: false
		});

		await expect.element(page.getByText('Waiting for footage')).toBeInTheDocument();
		await expect.element(page.getByText('Draft', { exact: true })).toBeInTheDocument();
	});
});
