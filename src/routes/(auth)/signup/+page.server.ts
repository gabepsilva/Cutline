import type { Actions, PageServerLoad } from './$types';
import { redirectIfAuthenticated, signUpEmailAction } from '$lib/server/auth-actions';

export const load: PageServerLoad = (event) => redirectIfAuthenticated(event.locals, '/');

export const actions: Actions = {
	signUpEmail: (event) =>
		signUpEmailAction(event.request, {
			callbackURL: '/',
			successRedirect: '/',
			failMessage: 'Registration failed'
		})
};
