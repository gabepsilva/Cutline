import type { Actions, PageServerLoad } from './$types';
import {
	redirectIfAuthenticated,
	signInEmailAction,
	signInSocialAction,
	signUpEmailAction
} from '$lib/server/auth-actions';

const HOME = '/demo/better-auth';
const VERIFY_CALLBACK = '/auth/verification-success';

export const load: PageServerLoad = (event) => redirectIfAuthenticated(event.locals, HOME);

export const actions: Actions = {
	signInEmail: (event) =>
		signInEmailAction(event.request, {
			callbackURL: VERIFY_CALLBACK,
			successRedirect: HOME,
			failMessage: 'Signin failed'
		}),
	signUpEmail: (event) =>
		signUpEmailAction(event.request, {
			callbackURL: VERIFY_CALLBACK,
			successRedirect: HOME,
			failMessage: 'Registration failed'
		}),
	signInSocial: (event) => signInSocialAction(event.request, HOME)
};
