import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';

type EmailAuthOptions = {
	callbackURL: string;
	successRedirect: string;
	failMessage: string;
};

/** Redirects already-authenticated visitors away from auth pages; otherwise returns empty load data. */
export function redirectIfAuthenticated(locals: App.Locals, to: string) {
	if (locals.user) {
		redirect(302, to);
	}
	return {};
}

/** Maps a better-auth failure to a form `fail` — 400 for known API errors, 500 otherwise. */
function authApiError(error: unknown, fallbackMessage: string) {
	if (error instanceof APIError) {
		return fail(400, { message: error.message || fallbackMessage });
	}
	return fail(500, { message: 'Unexpected error' });
}

export async function signInEmailAction(request: Request, options: EmailAuthOptions) {
	const formData = await request.formData();
	const email = formData.get('email')?.toString() ?? '';
	const password = formData.get('password')?.toString() ?? '';

	try {
		await auth.api.signInEmail({ body: { email, password, callbackURL: options.callbackURL } });
	} catch (error) {
		return authApiError(error, options.failMessage);
	}

	redirect(302, options.successRedirect);
}

export async function signUpEmailAction(request: Request, options: EmailAuthOptions) {
	const formData = await request.formData();
	const email = formData.get('email')?.toString() ?? '';
	const password = formData.get('password')?.toString() ?? '';
	const name = formData.get('name')?.toString() ?? '';

	try {
		await auth.api.signUpEmail({
			body: { email, password, name, callbackURL: options.callbackURL }
		});
	} catch (error) {
		return authApiError(error, options.failMessage);
	}

	redirect(302, options.successRedirect);
}

export async function signInSocialAction(request: Request, defaultCallbackURL: string) {
	const formData = await request.formData();
	const provider = formData.get('provider')?.toString() ?? 'github';
	const callbackURL = formData.get('callbackURL')?.toString() ?? defaultCallbackURL;

	const result = await auth.api.signInSocial({
		body: { provider: provider as 'github', callbackURL }
	});

	if (result.url) {
		redirect(302, result.url);
	}
	return fail(400, { message: 'Social sign-in failed' });
}
