<script lang="ts">
	import EditorWorkspace from '$lib/components/editor/EditorWorkspace.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.project.title} — Cutline</title>
	<meta name="description" content="Edit {data.project.title} in Cutline" />
</svelte:head>

<EditorWorkspace {...data} />
