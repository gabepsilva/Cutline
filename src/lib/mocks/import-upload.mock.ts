// MOCK: Legacy timer-based upload progress helper (superseded by uploadImportMedia in NP-03).
// TODO(backend): Remove once all import gateway tests use uploadImportMedia mocks.

const TICK_MS = 120;
const PROGRESS_STEP = 8;

export function startMockImportUpload(
	onProgress: (progress: number) => void,
	onComplete: () => void
): () => void {
	let progress = 0;
	let canceled = false;

	const timer = setInterval(() => {
		if (canceled) return;

		progress = Math.min(100, progress + PROGRESS_STEP);
		onProgress(progress);

		if (progress >= 100) {
			clearInterval(timer);
			onComplete();
		}
	}, TICK_MS);

	return () => {
		canceled = true;
		clearInterval(timer);
	};
}
