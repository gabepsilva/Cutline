import { describe, expect, it } from 'vitest';
import { relativeTime } from './format-relative-time';

describe('relativeTime', () => {
	const now = new Date('2026-06-26T12:00:00.000Z');

	it('returns just now for sub-minute deltas', () => {
		expect(relativeTime(new Date('2026-06-26T11:59:30.000Z'), now)).toBe('just now');
	});

	it('formats minutes, hours, days, and weeks', () => {
		expect(relativeTime(new Date('2026-06-26T11:58:00.000Z'), now)).toBe('2m ago');
		expect(relativeTime(new Date('2026-06-26T10:00:00.000Z'), now)).toBe('2h ago');
		expect(relativeTime(new Date('2026-06-25T12:00:00.000Z'), now)).toBe('1d ago');
		expect(relativeTime(new Date('2026-06-05T12:00:00.000Z'), now)).toBe('3w ago');
	});
});
