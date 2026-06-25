import { describe, expect, it } from 'vitest';
import { formatProjectDuration, isProjectKind, PROJECT_KINDS, projectThumb } from './project';

describe('project domain', () => {
	describe('formatProjectDuration', () => {
		it.each([
			{ seconds: 0, expected: '0:00' },
			{ seconds: 65, expected: '1:05' },
			{ seconds: 272, expected: '4:32' }
		])('formats $seconds as $expected', ({ seconds, expected }) => {
			expect(formatProjectDuration(seconds)).toBe(expected);
		});

		it('treats non-finite input as zero', () => {
			expect(formatProjectDuration(Number.NaN)).toBe('0:00');
		});
	});

	describe('isProjectKind', () => {
		it.each(PROJECT_KINDS)('accepts known kind %s', (kind) => {
			expect(isProjectKind(kind)).toBe(true);
		});

		it('rejects unknown kinds', () => {
			expect(isProjectKind('PODCAST')).toBe(false);
		});
	});

	describe('projectThumb', () => {
		it.each(PROJECT_KINDS)('returns a gradient for %s', (kind) => {
			expect(projectThumb(kind)).toContain('repeating-linear-gradient');
		});

		it('returns distinct thumbs per known kind', () => {
			const webinar = projectThumb('WEBINAR');
			const interview = projectThumb('INTERVIEW');
			expect(webinar).not.toBe(interview);
		});

		it('falls back to the default thumb for unknown kinds', () => {
			expect(projectThumb('CUSTOM')).toBe(projectThumb('UNKNOWN'));
		});
	});
});
