<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';
	import type { Project } from '$lib/types/project';
	import { fixtureProjectCard } from '$lib/test/fixtures/project';

	interface Props {
		project?: Project;
		onclick?: (project: Project, event: MouseEvent) => void;
	}

	let { project = fixtureProjectCard, onclick }: Props = $props();
</script>

<ProjectCard {project} {onclick} />
