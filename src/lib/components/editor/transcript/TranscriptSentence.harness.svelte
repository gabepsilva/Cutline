<script lang="ts">
	import type { Sentence, Word } from '$lib/types/transcript';
	import { fixtureSentence } from '$lib/test/fixtures/transcript';
	import TranscriptSentence from './TranscriptSentence.svelte';

	interface Props {
		sentence?: Sentence;
		startTime?: number;
		currentWordId?: string | null;
		selectedWordId?: string | null;
		searchQuery?: string;
		showFiller?: boolean;
		onTimeClick?: (event: MouseEvent) => void;
		onWordClick?: (word: Word, event: MouseEvent) => void;
		class?: string;
	}

	let {
		sentence = fixtureSentence,
		startTime = 0,
		currentWordId = null,
		selectedWordId = null,
		searchQuery = '',
		showFiller = true,
		onTimeClick,
		onWordClick,
		class: className = ''
	}: Props = $props();
</script>

<TranscriptSentence
	{sentence}
	{startTime}
	{currentWordId}
	{selectedWordId}
	{searchQuery}
	{showFiller}
	{onTimeClick}
	{onWordClick}
	class={className}
/>
