<script lang="ts">
	import type { TranscriptWordProps } from './TranscriptWord.types';

	let {
		word,
		current = false,
		selected = false,
		searchMatch = false,
		showFiller = true,
		onclick,
		class: className = ''
	}: TranscriptWordProps = $props();

	const isDeleted = $derived(word.deleted);
	const isFiller = $derived(word.filler && showFiller && !isDeleted);
	const isSelected = $derived(selected && !current && !isDeleted);
	const isCurrent = $derived(current && !isDeleted);
	const isMatch = $derived(searchMatch && !isDeleted);

	const label = $derived(
		isDeleted ? `${word.text}, deleted` : isCurrent ? `${word.text}, current` : word.text
	);
</script>

<button
	type="button"
	class={[
		'transcript-word',
		{
			'transcript-word--current': isCurrent,
			'transcript-word--selected': isSelected,
			'transcript-word--filler': isFiller,
			'transcript-word--deleted': isDeleted,
			'transcript-word--match': isMatch
		},
		className
	]}
	aria-label={label}
	aria-pressed={isSelected || isCurrent ? true : undefined}
	aria-current={isCurrent ? 'true' : undefined}
	onclick={(event) => onclick?.(word, event)}
>
	<!-- Trailing space mirrors the design's `display: w.text + ' '` so adjacent words
	     stay separated and the highlight pill includes the inter-word gap. -->
	{word.text + ' '}
</button>

<style>
	.transcript-word {
		display: inline;
		margin: 0;
		padding: 1px 2px;
		border: none;
		border-radius: 5px;
		background: transparent;
		color: var(--text-3);
		font-family: inherit;
		font-size: inherit;
		font-weight: 400;
		line-height: inherit;
		cursor: pointer;
		text-decoration: none;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		transition:
			background-color 0.1s,
			color 0.1s,
			box-shadow 0.1s;
	}

	.transcript-word--match {
		background: var(--highlight);
		color: var(--text-bright);
	}

	.transcript-word--filler {
		color: var(--filler);
		text-decoration: underline dotted;
		text-decoration-color: var(--accent);
		text-underline-offset: 3px;
	}

	.transcript-word--selected {
		background: var(--accent-tint-08);
		box-shadow: inset 0 0 0 1.5px var(--accent);
	}

	.transcript-word--current {
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
		text-decoration: none;
	}

	.transcript-word--deleted {
		background: transparent;
		box-shadow: none;
		color: var(--text-deleted);
		font-weight: 400;
		text-decoration: line-through;
		text-decoration-color: rgb(255 255 255 / 45%);
	}
</style>
