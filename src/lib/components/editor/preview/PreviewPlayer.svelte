<script lang="ts">
	import RecBadge from '$lib/components/ui/RecBadge.svelte';
	import { formatTimecode } from '$lib/utils/format-timecode';
	import type { PreviewPlayerProps } from './PreviewPlayer.types';

	let {
		playing,
		currentTime,
		recLabel = 'REC 1080p',
		videoUrl = null,
		showSimulated = true,
		captions,
		ontogglePlay,
		class: className = ''
	}: PreviewPlayerProps = $props();

	const timecodeLabel = $derived(formatTimecode(currentTime));
	const playLabel = $derived(playing ? 'Pause preview' : 'Play preview');
	const useSimulated = $derived(showSimulated && !videoUrl);
</script>

<div class={['preview-player', className]}>
	{#if videoUrl}
		<video
			class="preview-player__video"
			src={videoUrl}
			muted
			playsinline
			aria-label="Project preview video"
		></video>
	{/if}

	{#if useSimulated}
		<div class="preview-player__simulated" aria-hidden="true">
			<div class="preview-player__simulated-glow"></div>
			<div class="preview-player__simulated-subject"></div>
		</div>
	{/if}

	<RecBadge label={recLabel} class="preview-player__rec" />

	<div class="preview-player__timecode" aria-label="Current time">{timecodeLabel}</div>

	{#if captions}
		<div class="preview-player__captions">
			{@render captions()}
		</div>
	{/if}

	<button type="button" class="preview-player__play" aria-label={playLabel} onclick={ontogglePlay}>
		{#if playing}
			<span class="preview-player__pause-icon" aria-hidden="true">
				<span class="preview-player__pause-bar"></span>
				<span class="preview-player__pause-bar"></span>
			</span>
		{:else}
			<span class="preview-player__play-icon" aria-hidden="true"></span>
		{/if}
	</button>
</div>

<style>
	.preview-player {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 13px;
		overflow: hidden;
		background: repeating-linear-gradient(
			135deg,
			var(--surface-5) 0 14px,
			var(--surface-2) 14px 28px
		);
		border: 1px solid var(--border-4);
	}

	.preview-player__video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-player__simulated {
		position: absolute;
		inset: 0;
	}

	.preview-player__simulated-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(58% 75% at 38% 42%, var(--accent-tint-14), transparent 68%);
	}

	.preview-player__simulated-subject {
		position: absolute;
		left: 32%;
		top: 46%;
		transform: translate(-50%, -50%);
		width: 120px;
		height: 120px;
		border-radius: var(--radius-pill);
		background: radial-gradient(circle at 40% 35%, var(--border-7), var(--surface-5));
		border: 1px solid var(--border-7);
	}

	.preview-player :global(.preview-player__rec) {
		position: absolute;
		left: 8px;
		top: 8px;
	}

	.preview-player__timecode {
		position: absolute;
		right: 8px;
		top: 8px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-2);
		background: rgb(0 0 0 / 45%);
		padding: 3px 8px;
		border-radius: 5px;
		line-height: 1;
	}

	.preview-player__captions {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 18px;
		display: flex;
		justify-content: center;
		padding: 0 26px;
		pointer-events: none;
	}

	.preview-player__play {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 60px;
		height: 60px;
		border-radius: var(--radius-pill);
		background: rgb(11 11 13 / 50%);
		backdrop-filter: blur(5px);
		border: 1px solid rgb(255 255 255 / 14%);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--text-bright);
		padding: 0;
	}

	.preview-player__play:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.preview-player__play-icon {
		width: 0;
		height: 0;
		border-left: 17px solid currentColor;
		border-top: 11px solid transparent;
		border-bottom: 11px solid transparent;
		margin-left: 4px;
	}

	.preview-player__pause-icon {
		display: flex;
		gap: 5px;
	}

	.preview-player__pause-bar {
		width: 4px;
		height: 18px;
		background: currentColor;
		border-radius: 2px;
	}
</style>
