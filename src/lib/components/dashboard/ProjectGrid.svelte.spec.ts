import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import ProjectGridHarness from './ProjectGrid.harness.svelte';

describe('ProjectGrid.svelte', () => {
	it('renders section heading and project cards', async () => {
		render(ProjectGridHarness);

		await expect
			.element(page.getByRole('heading', { name: 'Recent projects', level: 2 }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Q3 launch recap')).toBeInTheDocument();
		await expect.element(page.getByText('Founder interview')).toBeInTheDocument();
	});

	it('uses responsive grid layout from design', async () => {
		render(ProjectGridHarness);

		const list = await page.getByText('Q3 launch recap').element();
		const grid = list.closest('.project-grid__list') as HTMLElement;
		const styles = getComputedStyle(grid);

		expect(styles.display).toBe('grid');
		expect(styles.gap).toBe('18px');
	});
});
