import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { event, logger } from '$lib/server/log';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
		? {
				socialProviders: {
					github: {
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET
					}
				}
			}
		: {}),
	databaseHooks: {
		user: {
			create: {
				// New account created (email signup or first social login).
				after: async (user) => {
					event(logger, 'auth.signup', {
						actorId: user.id,
						target: { type: 'user', id: user.id }
					});
				}
			}
		},
		session: {
			create: {
				// A session was minted = a successful login (also fires once on signup).
				after: async (session, ctx) => {
					const path = ctx?.path ?? '';
					const method =
						path.includes('callback') || path.includes('social') ? 'github' : 'password';
					event(logger, 'auth.login.success', {
						actorId: session.userId,
						target: { type: 'user', id: session.userId },
						method
					});
				}
			}
		}
	},
	hooks: {
		// Failed email sign-in: better-auth throws an APIError, surfaced on ctx.context.returned.
		// Log the attempted email ONLY (no password — pino also redacts *.password). No actor/target.
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== '/sign-in/email') return;
			if (ctx.context.returned instanceof APIError) {
				const body = ctx.body as { email?: unknown } | undefined;
				const email = typeof body?.email === 'string' ? body.email : undefined;
				event(logger, 'auth.login.failure', { method: 'password', email });
			}
		})
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
