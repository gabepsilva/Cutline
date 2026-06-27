// MOCK: Simulates per-file upload progress on the import gateway until real R2 upload lands.
// TODO(backend): Replace with uploadMediaForEditor / create-on-upload flow in NP-03 (#167).

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
