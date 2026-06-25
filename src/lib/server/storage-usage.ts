import { mockStorageUsage } from '$lib/mocks/storage.mock';
import type { StorageUsage } from '$lib/types/storage';

/** Load sidebar storage usage; mock until storage API exists. */
export function resolveStorageUsage(): StorageUsage {
	// MOCK: Design placeholder until storage metering API exists.
	// TODO(backend): Replace with storage usage query (M4-05).
	return mockStorageUsage;
}
