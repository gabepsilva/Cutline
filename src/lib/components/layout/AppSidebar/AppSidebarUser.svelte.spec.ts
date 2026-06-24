import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureUser } from '$lib/test/fixtures/user';
import AppSidebarUserHarness from './AppSidebarUser.harness.svelte';

describe('AppSidebarUser.svelte', () => {
	it('renders user name and plan from fixture', async () => {
		render(AppSidebarUserHarness);

		await expect.element(page.getByText('Alex Chen')).toBeInTheDocument();
		await expect.element(page.getByText('Pro plan')).toBeInTheDocument();
	});

	it('renders avatar initials via Avatar', async () => {
		render(AppSidebarUserHarness);

		await expect.element(page.getByText('AC')).toBeInTheDocument();
		await expect.element(page.getByRole('img', { name: 'Alex Chen' })).toBeInTheDocument();
	});

	it('updates when user prop changes', async () => {
		render(AppSidebarUserHarness, {
			user: { ...fixtureUser, name: 'Jordan Lee', initials: 'JL', planLabel: 'Free plan' }
		});

		await expect.element(page.getByText('Jordan Lee')).toBeInTheDocument();
		await expect.element(page.getByText('Free plan')).toBeInTheDocument();
	});
});
