import { describe, expect, it } from 'vitest';
import { mockUser } from '$lib/mocks/user.mock';
import { resolveSidebarUser } from './sidebar-user';

describe('resolveSidebarUser', () => {
	it('returns mock user when session is absent', () => {
		expect(resolveSidebarUser()).toEqual(mockUser);
		expect(resolveSidebarUser(null)).toEqual(mockUser);
	});

	it('maps session user to sidebar shape with derived initials', () => {
		expect(
			resolveSidebarUser({
				id: 'user-jordan',
				name: 'Jordan Lee',
				email: 'jordan@example.com',
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date()
			})
		).toEqual({
			id: 'user-jordan',
			name: 'Jordan Lee',
			initials: 'JL',
			planLabel: 'Free plan'
		});
	});
});
