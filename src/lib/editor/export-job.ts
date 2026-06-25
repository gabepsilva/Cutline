import type { EditorState } from './editor-state.svelte';

/** MOCK: Simulates export progress until a real export job API exists. */
// TODO(backend): Replace with export job polling in M6-07.
export function startMockExportJob(editor: EditorState): () => void {
	const timer = setInterval(() => {
		const next = editor.exportProgress + 0.012 + Math.random() * 0.03;
		editor.setExportProgress(next >= 1 ? 1 : next);
	}, 40);

	return () => clearInterval(timer);
}

export function exportFilename(projectTitle: string, format: string): string {
	const slug = projectTitle
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${slug || 'export'}.${format}`;
}
