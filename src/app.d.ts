import type { User, Session } from 'better-auth';
import type { Logger } from 'pino';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			/** Correlation id for this request; also returned as the x-request-id header. */
			requestId: string;
			/** Request-scoped logger pre-bound with { requestId }. */
			log: Logger;
		}

		interface Error {
			message: string;
			/** Echoed to clients on 5xx so users can quote it in support requests. */
			requestId?: string;
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
