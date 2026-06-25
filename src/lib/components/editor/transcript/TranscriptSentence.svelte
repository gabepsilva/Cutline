<script lang="ts">
	import { formatTimecode } from '$lib/utils/format-timecode';
	import TranscriptWord from './TranscriptWord.svelte';
	import type { TranscriptSentenceProps } from './TranscriptSentence.types';

	let {
		sentence,
		startTime = 0,
		currentWordId = null,
		selectedWordId = null,
		searchQuery = '',
		showFiller = true,
		onTimeClick,
		onWordClick,
		class: className = ''
	}: TranscriptSentenceProps = $props();

	const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
	const timeLabel = $derived(formatTimecode(startTime));
	const timeAriaLabel = $derived(`Seek to ${timeLabel}`);
</script>

<div class={['transcript-sentence', className]}>
	<button
		type="button"
		class="transcript-sentence__time"
		aria-label={timeAriaLabel}
		onclick={onTimeClick}
	>
		{timeLabel}
	</button>
	<p class="transcript-sentence__body">
		{#each sentence.words as word (word.id)}
			<TranscriptWord
				{word}
				current={word.id === currentWordId}
				selected={word.id === selectedWordId}
				searchMatch={normalizedQuery.length > 0 && word.clean.includes(normalizedQuery)}
				{showFiller}
				onclick={onWordClick}
			/>
		{/each}
	</p>
</div>

<style>
	.transcript-sentence {
		display: flex;
		gap: 16px;
		margin-bottom: 13px;
	}

	.transcript-sentence__time {
		flex: 0 0 46px;
		margin: 0;
		padding: 3px 0 0;
		border: none;
		background: transparent;
		color: var(--text-9);
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: inherit;
		text-align: left;
		cursor: pointer;
		user-select: none;
	}

	.transcript-sentence__time:hover {
		color: var(--text-4);
	}

	.transcript-sentence__body {
		flex: 1;
		margin: 0;
		font-size: 16.5px;
		line-height: 1.95;
		color: var(--text-3);
		letter-spacing: -0.005em;
	}
</style>
