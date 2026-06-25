import { describe, expect, it } from 'vitest';
import { mockUser } from '$lib/mocks/user.mock';
import { load } from './+page.server';

describe('+page.server load', () => {
	it('returns dashboard mock data with user, projects, and latest project', async () => {
		const data = await load({ locals: {} } as Parameters<typeof load>[0]);
		expect(data).toBeDefined();
		if (!data) throw new Error('expected load data');

		expect(data.user).toEqual(mockUser);
		expect(data.usage.percentUsed).toBe(62);
		expect(data.projects.length).toBeGreaterThan(0);
		expect(data.latestProject).toMatchObject({
			id: 'proj-hero',
			title: 'How I edit videos 3x faster'
		});
	});

	it('maps authenticated session user into sidebar user', async () => {
		const data = await load({
			locals: {
				user: {
					id: 'user-jordan',
					name: 'Jordan Lee',
					email: 'jordan@example.com',
					emailVerified: true,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			}
		} as Parameters<typeof load>[0]);

		expect(data).toBeDefined();
		if (!data) throw new Error('expected load data');

		expect(data.user).toMatchObject({
			id: 'user-jordan',
			name: 'Jordan Lee',
			initials: 'JL',
			planLabel: 'Free plan'
		});
	});
});
