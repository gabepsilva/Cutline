import type { EditorState } from './editor-state.svelte';

const COUNTDOWN_MS = 1000;
const ELAPSED_MS = 100;

/** MOCK: Camera capture via getUserMedia until a real media capture service exists. */
// TODO(3p): Replace with production media capture pipeline in M6-05.
export function startCamera(videoEl: HTMLVideoElement | null, onDenied: () => void): () => void {
	if (!videoEl) return () => {};

	if (!navigator.mediaDevices?.getUserMedia) {
		onDenied();
		return () => {};
	}

	let stream: MediaStream | null = null;
	let cancelled = false;

	navigator.mediaDevices
		.getUserMedia({ video: true, audio: false })
		.then((mediaStream) => {
			if (cancelled) {
				mediaStream.getTracks().forEach((track) => track.stop());
				return;
			}
			stream = mediaStream;
			videoEl.srcObject = mediaStream;
		})
		.catch(() => onDenied());

	return () => {
		cancelled = true;
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		videoEl.srcObject = null;
	};
}

export function startRecordCountdown(editor: EditorState): () => void {
	const timer = setInterval(() => editor.advanceCountdown(), COUNTDOWN_MS);
	return () => clearInterval(timer);
}

export function startRecordingElapsed(editor: EditorState): () => void {
	const timer = setInterval(() => {
		editor.recElapsed += 0.1;
	}, ELAPSED_MS);
	return () => clearInterval(timer);
}
