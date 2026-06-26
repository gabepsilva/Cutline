<script lang="ts">
	import ProjectOverflowMenu from './ProjectOverflowMenu.svelte';
	import type { Project } from '$lib/types/project';

	interface Props {
		project: Project;
		class?: string;
		onclick?: (project: Project, event: MouseEvent) => void;
		showMenu?: boolean;
	}

	let { project, class: className = '', onclick, showMenu = true }: Props = $props();
</script>

<article class={['project-card', className]}>
	<button type="button" class="project-card__main" onclick={(event) => onclick?.(project, event)}>
		<div class="project-card__thumb" style:background={project.thumb}>
			<div class="project-card__thumb-shine" aria-hidden="true"></div>
			<span class="project-card__duration">{project.durationLabel}</span>
			<span class="project-card__kind">{project.kind}</span>
		</div>
		<div class="project-card__body">
			<p class="project-card__title">{project.title}</p>
			<p class="project-card__meta">{project.meta}</p>
		</div>
	</button>
	{#if showMenu}
		<ProjectOverflowMenu {project} variant="card" />
	{/if}
</article>

<style>
	.project-card {
		position: relative;
		display: block;
		width: 100%;
		border: 1px solid var(--border-5);
		border-radius: 13px;
		overflow: hidden;
		background: var(--surface-3);
		transition: border-color 0.15s;
	}

	.project-card:hover {
		border-color: var(--border-7);
	}

	.project-card__main {
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		color: inherit;
	}

	.project-card__thumb {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
	}

	.project-card__thumb-shine {
		position: absolute;
		inset: 0;
		background: radial-gradient(70% 90% at 40% 35%, rgba(255, 255, 255, 0.05), transparent 70%);
		pointer-events: none;
	}

	.project-card__duration {
		position: absolute;
		bottom: 8px;
		right: 8px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		background: rgba(0, 0, 0, 0.6);
		padding: 2px 6px;
		border-radius: 4px;
		line-height: 1.2;
	}

	.project-card__kind {
		position: absolute;
		top: 8px;
		left: 8px;
		font-family: var(--font-mono);
		font-size: 9.5px;
		color: var(--text-6);
		background: rgba(0, 0, 0, 0.45);
		padding: 2px 6px;
		border-radius: 4px;
		line-height: 1.2;
		text-transform: uppercase;
	}

	.project-card__body {
		padding: 12px 13px 14px;
	}

	.project-card__title {
		margin: 0 0 5px;
		font-size: 13.5px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text-2);
		line-height: 1.2;
	}

	.project-card__meta {
		margin: 0;
		font-size: 11px;
		color: var(--text-7);
		line-height: 1.3;
	}
</style>
