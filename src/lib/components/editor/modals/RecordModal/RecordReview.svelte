<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		name: string;
		durationLabel: string;
		thumb: string;
		onkeep?: () => void;
		onaddtotimeline?: () => void;
		class?: string;
	}

	let {
		name,
		durationLabel,
		thumb,
		onkeep,
		onaddtotimeline,
		class: className = ''
	}: Props = $props();
</script>

<div class={['record-review', className]}>
	<div class="record-review__body">
		<div class="record-review__preview" style:background={thumb}>
			<div class="record-review__play" aria-hidden="true"></div>
		</div>

		<div class="record-review__meta">
			<p class="record-review__eyebrow">Clip captured</p>
			<p class="record-review__name">{name}</p>
			<p class="record-review__detail">{durationLabel} · added to media library</p>
		</div>
	</div>

	<div class="record-review__actions">
		<Button variant="secondary" onclick={onkeep}>Keep in library</Button>
		<Button variant="primary" onclick={onaddtotimeline}>Add to timeline at playhead</Button>
	</div>
</div>

<style>
	.record-review {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.record-review__body {
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.record-review__preview {
		position: relative;
		flex: 0 0 180px;
		width: 180px;
		aspect-ratio: 16 / 9;
		border-radius: 11px;
		overflow: hidden;
		border: 1px solid var(--border-7);
	}

	.record-review__play {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 42px;
		height: 42px;
		border-radius: var(--radius-pill);
		background: rgb(11 11 13 / 50%);
		border: 1px solid rgb(255 255 255 / 16%);
	}

	.record-review__play::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-40%, -50%);
		width: 0;
		height: 0;
		border-left: 12px solid var(--text-bright);
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
	}

	.record-review__meta {
		flex: 1;
	}

	.record-review__eyebrow {
		margin: 0 0 6px;
		font-size: 11px;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.record-review__name {
		margin: 0 0 5px;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-1);
	}

	.record-review__detail {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-7);
	}

	.record-review__actions {
		display: flex;
		gap: 10px;
	}

	.record-review__actions :global(.button) {
		flex: 1;
		padding: 12px;
		font-size: 13px;
		border-radius: 10px;
	}

	.record-review__actions :global(.button--primary) {
		flex: 1.4;
	}
</style>
