<script lang="ts">
	import { formatTranscriptionPercent } from '$lib/types/transcript-ui';

	interface Props {
		stage: string;
		progress: number;
		class?: string;
	}

	let { stage, progress, class: className = '' }: Props = $props();

	const percentLabel = $derived(formatTranscriptionPercent(progress));
</script>

<div class={['transcript-transcribing', className]} role="status" aria-live="polite">
	<div class="transcript-transcribing__banner">
		<span class="transcript-transcribing__spinner" aria-hidden="true"></span>
		<div class="transcript-transcribing__copy">
			<div class="transcript-transcribing__stage">{stage}</div>
			<p class="transcript-transcribing__hint">
				Runs in the background — words drop in as they're recognized.
			</p>
		</div>
		<div class="transcript-transcribing__percent">{percentLabel}</div>
	</div>

	<div class="transcript-transcribing__rows">
		{#each ['a', 'b', 'c'] as rowId (rowId)}
			<div class="transcript-transcribing__row">
				<div class="transcript-transcribing__time" aria-hidden="true"></div>
				<div class="transcript-transcribing__lines">
					{#each rowId === 'b' ? ['one', 'two', 'three'] : ['one', 'two'] as lineId (`${rowId}-${lineId}`)}
						<div
							class="transcript-transcribing__line"
							style:--line-width={lineId === 'one' ? '94%' : lineId === 'two' ? '72%' : '61%'}
						></div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.transcript-transcribing__banner {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 13px 15px;
		margin-bottom: 24px;
		background: rgba(255, 106, 61, 0.07);
		border: 1px solid rgba(255, 106, 61, 0.22);
		border-radius: 11px;
	}

	.transcript-transcribing__spinner {
		width: 16px;
		height: 16px;
		flex: 0 0 16px;
		border-radius: 50%;
		border: 2px solid rgba(255, 106, 61, 0.3);
		border-top-color: var(--accent);
		animation: spin 0.8s linear infinite;
	}

	.transcript-transcribing__copy {
		flex: 1;
		min-width: 0;
	}

	.transcript-transcribing__stage {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.transcript-transcribing__hint {
		margin: 2px 0 0;
		font-size: 11px;
		color: var(--text-6);
	}

	.transcript-transcribing__percent {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--accent);
	}

	.transcript-transcribing__rows {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.transcript-transcribing__row {
		display: flex;
		gap: 16px;
	}

	.transcript-transcribing__time {
		flex: 0 0 46px;
		padding-top: 4px;
	}

	.transcript-transcribing__time::before {
		content: '';
		display: block;
		height: 11px;
		width: 30px;
		border-radius: 4px;
		background: var(--surface-4);
	}

	.transcript-transcribing__lines {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 3px;
	}

	.transcript-transcribing__line {
		height: 13px;
		width: var(--line-width, 80%);
		border-radius: 5px;
		background: linear-gradient(90deg, #15151a 25%, #202027 50%, #15151a 75%);
		background-size: 200% 100%;
		animation: transcript-shine 1.5s linear infinite;
	}

	@keyframes transcript-shine {
		to {
			background-position: -200% 0;
		}
	}
</style>
