import { describe, expect, it } from 'vitest';
import { resolveProjectRouteMode } from '$lib/server/project-route-mode';

describe('resolveProjectRouteMode', () => {
	it('returns import when there is no completed media', () => {
		expect(resolveProjectRouteMode([])).toBe('import');
		expect(resolveProjectRouteMode(['uploading'])).toBe('import');
		expect(resolveProjectRouteMode(['failed'])).toBe('import');
	});

	it('returns import while any upload is still in progress', () => {
		expect(resolveProjectRouteMode(['uploaded', 'uploading'])).toBe('import');
		expect(resolveProjectRouteMode(['ready', 'pending'])).toBe('import');
	});

	it('returns editor when at least one upload finished and none are in progress', () => {
		expect(resolveProjectRouteMode(['uploaded'])).toBe('editor');
		expect(resolveProjectRouteMode(['ingesting'])).toBe('editor');
		expect(resolveProjectRouteMode(['ready'])).toBe('editor');
		expect(resolveProjectRouteMode(['ready', 'failed'])).toBe('editor');
	});
});
