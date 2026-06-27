<script lang="ts">
	import { goto, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ProjectImportShell from '$lib/components/editor/import/ProjectImportShell.svelte';

	let projectId = $state<string | null>(null);

	function handleProjectCreated(id: string) {
		projectId = id;
		replaceState(resolve(`/projects/${id}`), {});
	}

	function handleBatchComplete() {
		if (!projectId) return;
		void goto(resolve(`/projects/${projectId}`));
	}
</script>

<svelte:head>
	<title>New project — Cutline</title>
	<meta name="description" content="Import footage to start a new Cutline project" />
</svelte:head>

<div data-testid="new-project-page">
	<ProjectImportShell
		{projectId}
		onprojectcreated={handleProjectCreated}
		onbatchcomplete={handleBatchComplete}
	/>
</div>
