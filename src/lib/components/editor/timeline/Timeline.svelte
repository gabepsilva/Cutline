<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import TimelinePlayhead from './TimelinePlayhead.svelte';
	import TimelineRuler from './TimelineRuler.svelte';
	import TimelineToolbar from './TimelineToolbar.svelte';
	import TimelineClip from './TimelineClip.svelte';
	import TimelineTrack from './TimelineTrack.svelte';
	import { parsePercent } from '$lib/types/timeline';
	import type {
		TimelineBar,
		TimelineClipPlaceholder,
		TimelineTick,
		TimelineTrackLabel
	} from './Timeline.types';
	import TimelineWaveform from './TimelineWaveform.svelte';

	interface Props {
		ticks: TimelineTick[];
		bars: TimelineBar[];
		clips: TimelineClipPlaceholder[];
		playheadPercent: number;
		resourceCount?: number;
		snapEnabled?: boolean;
		brollEmpty?: boolean;
		trackLabels?: TimelineTrackLabel[];
		onrecord?: () => void;
		onmedia?: () => void;
		onsnapchange?: (enabled: boolean) => void;
		onseek?: (event: MouseEvent) => void;
		class?: string;
	}

	let {
		ticks,
		bars,
		clips,
		playheadPercent,
		resourceCount = 0,
		snapEnabled = true,
		brollEmpty = true,
		trackLabels = [
			{ id: 'broll', label: 'B-ROLL', variant: 'broll' },
			{ id: 'v1', label: 'V1' },
			{ id: 'a1', label: 'A1' },
			{ id: 'cc', label: 'CC' }
		],
		onrecord,
		onmedia,
		onsnapchange,
		onseek,
		class: className = ''
	}: Props = $props();

	function handleLanesClick(event: MouseEvent) {
		onseek?.(event);
	}

	function placeholderToClip(clip: TimelineClipPlaceholder) {
		return {
			leftPct: parsePercent(clip.left),
			widthPct: parsePercent(clip.width),
			label: clip.label ?? ''
		};
	}
</script>

<section class={['timeline', className]} aria-label="Timeline">
	<TimelineToolbar {resourceCount} {snapEnabled} {onrecord} {onmedia} {onsnapchange} />

	<div class="timeline__body">
		<div class="timeline__labels" aria-hidden="true">
			<div class="timeline__label-spacer"></div>
			{#each trackLabels as track (track.id)}
				<div class={['timeline__label', track.variant === 'broll' && 'timeline__label--broll']}>
					{#if track.variant === 'broll'}
						<span class="timeline__label-dot"></span>
					{/if}
					{track.label}
				</div>
			{/each}
		</div>

		<button
			type="button"
			class="timeline__lanes"
			aria-label="Timeline tracks"
			disabled={!onseek}
			onclick={handleLanesClick}
		>
			<TimelineRuler {ticks} />

			<TimelineTrack>
				{#if brollEmpty}
					<EmptyState
						title="Record or add B-roll — clips drop here at the playhead"
						align="start"
					/>
				{/if}
			</TimelineTrack>

			<TimelineTrack>
				{#each clips as clip (clip.id)}
					<TimelineClip id={clip.id} clip={placeholderToClip(clip)} variant="video" />
				{/each}
			</TimelineTrack>

			<TimelineTrack variant="waveform" padded={false}>
				<TimelineWaveform {bars} playedPercent={playheadPercent} />
			</TimelineTrack>

			<TimelineTrack>
				{#each clips as clip (clip.id)}
					<TimelineClip id={clip.id} clip={placeholderToClip(clip)} variant="caption" />
				{/each}
			</TimelineTrack>

			<TimelinePlayhead positionPercent={playheadPercent} />
		</button>
	</div>
</section>

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		height: var(--timeline-h);
		flex: 0 0 var(--timeline-h);
		background: var(--surface-1);
		border-top: 1px solid var(--border-3);
	}

	.timeline__body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.timeline__labels {
		display: flex;
		flex-direction: column;
		width: var(--track-label-w);
		flex: 0 0 var(--track-label-w);
		border-right: 1px solid var(--border-1);
	}

	.timeline__label-spacer {
		height: var(--ruler-h);
		flex: 0 0 var(--ruler-h);
		border-bottom: 1px solid var(--border-faint);
	}

	.timeline__label {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 6px;
		padding-left: 14px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-8);
		border-bottom: 1px solid var(--border-faint);
	}

	.timeline__label--broll {
		color: var(--danger-text);
	}

	.timeline__label-dot {
		width: 5px;
		height: 5px;
		border-radius: var(--radius-pill);
		background: var(--danger);
	}

	.timeline__lanes {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 0;
		border: none;
		background: transparent;
		font: inherit;
		text-align: inherit;
		color: inherit;
		cursor: text;
	}

	.timeline__lanes:disabled {
		cursor: text;
	}
</style>
