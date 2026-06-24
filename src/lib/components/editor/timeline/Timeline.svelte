<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import TimelinePlayhead from './TimelinePlayhead.svelte';
	import TimelineRuler from './TimelineRuler.svelte';
	import TimelineToolbar from './TimelineToolbar.svelte';
	import TimelineTrack from './TimelineTrack.svelte';
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
					<div class="timeline__video-clip" style:left={clip.left} style:width={clip.width}>
						<div class="timeline__video-clip-glow" aria-hidden="true"></div>
					</div>
				{/each}
			</TimelineTrack>

			<TimelineTrack variant="waveform" padded={false}>
				<TimelineWaveform {bars} playedPercent={playheadPercent} />
			</TimelineTrack>

			<TimelineTrack>
				{#each clips as clip (clip.id)}
					<div class="timeline__caption-clip" style:left={clip.left} style:width={clip.width}>
						<span class="timeline__caption-label">{clip.label ?? ''}</span>
					</div>
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

	.timeline__video-clip {
		position: absolute;
		top: 5px;
		bottom: 5px;
		border-radius: var(--radius-xs);
		overflow: hidden;
		border: 1px solid var(--border-7);
		background: repeating-linear-gradient(
			135deg,
			var(--surface-active) 0 8px,
			var(--surface-7) 8px 16px
		);
	}

	.timeline__video-clip-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(60% 90% at 40% 40%, var(--accent-tint-10), transparent 70%);
	}

	.timeline__caption-clip {
		position: absolute;
		top: 5px;
		bottom: 5px;
		display: flex;
		align-items: center;
		padding: 0 7px;
		border-radius: var(--radius-xs);
		overflow: hidden;
		background: var(--accent-tint-10);
		border: 1px solid var(--accent-tint-32);
	}

	.timeline__caption-label {
		font-size: 10px;
		color: color-mix(in srgb, var(--accent) 35%, var(--text-2));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
