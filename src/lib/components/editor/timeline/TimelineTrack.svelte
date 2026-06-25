<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatPercent, overlayPercents, type Overlay } from '$lib/types/timeline';
	import type { Snippet } from 'svelte';

	type TimelineTrackBase = {
		class?: string;
	};

	type TimelineTrackLane = TimelineTrackBase & {
		variant?: 'default' | 'waveform';
		padded?: boolean;
		children: Snippet;
		overlays?: never;
		totalDuration?: never;
		onoverlayclick?: never;
		onoverlayremove?: never;
	};

	type TimelineTrackBroll = TimelineTrackBase & {
		variant: 'broll';
		overlays: Overlay[];
		totalDuration: number;
		onoverlayclick?: (overlay: Overlay) => void;
		onoverlayremove?: (id: string) => void;
		children?: never;
		padded?: never;
	};

	type Props = TimelineTrackLane | TimelineTrackBroll;

	let props: Props = $props();
</script>

<div
	class={[
		'timeline-track',
		`timeline-track--${props.variant === 'waveform' ? 'waveform' : 'default'}`,
		props.variant !== 'waveform' &&
			(props.variant === 'broll' || props.padded !== false) &&
			'timeline-track--padded',
		props.class
	]}
>
	{#if props.variant === 'broll'}
		{#if props.overlays.length === 0}
			<EmptyState
				class="timeline-track__empty"
				title="Record or add B-roll — clips drop here at the playhead"
				align="start"
			/>
		{:else}
			{#each props.overlays as overlay (overlay.id)}
				{@const layout = overlayPercents(overlay, props.totalDuration)}
				<div
					class="timeline-track__overlay"
					data-overlay-id={overlay.id}
					style:left={formatPercent(layout.leftPct, 2)}
					style:width={formatPercent(layout.widthPct, 2)}
					style:--overlay-thumb={overlay.thumb}
				>
					<button
						type="button"
						class="timeline-track__overlay-seek"
						aria-label={`Seek to ${overlay.name}`}
						onclick={(event) => {
							event.stopPropagation();
							props.onoverlayclick?.(overlay);
						}}
					>
						<span class="timeline-track__overlay-name">{overlay.name}</span>
					</button>
					<button
						type="button"
						class="timeline-track__overlay-remove"
						aria-label={`Remove ${overlay.name}`}
						onclick={(event) => {
							event.stopPropagation();
							props.onoverlayremove?.(overlay.id);
						}}
					>
						<span aria-hidden="true">✕</span>
					</button>
				</div>
			{/each}
		{/if}
	{:else if props.children}
		{@render props.children()}
	{/if}
</div>

<style>
	.timeline-track {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		border-bottom: 1px solid var(--border-faint);
	}

	.timeline-track--padded {
		padding: 5px;
	}

	.timeline-track--waveform {
		padding: 0;
		background: var(--surface-2);
	}

	.timeline-track__empty {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		padding-left: 10px;
	}

	.timeline-track__overlay {
		position: absolute;
		top: 5px;
		bottom: 5px;
		border: 1px solid var(--accent-tint-55);
		border-radius: 5px;
		overflow: hidden;
		background: var(--overlay-thumb);
		box-shadow: inset 0 0 0 9999px var(--accent-tint-08);
	}

	.timeline-track__overlay-seek {
		position: absolute;
		inset: 0;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		font: inherit;
		text-align: left;
		color: inherit;
	}

	.timeline-track__overlay-name {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 2px 7px;
		background: linear-gradient(transparent, color-mix(in srgb, var(--surface-0) 65%, transparent));
		font-size: 9.5px;
		font-weight: 500;
		color: var(--text-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}

	.timeline-track__overlay-remove {
		position: absolute;
		top: 3px;
		right: 3px;
		width: 15px;
		height: 15px;
		padding: 0;
		border: none;
		border-radius: 4px;
		background: color-mix(in srgb, var(--surface-0) 55%, transparent);
		color: var(--text-1);
		font-size: 9px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.timeline-track__overlay-remove:hover {
		background: color-mix(in srgb, var(--surface-0) 75%, transparent);
	}
</style>
