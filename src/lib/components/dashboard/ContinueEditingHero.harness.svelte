<script lang="ts">
	import ContinueEditingHero from './ContinueEditingHero.svelte';
	import { fixtureProject } from '$lib/test/fixtures/project';
	import type { Project } from '$lib/types/project';

	interface Props {
		project?: Project;
		onclick?: (project: Project, event: MouseEvent) => void;
		showMenu?: boolean;
	}

	let { project = fixtureProject, onclick, showMenu = false }: Props = $props();
</script>

<ContinueEditingHero {project} {onclick} {showMenu} />
