<script lang="ts">
	import type { Word } from '$lib/types/transcript';
	import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
	import TranscriptWord from './TranscriptWord.svelte';

	interface Props {
		word?: Word;
		current?: boolean;
		selected?: boolean;
		searchMatch?: boolean;
		showFiller?: boolean;
		onclick?: (word: Word, event: MouseEvent) => void;
		class?: string;
	}

	let {
		word = fixtureTranscriptWords[0],
		current = false,
		selected = false,
		searchMatch = false,
		showFiller = true,
		onclick,
		class: className = ''
	}: Props = $props();
</script>

<TranscriptWord
	{word}
	{current}
	{selected}
	{searchMatch}
	{showFiller}
	{onclick}
	class={className}
/>
