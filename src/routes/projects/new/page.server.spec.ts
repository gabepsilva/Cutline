import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

const authUser = {
	id: 'user-jordan',
	name: 'Jordan Lee',
	email: 'jordan@example.com',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('projects/new/+page.server load', () => {
	it('returns empty data for authenticated users', async () => {
		const data = await load({
			locals: { user: authUser }
		} as Parameters<typeof load>[0]);

		expect(data).toEqual({});
	});

	it('redirects unauthenticated visitors to login', async () => {
		try {
			await load({
				locals: {}
			} as Parameters<typeof load>[0]);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/login' });
		}
	});
});
