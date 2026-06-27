<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EditorIconRail from '$lib/components/editor/EditorIconRail.svelte';
	import ImportGateway from '$lib/components/editor/import/ImportGateway.svelte';
	import NewProjectTopBar from '$lib/components/editor/import/NewProjectTopBar.svelte';

	let projectTitle = $state('Untitled project');
</script>

<svelte:head>
	<title>New project — Cutline</title>
	<meta name="description" content="Import footage to start a new Cutline project" />
</svelte:head>

<div class="new-project-page" data-testid="new-project-page">
	<NewProjectTopBar
		title={projectTitle}
		onback={() => goto(resolve('/'))}
		ontitlechange={(value) => (projectTitle = value)}
	/>

	<div class="new-project-page__workspace">
		<EditorIconRail class="new-project-page__rail" />

		<div class="new-project-page__gateway">
			<ImportGateway />
		</div>
	</div>

	<div class="new-project-page__timeline" data-testid="new-project-timeline-placeholder">
		Timeline appears once your footage is transcribed
	</div>
</div>

<style>
	.new-project-page {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: 100vh;
		background: var(--surface-1);
	}

	.new-project-page__workspace {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.new-project-page :global(.new-project-page__rail) {
		opacity: 0.45;
		pointer-events: none;
	}

	.new-project-page__gateway {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		min-width: 0;
		background: radial-gradient(120% 90% at 50% 0%, var(--surface-2) 0%, var(--surface-1) 60%);
		overflow-y: auto;
	}

	.new-project-page__timeline {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 130px;
		flex: 0 0 130px;
		border-top: 1px solid var(--border-3);
		background: var(--surface-1);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-placeholder);
	}
</style>
