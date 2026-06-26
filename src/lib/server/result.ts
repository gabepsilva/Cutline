/** Shared owner-gated mutation result shapes for server actions and endpoints. */
export type ServerError = {
	ok: false;
	status: 400 | 404;
	message: string;
};

export type ServerOk = { ok: true };

export type ServerResult = ServerOk | ServerError;

/** Narrows any tagged result (or parse output) to the error branch. */
export function isServerError(value: unknown): value is ServerError {
	return (
		typeof value === 'object' &&
		value !== null &&
		'ok' in value &&
		(value as { ok: unknown }).ok === false
	);
}
