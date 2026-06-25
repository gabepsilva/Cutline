import type { EditorState } from '$lib/editor/editor-state.svelte';

interface TransportControlsBase {
	class?: string;
}

export type TransportControlsProps = TransportControlsBase &
	(
		| {
				editor: EditorState;
				playing?: never;
				current?: never;
				total?: never;
				ontoStart?: never;
				ontogglePlay?: never;
				ontoEnd?: never;
		  }
		| {
				editor?: undefined;
				playing: boolean;
				current: number;
				total: number;
				ontoStart?: () => void;
				ontogglePlay?: () => void;
				ontoEnd?: () => void;
		  }
	);
