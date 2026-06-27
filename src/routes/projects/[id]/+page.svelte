<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import EditorWorkspace from '$lib/components/editor/EditorWorkspace.svelte';
	import ProjectImportShell from '$lib/components/editor/import/ProjectImportShell.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function editorLoadData(load: PageData) {
		const { mode, ...editorData } = load;
		void mode;
		return editorData;
	}

	function handleImportBatchComplete() {
		void invalidateAll();
	}
</script>

<svelte:head>
	<title>{data.project.title} — Cutline</title>
	<meta name="description" content="Edit {data.project.title} in Cutline" />
</svelte:head>

{#if data.mode === 'import'}
	<ProjectImportShell
		projectId={data.project.id}
		projectTitle={data.project.title}
		onbatchcomplete={handleImportBatchComplete}
	/>
{:else}
	<EditorWorkspace {...editorLoadData(data)} />
{/if}
