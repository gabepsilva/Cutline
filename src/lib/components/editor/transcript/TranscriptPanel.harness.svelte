<script lang="ts">
	import type { Sentence } from '$lib/types/transcript';
	import { fixtureSentence } from '$lib/test/fixtures/transcript';
	import { fixtureUser } from '$lib/test/fixtures/user';
	import TranscriptPanel from './TranscriptPanel.svelte';
	import type { TranscriptPanelProps } from './TranscriptPanel.types';

	interface Props extends Omit<TranscriptPanelProps, 'sentences' | 'speaker'> {
		sentences?: Sentence[];
		speaker?: TranscriptPanelProps['speaker'];
		status?: TranscriptPanelProps['status'];
		transcriptionProgress?: number;
		transcriptionStage?: string;
	}

	let {
		sentences = [fixtureSentence],
		speaker = {
			name: fixtureUser.name,
			initials: fixtureUser.initials
		},
		speakersByLabel,
		status = 'ready',
		transcriptionProgress = 0,
		transcriptionStage = 'Detecting speech…',
		mediaProcessing = false,
		transcribeDisabled = false,
		transcribePending = false,
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
		ontranscribe,
		class: className = ''
	}: Props = $props();
</script>

<TranscriptPanel
	{sentences}
	{speaker}
	{speakersByLabel}
	{status}
	{transcriptionProgress}
	{transcriptionStage}
	{mediaProcessing}
	{transcribeDisabled}
	{transcribePending}
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
	{ontranscribe}
	class={className}
/>
