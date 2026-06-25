import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import AuthFormFieldHarness from './AuthFormField.harness.svelte';

describe('AuthFormField.svelte', () => {
	it('renders labelled input with placeholder', async () => {
		render(AuthFormFieldHarness);

		await expect.element(page.getByLabelText('Email')).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('you@example.com')).toBeInTheDocument();
	});

	it('shows error message with alert role', async () => {
		render(AuthFormFieldHarness, { error: 'Invalid email address' });

		await expect.element(page.getByRole('alert')).toHaveTextContent('Invalid email address');
		await expect.element(page.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
	});

	it('accepts keyboard input', async () => {
		render(AuthFormFieldHarness);

		const input = page.getByLabelText('Email');
		await userEvent.fill(input, 'alex@cutline.test');

		await expect.element(input).toHaveValue('alex@cutline.test');
	});

	it('does not accept input when disabled', async () => {
		render(AuthFormFieldHarness, { disabled: true });

		const input = page.getByLabelText('Email');
		await expect.element(input).toBeDisabled();
	});
});
