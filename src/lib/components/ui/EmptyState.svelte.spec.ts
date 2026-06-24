import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import EmptyStateHarness from './EmptyState.harness.svelte';

describe('EmptyState.svelte', () => {
	it('renders title text from design', async () => {
		render(EmptyStateHarness);

		await expect
			.element(page.getByText('Record or add B-roll — clips drop here at the playhead'))
			.toBeInTheDocument();
	});

	it('renders optional description', async () => {
		render(EmptyStateHarness, {
			title: 'No projects yet',
			description: 'Create a project to get started.'
		});

		await expect.element(page.getByText('No projects yet')).toBeInTheDocument();
		await expect.element(page.getByText('Create a project to get started.')).toBeInTheDocument();
	});

	it('exposes status role with accessible label', async () => {
		render(EmptyStateHarness, { title: 'No projects yet' });

		await expect.element(page.getByRole('status', { name: 'No projects yet' })).toBeInTheDocument();
	});

	it('applies placeholder text token', async () => {
		render(EmptyStateHarness, { title: 'No projects yet' });

		const title = await page.getByText('No projects yet').element();
		const styles = getComputedStyle(title);

		expect(styles.fontSize).toBe('11px');
		expect(styles.color).toBe('rgb(63, 62, 69)');
	});
});
