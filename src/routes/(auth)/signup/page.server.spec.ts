import { APIError } from 'better-auth/api';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			signUpEmail: vi.fn()
		}
	}
}));

import { auth } from '$lib/server/auth';
import { actions, load } from './+page.server';

const signUpEmail = vi.mocked(auth.api.signUpEmail);

function createActionEvent(fields: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}

	return {
		request: new Request('http://localhost/signup', { method: 'POST', body: formData }),
		locals: {}
	} as Parameters<NonNullable<typeof actions.signUpEmail>>[0];
}

describe('signup/+page.server', () => {
	it('returns empty data for logged-out visitors', async () => {
		const data = await load({
			locals: {}
		} as Parameters<typeof load>[0]);

		expect(data).toEqual({});
	});

	it('redirects authenticated users to home', async () => {
		try {
			await load({
				locals: { user: { id: 'user-1', name: 'Alex Chen', email: 'alex@cutline.test' } }
			} as Parameters<typeof load>[0]);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/' });
		}
	});

	it('signUpEmail redirects after a successful registration', async () => {
		signUpEmail.mockResolvedValueOnce({} as Awaited<ReturnType<typeof signUpEmail>>);

		try {
			await actions.signUpEmail?.(
				createActionEvent({
					name: 'Alex Chen',
					email: 'alex@cutline.test',
					password: 'secret'
				})
			);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/' });
		}

		expect(signUpEmail).toHaveBeenCalledWith({
			body: {
				name: 'Alex Chen',
				email: 'alex@cutline.test',
				password: 'secret',
				callbackURL: '/'
			}
		});
	});

	it('signUpEmail returns API errors to the form', async () => {
		signUpEmail.mockRejectedValueOnce(
			new APIError('BAD_REQUEST', { message: 'Email already in use' })
		);

		const result = await actions.signUpEmail?.(
			createActionEvent({
				name: 'Alex Chen',
				email: 'alex@cutline.test',
				password: 'secret'
			})
		);

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Email already in use' }
		});
	});

	it('signUpEmail returns a fallback message for unexpected errors', async () => {
		signUpEmail.mockRejectedValueOnce(new Error('network down'));

		const result = await actions.signUpEmail?.(
			createActionEvent({
				name: 'Alex Chen',
				email: 'alex@cutline.test',
				password: 'secret'
			})
		);

		expect(result).toMatchObject({
			status: 500,
			data: { message: 'Unexpected error' }
		});
	});
});
