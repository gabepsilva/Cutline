import { describe, expect, it } from 'vitest';
import { formatTimecode } from './format-timecode';

describe('formatTimecode', () => {
	it.each([
		{ input: 0, expected: '0:00' },
		{ input: 5, expected: '0:05' },
		{ input: 59, expected: '0:59' },
		{ input: 60, expected: '1:00' },
		{ input: 272, expected: '4:32' },
		{ input: 3661, expected: '61:01' }
	])('formats $input seconds as $expected', ({ input, expected }) => {
		expect(formatTimecode(input)).toBe(expected);
	});

	it('clamps negative values to zero', () => {
		expect(formatTimecode(-12)).toBe('0:00');
	});

	it('floors fractional seconds', () => {
		expect(formatTimecode(90.9)).toBe('1:30');
	});
});
