import { describe, expect, it } from 'vitest';
import { mapProjectRow } from '$lib/server/map-project-row';
import { PROJECT_DRAFT_META } from '$lib/types/project';

const baseRow = {
	id: 'proj-1',
	userId: 'user-1',
	title: 'Launch recap',
	kind: 'WEBINAR',
	description: null,
	durationSeconds: 120,
	thumb: 'thumb',
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-20T00:00:00.000Z')
};

describe('mapProjectRow', () => {
	it('maps ready projects with an edited meta line', () => {
		const project = mapProjectRow(baseRow);

		expect(project).toMatchObject({
			id: 'proj-1',
			title: 'Launch recap',
			durationLabel: '2:00',
			isDraft: false
		});
		expect(project.meta).toMatch(/^Edited /);
		expect(project.meta).not.toBe(PROJECT_DRAFT_META);
	});

	it('maps draft projects with waiting-for-footage meta', () => {
		const project = mapProjectRow(baseRow, { isDraft: true });

		expect(project.meta).toBe(PROJECT_DRAFT_META);
		expect(project.isDraft).toBe(true);
	});
});
