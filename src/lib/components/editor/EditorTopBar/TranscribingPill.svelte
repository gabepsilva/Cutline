<script lang="ts">
	import { formatTranscriptionPercent } from '$lib/types/transcript-ui';

	interface Props {
		progress: number;
		class?: string;
	}

	let { progress, class: className = '' }: Props = $props();

	const percentLabel = $derived(formatTranscriptionPercent(progress));
</script>

<div class={['transcribing-pill', className]} role="status" aria-live="polite">
	<span class="transcribing-pill__spinner" aria-hidden="true"></span>
	<span class="transcribing-pill__label">Transcribing</span>
	<span class="transcribing-pill__percent" aria-hidden="true"> · {percentLabel}</span>
</div>

<style>
	.transcribing-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 11px;
		border-radius: var(--radius-md);
		background: rgba(255, 106, 61, 0.1);
		border: 1px solid rgba(255, 106, 61, 0.3);
		font-size: 12px;
		font-weight: 500;
		color: var(--accent);
		flex-shrink: 0;
	}

	.transcribing-pill__spinner {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid rgba(255, 106, 61, 0.3);
		border-top-color: var(--accent);
		animation: spin 0.8s linear infinite;
	}
</style>
