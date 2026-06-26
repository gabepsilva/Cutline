<script lang="ts">
	import { formatTimecode } from '$lib/utils/format-timecode';
	import VideoThumb from '$lib/components/ui/VideoThumb.svelte';
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
	<VideoThumb variant="media" thumb={resource.thumb} {durationLabel} kind={resource.kind} />
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
