import { describe, expect, it } from 'vitest';
import { deriveUserInitials } from './user-initials';

describe('deriveUserInitials', () => {
	it('returns two initials for a full name', () => {
		expect(deriveUserInitials('Alex Chen')).toBe('AC');
	});

	it('returns up to two characters for a single name', () => {
		expect(deriveUserInitials('Jordan')).toBe('JO');
	});

	it('uses first and last token for multi-part names', () => {
		expect(deriveUserInitials('Mary Jane Watson')).toBe('MW');
	});

	it('returns a placeholder for empty input', () => {
		expect(deriveUserInitials('   ')).toBe('?');
	});
});
