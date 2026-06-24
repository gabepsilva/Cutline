import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

describe('+page.server load', () => {
	it('returns dashboard mock data with user, projects, and latest project', async () => {
		const data = await load({} as Parameters<typeof load>[0]);
		expect(data).toBeDefined();
		if (!data) throw new Error('expected load data');

		expect(data.user).toMatchObject({ name: 'Alex Chen', initials: 'AC' });
		expect(data.usage.percentUsed).toBe(62);
		expect(data.projects.length).toBeGreaterThan(0);
		expect(data.latestProject).toMatchObject({
			id: 'proj-hero',
			title: 'How I edit videos 3x faster'
		});
	});
});
