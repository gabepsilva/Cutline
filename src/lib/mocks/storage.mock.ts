// MOCK: Sidebar storage widget until storage API exists.
// TODO(backend): Replace with storage usage query (M4-05).
import type { StorageUsage } from '$lib/types/storage';

export const mockStorageUsage: StorageUsage = {
	percentUsed: 62,
	usageLabel: '38.4 GB of 60 GB used'
};
