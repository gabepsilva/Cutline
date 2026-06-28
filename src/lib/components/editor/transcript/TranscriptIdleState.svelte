<script lang="ts">
	interface Props {
		class?: string;
		/** When true, clip is still ingesting — transcribe is not available yet. */
		processing?: boolean;
	}

	let { class: className = '', processing = false }: Props = $props();

	const body = $derived(
		processing
			? 'Your clip is still processing. Transcribe will be available once ingest finishes.'
			: 'Transcribe your clip to unlock word-level editing, captions, and filler removal.'
	);
</script>

<div class={['transcript-idle', className]} role="status">
	<p class="transcript-idle__title">No transcript yet</p>
	<p class="transcript-idle__body">{body}</p>
</div>

<style>
	.transcript-idle {
		padding: 16px 18px;
		border-radius: 11px;
		background: var(--surface-3);
		border: 1px solid var(--border-3);
	}

	.transcript-idle__title {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.transcript-idle__body {
		margin: 6px 0 0;
		font-size: 12px;
		line-height: 1.45;
		color: var(--text-6);
	}
</style>
