<script lang="ts">
	import ProjectGrid from './ProjectGrid.svelte';
	import { fixtureProjectCard } from '$lib/test/fixtures/project';
	import type { Project } from '$lib/types/project';

	interface Props {
		projects?: Project[];
		onprojectclick?: (project: Project, event: MouseEvent) => void;
	}

	let {
		projects = [
			fixtureProjectCard,
			{ ...fixtureProjectCard, id: 'proj-2', title: 'Founder interview' }
		],
		onprojectclick
	}: Props = $props();
</script>

<ProjectGrid {projects} {onprojectclick} />
