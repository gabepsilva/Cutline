import type { Actions, PageServerLoad } from './$types';
import {
	redirectIfAuthenticated,
	signInEmailAction,
	signInSocialAction
} from '$lib/server/auth-actions';

export const load: PageServerLoad = (event) => redirectIfAuthenticated(event.locals, '/');

export const actions: Actions = {
	signInEmail: (event) =>
		signInEmailAction(event.request, {
			callbackURL: '/',
			successRedirect: '/',
			failMessage: 'Sign in failed'
		}),
	signInSocial: (event) => signInSocialAction(event.request, '/')
};
