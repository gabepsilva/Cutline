import { APIError } from 'better-auth/api';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/auth', () => ({
	auth: {
		api: {
			signInEmail: vi.fn(),
			signInSocial: vi.fn()
		}
	}
}));

import { auth } from '$lib/server/auth';
import { actions, load } from './+page.server';

const signInEmail = vi.mocked(auth.api.signInEmail);
const signInSocial = vi.mocked(auth.api.signInSocial);

function createActionEvent(fields: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}

	return {
		request: new Request('http://localhost/login', { method: 'POST', body: formData }),
		locals: {}
	} as Parameters<NonNullable<typeof actions.signInEmail>>[0];
}

describe('login/+page.server', () => {
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

	it('signInEmail redirects after a successful sign-in', async () => {
		signInEmail.mockResolvedValueOnce({} as never);

		try {
			await actions.signInEmail?.(
				createActionEvent({ email: 'alex@cutline.test', password: 'secret' })
			);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/' });
		}

		expect(signInEmail).toHaveBeenCalledWith({
			body: {
				email: 'alex@cutline.test',
				password: 'secret',
				callbackURL: '/'
			}
		});
	});

	it('signInEmail returns API errors to the form', async () => {
		signInEmail.mockRejectedValueOnce(
			new APIError('BAD_REQUEST', { message: 'Invalid credentials' })
		);

		const result = await actions.signInEmail?.(
			createActionEvent({ email: 'alex@cutline.test', password: 'wrong' })
		);

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Invalid credentials' }
		});
	});

	it('signInEmail returns a fallback message for unexpected errors', async () => {
		signInEmail.mockRejectedValueOnce(new Error('network down'));

		const result = await actions.signInEmail?.(
			createActionEvent({ email: 'alex@cutline.test', password: 'secret' })
		);

		expect(result).toMatchObject({
			status: 500,
			data: { message: 'Unexpected error' }
		});
	});

	it('signInSocial redirects to the provider URL', async () => {
		signInSocial.mockResolvedValueOnce({ url: 'https://github.com/login/oauth' } as never);

		try {
			await actions.signInSocial?.(createActionEvent({ provider: 'github', callbackURL: '/' }));
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: 'https://github.com/login/oauth' });
		}
	});

	it('signInSocial fails when the provider does not return a URL', async () => {
		signInSocial.mockResolvedValueOnce({ url: undefined } as never);

		const result = await actions.signInSocial?.(createActionEvent({ provider: 'github' }));

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Social sign-in failed' }
		});
	});
});
