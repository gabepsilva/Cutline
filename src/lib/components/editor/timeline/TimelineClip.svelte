<script lang="ts">
	import { clipCssPercent } from '$lib/types/timeline';
	import type { TimelineClipProps } from './TimelineClip.types';

	let { id, clip, variant = 'video', class: className = '' }: TimelineClipProps = $props();

	const position = $derived(clipCssPercent(clip));
</script>

<div
	class={['timeline-clip', `timeline-clip--${variant}`, className]}
	data-clip-id={id}
	style:left={position.left}
	style:width={position.width}
>
	{#if variant === 'video'}
		<div class="timeline-clip__glow" aria-hidden="true"></div>
	{:else}
		<span class="timeline-clip__label">{clip.label}</span>
	{/if}
</div>

<style>
	.timeline-clip {
		position: absolute;
		top: 5px;
		bottom: 5px;
		border-radius: var(--radius-xs);
		overflow: hidden;
	}

	.timeline-clip--video {
		border: 1px solid var(--border-7);
		background: repeating-linear-gradient(
			135deg,
			var(--surface-active) 0 8px,
			var(--surface-7) 8px 16px
		);
	}

	.timeline-clip__glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(60% 90% at 40% 40%, var(--accent-tint-10), transparent 70%);
	}

	.timeline-clip--caption {
		display: flex;
		align-items: center;
		padding: 0 7px;
		background: var(--accent-tint-10);
		border: 1px solid var(--accent-tint-32);
	}

	.timeline-clip__label {
		font-size: 10px;
		color: color-mix(in srgb, var(--accent) 35%, var(--text-2));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
