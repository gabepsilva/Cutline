<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import type { TranscriptSelectionBarProps } from './TranscriptSelectionBar.types';

	let {
		visible = false,
		selectedText = '',
		deleteLabel = 'Delete word',
		ondelete,
		class: className = ''
	}: TranscriptSelectionBarProps = $props();
</script>

{#if visible}
	<div class={['transcript-selection-bar', className]} role="region" aria-label="Selection actions">
		<p class="transcript-selection-bar__label">
			Selected
			<span class="transcript-selection-bar__quote">"{selectedText}"</span>
		</p>
		<Button
			variant="secondary"
			size="sm"
			class="transcript-selection-bar__action"
			onclick={ondelete}
		>
			{deleteLabel}
			<span class="transcript-selection-bar__shortcut" aria-hidden="true">⌫</span>
		</Button>
	</div>
{/if}

<style>
	.transcript-selection-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 22px;
		border-bottom: 1px solid var(--border-2);
		background: var(--surface-4);
	}

	.transcript-selection-bar__label {
		margin: 0;
		font-size: 12px;
		color: var(--text-6);
	}

	.transcript-selection-bar__quote {
		color: var(--text-1);
		font-family: var(--font-mono);
	}

	.transcript-selection-bar :global(.transcript-selection-bar__action) {
		margin-left: auto;
		gap: 7px;
		padding: 5px 11px;
		border-radius: var(--radius-sm);
		background: var(--accent-tint-14);
		border-color: var(--accent-tint-32);
		color: var(--filler);
		font-size: 12px;
	}

	.transcript-selection-bar__shortcut {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--text-5);
	}
</style>
