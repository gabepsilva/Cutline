<script lang="ts">
	import { rulerTicks, trackClips, waveformBars } from '$lib/editor/editor-derive';
	import {
		toTimelineBars,
		toTimelineClips,
		toTimelineTicks
	} from '$lib/editor/editor-timeline-view';
	import { waveformBarsFromEdl } from '$lib/editor/waveform';
	import { mockTimelineDurationSeconds } from '$lib/mocks/timeline.mock';
	import TimelineFilmstrip from './TimelineFilmstrip.svelte';
	import TimelinePlayhead from './TimelinePlayhead.svelte';
	import TimelineProcessing from './TimelineProcessing.svelte';
	import TimelineRuler from './TimelineRuler.svelte';
	import TimelineToolbar from './TimelineToolbar.svelte';
	import TimelineClip from './TimelineClip.svelte';
	import TimelineTrack from './TimelineTrack.svelte';
	import { parsePercent } from '$lib/types/timeline';
	import type { TimelineClipPlaceholder, TimelineProps } from './Timeline.types';
	import TimelineWaveform from './TimelineWaveform.svelte';

	const defaultTrackLabels: NonNullable<TimelineProps['trackLabels']> = [
		{ id: 'broll', label: 'B-ROLL', variant: 'broll' },
		{ id: 'v1', label: 'V1' },
		{ id: 'a1', label: 'A1' },
		{ id: 'cc', label: 'CC' }
	];

	let {
		editor,
		ingestAssets = null,
		transcriptStatus = 'ready',
		ticks,
		bars,
		clips,
		playheadPercent,
		resourceCount = 0,
		snapEnabled = true,
		brollEmpty = true,
		overlays,
		totalDuration,
		onoverlayclick,
		onoverlayremove,
		trackLabels = defaultTrackLabels,
		onrecord,
		onmedia,
		onsnapchange,
		onseek,
		class: className = ''
	}: TimelineProps = $props();

	const resolvedTicks = $derived(
		editor ? toTimelineTicks(rulerTicks(editor.duration)) : (ticks ?? [])
	);
	const resolvedBars = $derived(
		editor
			? toTimelineBars(
					ingestAssets?.waveform
						? waveformBarsFromEdl(editor.words, ingestAssets.waveform)
						: waveformBars(editor.active, editor.startMap, editor.duration)
				)
			: (bars ?? [])
	);
	const showIngestProcessing = $derived(
		Boolean(editor && ingestAssets && ingestAssets.status === 'ingesting')
	);
	const showCaptionPlaceholder = $derived(transcriptStatus === 'transcribing');
	const showFilmstrip = $derived(
		Boolean(
			editor &&
			ingestAssets?.filmstripUrl &&
			ingestAssets.filmstripMeta &&
			ingestAssets.status === 'ready'
		)
	);
	const resolvedClips = $derived(
		editor
			? toTimelineClips(trackClips(editor.words, editor.startMap, editor.duration))
			: (clips ?? [])
	);
	const resolvedPlayheadPercent = $derived(editor ? editor.playheadPct : (playheadPercent ?? 0));
	const resolvedResourceCount = $derived(editor ? editor.resources.length : resourceCount);
	const resolvedOverlays = $derived(editor ? editor.overlays : (overlays ?? []));
	const resolvedTotalDuration = $derived(
		editor ? editor.duration : (totalDuration ?? mockTimelineDurationSeconds)
	);
	const resolvedBrollEmpty = $derived(
		editor ? editor.overlays.length === 0 : brollEmpty && resolvedOverlays.length === 0
	);

	const handleOverlayClick = (overlay: (typeof resolvedOverlays)[number]) =>
		editor ? editor.seek(overlay.start) : onoverlayclick?.(overlay);
	const handleOverlayRemove = (id: string) =>
		editor ? editor.removeOverlay(id) : onoverlayremove?.(id);

	const handleRecord = () => (editor ? editor.openRecord() : onrecord?.());
	const handleMedia = () => (editor ? editor.toggleMedia() : onmedia?.());
	const handleSeek = (event: MouseEvent) => {
		if (!editor && !onseek) return;
		const target = event.target;
		if (target instanceof Element && target.closest('.timeline-track__overlay')) return;
		if (editor) editor.seekFromTimelineClick(event);
		else onseek?.(event);
	};

	function placeholderToClip(clip: TimelineClipPlaceholder) {
		return {
			leftPct: parsePercent(clip.left),
			widthPct: parsePercent(clip.width),
			label: clip.label ?? ''
		};
	}
</script>

<section class={['timeline', className]} aria-label="Timeline">
	<TimelineToolbar
		resourceCount={resolvedResourceCount}
		{snapEnabled}
		snapDisabled={Boolean(editor)}
		onrecord={handleRecord}
		onmedia={handleMedia}
		onsnapchange={editor ? undefined : onsnapchange}
	/>

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

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class={['timeline__lanes', !editor && !onseek && 'timeline__lanes--disabled']}
			role="group"
			aria-label="Timeline tracks"
			onclick={handleSeek}
		>
			<TimelineRuler ticks={resolvedTicks} />

			<TimelineTrack
				variant="broll"
				overlays={resolvedBrollEmpty ? [] : resolvedOverlays}
				totalDuration={resolvedTotalDuration}
				onoverlayclick={handleOverlayClick}
				onoverlayremove={handleOverlayRemove}
			/>

			<TimelineTrack>
				{#if showFilmstrip && editor && ingestAssets?.filmstripUrl && ingestAssets.filmstripMeta}
					<TimelineFilmstrip
						words={editor.words}
						filmstripUrl={ingestAssets.filmstripUrl}
						meta={ingestAssets.filmstripMeta}
					/>
				{:else}
					{#each resolvedClips as clip (clip.id)}
						<TimelineClip id={clip.id} clip={placeholderToClip(clip)} variant="video" />
					{/each}
				{/if}
				{#if showIngestProcessing}
					<TimelineProcessing />
				{/if}
			</TimelineTrack>

			<TimelineTrack variant="waveform" padded={false}>
				<TimelineWaveform bars={resolvedBars} playedPercent={resolvedPlayheadPercent} />
				{#if showIngestProcessing}
					<TimelineProcessing />
				{/if}
			</TimelineTrack>

			<TimelineTrack>
				{#if showCaptionPlaceholder}
					<div class="timeline__caption-placeholder">
						Captions appear once transcription finishes.
					</div>
				{:else}
					{#each resolvedClips as clip (clip.id)}
						<TimelineClip id={clip.id} clip={placeholderToClip(clip)} variant="caption" />
					{/each}
				{/if}
			</TimelineTrack>

			<TimelinePlayhead positionPercent={resolvedPlayheadPercent} />
		</div>
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

	.timeline__lanes:disabled,
	.timeline__lanes--disabled {
		cursor: text;
	}

	.timeline__caption-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		padding-left: 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-9);
	}
</style>
