<script lang="ts">
	interface Props {
		thumb: string;
		durationLabel: string;
		kind: string;
		variant: 'project' | 'media';
		class?: string;
	}

	let { thumb, durationLabel, kind, variant, class: className = '' }: Props = $props();
</script>

<div class={['video-thumb', `video-thumb--${variant}`, className]} style:background={thumb}>
	<div class="video-thumb__shine" aria-hidden="true"></div>
	<span class="video-thumb__duration">{durationLabel}</span>
	<span class="video-thumb__kind">{kind}</span>
</div>

<style>
	.video-thumb {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
	}

	.video-thumb__shine {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.video-thumb__duration {
		position: absolute;
		font-family: var(--font-mono);
		padding: 2px 6px;
	}

	.video-thumb__kind {
		position: absolute;
		padding: 2px 6px;
		text-transform: uppercase;
	}

	.video-thumb--project .video-thumb__shine {
		background: radial-gradient(70% 90% at 40% 35%, rgba(255, 255, 255, 0.05), transparent 70%);
	}

	.video-thumb--project .video-thumb__duration {
		bottom: 8px;
		right: 8px;
		font-size: 10.5px;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 4px;
		line-height: 1.2;
	}

	.video-thumb--project .video-thumb__kind {
		top: 8px;
		left: 8px;
		font-family: var(--font-mono);
		font-size: 9.5px;
		color: var(--text-6);
		background: rgba(0, 0, 0, 0.45);
		border-radius: 4px;
		line-height: 1.2;
	}

	.video-thumb--media .video-thumb__shine {
		background: radial-gradient(70% 90% at 40% 35%, rgb(255 255 255 / 6%), transparent 70%);
	}

	.video-thumb--media .video-thumb__duration {
		bottom: 6px;
		right: 6px;
		font-size: 9.5px;
		color: var(--text-2);
		background: rgb(0 0 0 / 55%);
		border-radius: var(--radius-xs);
	}

	.video-thumb--media .video-thumb__kind {
		top: 6px;
		left: 6px;
		font-size: 8.5px;
		letter-spacing: 0.05em;
		color: var(--text-3);
		background: rgb(0 0 0 / 50%);
		border-radius: var(--radius-xs);
	}
</style>
