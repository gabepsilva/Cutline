import { describe, expect, it } from 'vitest';
import { mockStorageUsage } from '$lib/mocks/storage.mock';
import { resolveStorageUsage } from './storage-usage';

describe('resolveStorageUsage', () => {
	it('returns mock storage usage for the sidebar widget', () => {
		expect(resolveStorageUsage()).toEqual(mockStorageUsage);
	});
});
