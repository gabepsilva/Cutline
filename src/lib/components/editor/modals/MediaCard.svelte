<script lang="ts">
	import { formatTimecode } from '$lib/utils/format-timecode';
	import type { MediaResource } from '$lib/types/media';

	interface Props {
		resource: MediaResource;
		onclick?: () => void;
		class?: string;
	}

	let { resource, onclick, class: className = '' }: Props = $props();

	const durationLabel = $derived(formatTimecode(resource.dur));
</script>

<button type="button" class={['media-card', className]} {onclick}>
	<div class="media-card__thumb" style:background={resource.thumb}>
		<div class="media-card__thumb-glow" aria-hidden="true"></div>
		<span class="media-card__duration">{durationLabel}</span>
		<span class="media-card__kind">{resource.kind}</span>
	</div>
	<div class="media-card__footer">
		<span class="media-card__name">{resource.name}</span>
		<span class="media-card__add" aria-hidden="true">+</span>
	</div>
</button>

<style>
	.media-card {
		flex: 0 0 150px;
		width: 150px;
		padding: 0;
		border: 1px solid var(--border-5);
		border-radius: 10px;
		overflow: hidden;
		background: var(--surface-6);
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		color: inherit;
	}

	.media-card__thumb {
		position: relative;
		aspect-ratio: 16 / 9;
	}

	.media-card__thumb-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(70% 90% at 40% 35%, rgb(255 255 255 / 6%), transparent 70%);
	}

	.media-card__duration {
		position: absolute;
		bottom: 6px;
		right: 6px;
		font-family: var(--font-mono);
		font-size: 9.5px;
		color: var(--text-2);
		background: rgb(0 0 0 / 55%);
		padding: 2px 6px;
		border-radius: var(--radius-xs);
	}

	.media-card__kind {
		position: absolute;
		top: 6px;
		left: 6px;
		font-size: 8.5px;
		letter-spacing: 0.05em;
		color: var(--text-3);
		background: rgb(0 0 0 / 50%);
		padding: 2px 6px;
		border-radius: var(--radius-xs);
		text-transform: uppercase;
	}

	.media-card__footer {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 10px;
	}

	.media-card__name {
		flex: 1;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.media-card__add {
		flex: 0 0 auto;
		width: 20px;
		height: 20px;
		border-radius: 6px;
		background: var(--accent-tint-14);
		border: 1px solid var(--accent-tint-55);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		line-height: 1;
	}
</style>
