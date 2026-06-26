<script lang="ts">
	import ProjectOverflowMenu from './ProjectOverflowMenu.svelte';
	import VideoThumb from '$lib/components/ui/VideoThumb.svelte';
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
		<VideoThumb
			variant="project"
			thumb={project.thumb}
			durationLabel={project.durationLabel}
			kind={project.kind}
		/>
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
