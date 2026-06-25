<script lang="ts">
	import type { EditorState } from '$lib/editor/editor-state.svelte';
	import Timeline from './Timeline.svelte';

	interface Props {
		editor: EditorState;
	}

	let { editor }: Props = $props();
</script>

<Timeline {editor} />
