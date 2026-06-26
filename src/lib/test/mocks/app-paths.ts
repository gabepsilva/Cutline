/** Browser-test stub for `$app/paths` — returns paths unchanged (no SvelteKit router). */
export function resolve<T extends string>(path: T): T {
	return path;
}

export function asset(file: string): string {
	return file;
}

export function base(): string {
	return '';
}

export function assets(): string {
	return '';
}
