import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startMockImportUpload } from '$lib/mocks/import-upload.mock';

describe('startMockImportUpload', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('reports progress until completion', () => {
		const onProgress = vi.fn();
		const onComplete = vi.fn();

		startMockImportUpload(onProgress, onComplete);

		vi.runAllTimers();

		expect(onProgress).toHaveBeenCalled();
		expect(onComplete).toHaveBeenCalledOnce();
	});

	it('stops updating when canceled', () => {
		const onProgress = vi.fn();
		const onComplete = vi.fn();

		const cancel = startMockImportUpload(onProgress, onComplete);
		cancel();
		vi.runAllTimers();

		expect(onComplete).not.toHaveBeenCalled();
	});
});
