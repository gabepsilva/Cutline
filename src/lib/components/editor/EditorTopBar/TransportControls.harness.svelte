<script lang="ts">
	import type { EditorState } from '$lib/editor/editor-state.svelte';
	import TransportControls from './TransportControls.svelte';

	interface Props {
		editor?: EditorState;
		playing?: boolean;
		current?: number;
		total?: number;
		ontoStart?: () => void;
		ontogglePlay?: () => void;
		ontoEnd?: () => void;
	}

	let {
		editor,
		playing = false,
		current = 65,
		total = 272,
		ontoStart,
		ontogglePlay,
		ontoEnd
	}: Props = $props();
</script>

{#if editor}
	<TransportControls {editor} />
{:else}
	<TransportControls {playing} {current} {total} {ontoStart} {ontogglePlay} {ontoEnd} />
{/if}
