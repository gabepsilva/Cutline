<script lang="ts">
	import type { Sentence } from '$lib/types/transcript';
	import { fixtureSentence } from '$lib/test/fixtures/transcript';
	import { fixtureUser } from '$lib/test/fixtures/user';
	import TranscriptPanel from './TranscriptPanel.svelte';
	import type { TranscriptPanelProps } from './TranscriptPanel.types';

	interface Props extends Omit<TranscriptPanelProps, 'sentences' | 'speaker'> {
		sentences?: Sentence[];
		speaker?: TranscriptPanelProps['speaker'];
	}

	let {
		sentences = [fixtureSentence],
		speaker = {
			name: fixtureUser.name,
			initials: fixtureUser.initials
		},
		searchQuery = '',
		fillerCount = 1,
		hasSelection = false,
		selectedText = '',
		deleteLabel = 'Delete word',
		currentWordId = null,
		selectedWordId = null,
		showFiller = true,
		sentenceStartTimes,
		onsearch,
		onremovefillers,
		ondelete,
		onsentenceclick,
		onwordclick,
		class: className = ''
	}: Props = $props();
</script>

<TranscriptPanel
	{sentences}
	{speaker}
	{searchQuery}
	{fillerCount}
	{hasSelection}
	{selectedText}
	{deleteLabel}
	{currentWordId}
	{selectedWordId}
	{showFiller}
	{sentenceStartTimes}
	{onsearch}
	{onremovefillers}
	{ondelete}
	{onsentenceclick}
	{onwordclick}
	class={className}
/>
