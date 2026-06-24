import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import AppSidebarNavHarness from './AppSidebarNav.harness.svelte';
import type { AppSidebarNavItemData } from './AppSidebarNav.types';

const linkItems: AppSidebarNavItemData[] = [
	{ id: 'home', label: 'Home', icon: 'home', active: true, href: '/' },
	{ id: 'projects', label: 'All projects', icon: 'projects', href: '/projects' }
];

describe('AppSidebarNav.svelte', () => {
	it('renders nav labels from design', async () => {
		render(AppSidebarNavHarness);

		await expect
			.element(page.getByRole('navigation', { name: 'Main navigation' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Home')).toBeInTheDocument();
		await expect.element(page.getByText('All projects')).toBeInTheDocument();
		await expect.element(page.getByText('Templates')).toBeInTheDocument();
		await expect.element(page.getByText('Trash')).toBeInTheDocument();
	});

	it('marks active item with aria-current', async () => {
		render(AppSidebarNavHarness, { items: linkItems });

		const home = page.getByRole('link', { name: 'Home' });
		await expect.element(home).toHaveAttribute('aria-current', 'page');
	});

	it('fires onitemclick when a link is clicked', async () => {
		const onitemclick = vi.fn();
		render(AppSidebarNavHarness, { items: linkItems, onitemclick });

		await userEvent.click(page.getByRole('link', { name: 'All projects' }));

		expect(onitemclick).toHaveBeenCalledOnce();
		expect(onitemclick.mock.calls[0][0].id).toBe('projects');
	});
});
