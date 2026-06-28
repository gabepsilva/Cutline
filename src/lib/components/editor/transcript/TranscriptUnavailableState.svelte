<script lang="ts">
	interface Props {
		class?: string;
		variant?: 'unavailable' | 'no-audio';
		/** Overrides the default body copy (e.g. surfaced POST or job error). */
		errorMessage?: string | null;
	}

	let { class: className = '', variant = 'unavailable', errorMessage = null }: Props = $props();

	const copy = $derived(
		variant === 'no-audio'
			? {
					title: 'No audio in this clip',
					body: 'This footage has no audio track — there is nothing to transcribe.'
				}
			: {
					title: 'Transcription failed',
					body: errorMessage ?? 'Something went wrong. Press Transcribe to try again.'
				}
	);
</script>

<div class={['transcript-unavailable', className]} role="status">
	<p class="transcript-unavailable__title">{copy.title}</p>
	<p class="transcript-unavailable__body">{copy.body}</p>
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
