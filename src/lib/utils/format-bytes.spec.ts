import { describe, expect, it } from 'vitest';
import { formatBytes } from './format-bytes';

describe('formatBytes', () => {
	it('formats zero and small byte counts', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(1023)).toBe('1023 B');
	});

	it('formats kilobytes and megabytes as whole numbers', () => {
		expect(formatBytes(1024)).toBe('1 KB');
		expect(formatBytes(1.5 * 1024 ** 2)).toBe('2 MB');
	});

	it('formats gigabytes with one decimal place', () => {
		expect(formatBytes(38.4 * 1024 ** 3)).toBe('38.4 GB');
		expect(formatBytes(60 * 1024 ** 3)).toBe('60 GB');
	});

	it('handles invalid input', () => {
		expect(formatBytes(Number.NaN)).toBe('0 B');
		expect(formatBytes(-1)).toBe('0 B');
	});
});
