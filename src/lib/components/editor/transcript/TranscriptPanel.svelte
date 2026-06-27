<script lang="ts">
	import { activeWords, buildStartMap } from '$lib/editor/editor-derive';
	import Button from '$lib/components/ui/Button.svelte';
	import TranscriptSearch from './TranscriptSearch.svelte';
	import TranscriptSelectionBar from './TranscriptSelectionBar.svelte';
	import TranscriptSentence from './TranscriptSentence.svelte';
	import TranscriptSpeaker from './TranscriptSpeaker.svelte';
	import TranscriptTranscribingState from './TranscriptTranscribingState.svelte';
	import TranscriptUnavailableState from './TranscriptUnavailableState.svelte';
	import type { TranscriptPanelProps } from './TranscriptPanel.types';

	let {
		sentences,
		speaker,
		status = 'ready',
		transcriptionProgress = 0,
		transcriptionStage = 'Detecting speech…',
		searchQuery = '',
		fillerCount = 0,
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
	}: TranscriptPanelProps = $props();

	const isReady = $derived(status === 'ready');
	const isTranscribing = $derived(status === 'transcribing');

	const startMap = $derived.by(() => {
		const words = sentences.flatMap((sentence) => sentence.words);
		return buildStartMap(activeWords(words));
	});

	function sentenceStartTime(
		sentenceId: string,
		words: (typeof sentences)[number]['words']
	): number {
		if (sentenceStartTimes?.[sentenceId] !== undefined) {
			return sentenceStartTimes[sentenceId];
		}
		const firstActive = words.find((word) => !word.deleted);
		return firstActive ? (startMap[firstActive.id] ?? 0) : 0;
	}

	const fillerLabel = $derived(`Remove fillers · ${fillerCount}`);
</script>

<section class={['transcript-panel', className]} aria-label="Transcript">
	<header class="transcript-panel__header">
		<h2 class="transcript-panel__title">Transcript</h2>
		{#if isReady}
			<TranscriptSearch value={searchQuery} oninput={onsearch} />
			<Button
				variant="accent-outline"
				size="sm"
				class="transcript-panel__filler-action"
				onclick={onremovefillers}
			>
				<span class="transcript-panel__filler-dot" aria-hidden="true"></span>
				{fillerLabel}
			</Button>
		{/if}
	</header>

	{#if isReady}
		<TranscriptSelectionBar visible={hasSelection} {selectedText} {deleteLabel} {ondelete} />
	{/if}

	<div class="transcript-panel__body">
		{#if isTranscribing}
			<TranscriptTranscribingState stage={transcriptionStage} progress={transcriptionProgress} />
		{:else if status === 'unavailable'}
			<TranscriptUnavailableState />
		{:else}
			<TranscriptSpeaker {speaker} />

			{#each sentences as sentence (sentence.id)}
				<TranscriptSentence
					{sentence}
					startTime={sentenceStartTime(sentence.id, sentence.words)}
					{currentWordId}
					{selectedWordId}
					{searchQuery}
					{showFiller}
					onTimeClick={(event) => onsentenceclick?.(sentence, event)}
					onWordClick={onwordclick}
				/>
			{/each}
		{/if}
	</div>
</section>

<style>
	.transcript-panel {
		display: flex;
		flex: 1.25;
		flex-direction: column;
		min-width: 0;
		border-right: 1px solid var(--border-2);
		background: var(--surface-2);
	}

	.transcript-panel__header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 22px;
		border-bottom: 1px solid var(--border-2);
	}

	.transcript-panel__title {
		margin: 0;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-1);
	}

	.transcript-panel :global(.transcript-panel__filler-action) {
		margin-left: auto;
		flex-shrink: 0;
	}

	.transcript-panel__filler-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-pill);
		background: var(--accent);
	}

	.transcript-panel__body {
		flex: 1;
		overflow-y: auto;
		padding: 24px 22px 80px;
	}
</style>
