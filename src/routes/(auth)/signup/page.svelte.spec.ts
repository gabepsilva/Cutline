import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import SignupPageHarness from '$lib/test/signup-page.harness.svelte';

describe('signup/+page.svelte', () => {
	it('renders signup form with name, email, and password fields', async () => {
		render(SignupPageHarness);

		await expect
			.element(page.getByRole('heading', { name: 'Create your account', level: 1 }))
			.toBeInTheDocument();
		await expect.element(page.getByLabelText('Name')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Email')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Password')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
	});

	it('shows server error message when provided', async () => {
		render(SignupPageHarness, { message: 'Email already in use' });

		await expect.element(page.getByRole('alert')).toHaveTextContent('Email already in use');
	});

	it('links to login page', async () => {
		render(SignupPageHarness);

		await expect
			.element(page.getByRole('link', { name: 'Sign in' }))
			.toHaveAttribute('href', '/login');
	});
});
