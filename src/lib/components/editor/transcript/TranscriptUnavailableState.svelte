<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class={['transcript-unavailable', className]} role="status">
	<p class="transcript-unavailable__title">Transcription not available</p>
	<p class="transcript-unavailable__body">
		Upload A-roll footage to generate a transcript, or retry if a previous job failed.
	</p>
</div>

<style>
	.transcript-unavailable {
		padding: 16px 18px;
		border-radius: 11px;
		background: var(--surface-3);
		border: 1px solid var(--border-3);
	}

	.transcript-unavailable__title {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.transcript-unavailable__body {
		margin: 6px 0 0;
		font-size: 12px;
		line-height: 1.45;
		color: var(--text-6);
	}
</style>
