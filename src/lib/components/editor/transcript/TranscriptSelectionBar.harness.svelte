<script lang="ts">
	import TranscriptSelectionBar from './TranscriptSelectionBar.svelte';
	import type { TranscriptSelectionBarProps } from './TranscriptSelectionBar.types';

	let {
		visible = true,
		selectedText = 'um,',
		deleteLabel = 'Delete word',
		ondelete,
		class: className = ''
	}: TranscriptSelectionBarProps = $props();
</script>

<TranscriptSelectionBar {visible} {selectedText} {deleteLabel} {ondelete} class={className} />
