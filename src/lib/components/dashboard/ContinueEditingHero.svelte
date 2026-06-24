<script lang="ts">
	import type { Project } from '$lib/types/project';

	interface Props {
		project: Project;
		class?: string;
		onclick?: (project: Project, event: MouseEvent) => void;
	}

	let { project, class: className = '', onclick }: Props = $props();
</script>

<button
	type="button"
	class={['continue-editing-hero', className]}
	onclick={(event) => onclick?.(project, event)}
>
	<div class="continue-editing-hero__thumb" style:background={project.thumb}>
		<div class="continue-editing-hero__thumb-glow" aria-hidden="true"></div>
		<div class="continue-editing-hero__play" aria-hidden="true">
			<span class="continue-editing-hero__play-icon"></span>
		</div>
		<span class="continue-editing-hero__duration">{project.durationLabel}</span>
	</div>
	<div class="continue-editing-hero__content">
		<p class="continue-editing-hero__eyebrow">Continue editing</p>
		<h2 class="continue-editing-hero__title">{project.title}</h2>
		{#if project.description}
			<p class="continue-editing-hero__description">{project.description}</p>
		{/if}
		<p class="continue-editing-hero__meta">{project.meta}</p>
	</div>
</button>

<style>
	.continue-editing-hero {
		display: flex;
		gap: 22px;
		width: 100%;
		padding: 18px;
		margin: 0 0 34px;
		border: 1px solid var(--border-6);
		border-radius: 16px;
		background: linear-gradient(100deg, var(--surface-5), var(--surface-3));
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		color: inherit;
		transition: border-color 0.15s;
	}

	.continue-editing-hero:hover {
		border-color: var(--border-8);
	}

	.continue-editing-hero__thumb {
		position: relative;
		width: 300px;
		flex: 0 0 300px;
		aspect-ratio: 16 / 9;
		border-radius: 11px;
		overflow: hidden;
	}

	.continue-editing-hero__thumb-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			60% 80% at 35% 40%,
			color-mix(in srgb, var(--accent) 16%, transparent),
			transparent 70%
		);
		pointer-events: none;
	}

	.continue-editing-hero__play {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: rgba(11, 11, 13, 0.55);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 255, 255, 0.14);
	}

	.continue-editing-hero__play-icon {
		display: block;
		width: 0;
		height: 0;
		border-left: 15px solid #fff;
		border-top: 9px solid transparent;
		border-bottom: 9px solid transparent;
		margin-left: 4px;
	}

	.continue-editing-hero__duration {
		position: absolute;
		bottom: 10px;
		right: 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		background: rgba(0, 0, 0, 0.6);
		padding: 3px 7px;
		border-radius: 5px;
		line-height: 1.2;
	}

	.continue-editing-hero__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
	}

	.continue-editing-hero__eyebrow {
		margin: 0 0 9px;
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
		line-height: 1.2;
	}

	.continue-editing-hero__title {
		margin: 0 0 8px;
		font-size: 21px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-1);
		line-height: 1.15;
	}

	.continue-editing-hero__description {
		margin: 0;
		font-size: 13px;
		color: var(--text-5);
		line-height: 1.5;
		max-width: 520px;
	}

	.continue-editing-hero__meta {
		margin: 16px 0 0;
		font-size: 12px;
		color: var(--text-7);
		font-family: var(--font-mono);
		line-height: 1.4;
	}
</style>
