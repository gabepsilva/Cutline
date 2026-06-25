import type { EditorState } from './editor-state.svelte';

/** Starts a requestAnimationFrame loop that advances `editor` while playing. Returns cleanup. */
export function startEditorPlaybackLoop(editor: EditorState): () => void {
	let frame = 0;
	let lastTs: number | null = null;

	const loop = (ts: number) => {
		const deltaSeconds = lastTs === null ? 0 : (ts - lastTs) / 1000;
		lastTs = ts;
		editor.tick(deltaSeconds);
		frame = requestAnimationFrame(loop);
	};

	frame = requestAnimationFrame(loop);
	return () => cancelAnimationFrame(frame);
}
