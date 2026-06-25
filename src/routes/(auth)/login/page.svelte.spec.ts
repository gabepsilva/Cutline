import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import LoginPageHarness from '$lib/test/login-page.harness.svelte';

describe('login/+page.svelte', () => {
	it('renders sign-in form with email and password fields', async () => {
		render(LoginPageHarness);

		await expect
			.element(page.getByRole('heading', { name: 'Welcome back', level: 1 }))
			.toBeInTheDocument();
		await expect.element(page.getByLabelText('Email')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Password')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
	});

	it('shows server error message when provided', async () => {
		render(LoginPageHarness, { message: 'Invalid credentials' });

		await expect.element(page.getByRole('alert')).toHaveTextContent('Invalid credentials');
	});

	it('links to signup page', async () => {
		render(LoginPageHarness);

		await expect
			.element(page.getByRole('link', { name: 'Create one' }))
			.toHaveAttribute('href', '/signup');
	});

	it('renders GitHub social sign-in button', async () => {
		render(LoginPageHarness);

		await expect
			.element(page.getByRole('button', { name: 'Continue with GitHub' }))
			.toBeInTheDocument();
	});
});
