<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';
	import type { Project } from '$lib/types/project';

	interface Props {
		projects: Project[];
		class?: string;
		onprojectclick?: (project: Project, event: MouseEvent) => void;
	}

	let { projects, class: className = '', onprojectclick }: Props = $props();
</script>

<section class={['project-grid', className]} aria-label="Recent projects">
	<h2 class="project-grid__heading">Recent projects</h2>
	<div class="project-grid__list">
		{#each projects as project (project.id)}
			<ProjectCard {project} onclick={onprojectclick} />
		{/each}
	</div>
</section>

<style>
	.project-grid__heading {
		margin: 0 0 14px;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-4);
		line-height: 1.2;
	}

	.project-grid__list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(228px, 1fr));
		gap: 18px;
	}
</style>
