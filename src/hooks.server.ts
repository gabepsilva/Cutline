import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { randomUUID } from 'node:crypto';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { logger } from '$lib/server/log';

// Assigns a correlation id, exposes a request-scoped logger on locals, and emits
// one structured access line per request. Runs before auth so even auth failures
// carry a requestId. Skips /healthz to keep the k8s probe cheap and silent.
const handleLogging: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/healthz') return resolve(event);

	const requestId = event.request.headers.get('x-request-id') ?? randomUUID();
	event.locals.requestId = requestId;
	event.locals.log = logger.child({ requestId });

	const start = Date.now();
	const response = await resolve(event);
	const durationMs = Date.now() - start;

  // Per-request access lines when LOG_ACCESS=true (see cutline-config ConfigMap).
  if (process.env.LOG_ACCESS === 'true') {
		// locals.user is populated by the downstream auth handle by the time resolve resolves.
		event.locals.log.info(
			{
				method: event.request.method,
				path: event.url.pathname,
				status: response.status,
				durationMs,
				userId: event.locals.user?.id
			},
			'request'
		);
	}

	response.headers.set('x-request-id', requestId);
	return response;
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	// K8s liveness/readiness probe (T-10): answer before any auth/DB work so a
	// degraded database can never make the pod fail its health check.
	if (event.url.pathname === '/healthz') return resolve(event);

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleLogging, handleBetterAuth);

// Logs every uncaught error thrown from a load/action/endpoint — these are
// otherwise invisible (SvelteKit just returns a generic 500). Returns the
// requestId so users can quote it; the message stays generic to avoid leaking
// internals. (logging, T-10)
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const requestId = event.locals.requestId;
	logger.error(
		{
			requestId,
			method: event.request.method,
			path: event.url.pathname,
			status,
			err: error
		},
		'unhandled server error'
	);

	return { message, requestId };
};
