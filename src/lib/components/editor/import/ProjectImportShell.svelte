<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EditorIconRail from '$lib/components/editor/EditorIconRail.svelte';
	import EditorModals from '$lib/components/editor/EditorModals.svelte';
	import ImportGateway from '$lib/components/editor/import/ImportGateway.svelte';
	import NewProjectTopBar from '$lib/components/editor/import/NewProjectTopBar.svelte';
	import { EditorState } from '$lib/editor/editor-state.svelte';

	interface Props {
		projectId?: string | null;
		projectTitle?: string;
		onprojectcreated?: (projectId: string) => void;
		onbatchcomplete?: () => void;
	}

	let {
		projectId = null,
		projectTitle = 'Untitled project',
		onprojectcreated,
		onbatchcomplete
	}: Props = $props();

	let title = $state('Untitled project');

	$effect(() => {
		title = projectTitle;
	});

	const editor = $derived.by(
		() =>
			new EditorState({
				words: [],
				sentences: [],
				resources: [],
				captionStyle: 'karaoke',
				overlays: []
			})
	);

	const activeProjectId = $derived(projectId);
</script>

<div class="project-import-shell" data-testid="project-import-shell">
	<NewProjectTopBar
		{title}
		onback={() => goto(resolve('/'))}
		ontitlechange={(value) => (title = value)}
	/>

	<div class="project-import-shell__workspace">
		<EditorIconRail class="project-import-shell__rail" />

		<div class="project-import-shell__gateway">
			<ImportGateway
				projectId={activeProjectId}
				projectTitle={title}
				onrecord={() => editor.openRecord()}
				{onprojectcreated}
				{onbatchcomplete}
			/>
		</div>
	</div>

	<div class="project-import-shell__timeline" data-testid="project-import-timeline-placeholder">
		Timeline appears once your footage is transcribed
	</div>

	{#if activeProjectId}
		<EditorModals {editor} projectId={activeProjectId} projectTitle={title} />
	{/if}
</div>

<style>
	.project-import-shell {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: 100vh;
		background: var(--surface-1);
	}

	.project-import-shell__workspace {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.project-import-shell :global(.project-import-shell__rail) {
		opacity: 0.45;
		pointer-events: none;
	}

	.project-import-shell__gateway {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		min-width: 0;
		background: radial-gradient(120% 90% at 50% 0%, var(--surface-2) 0%, var(--surface-1) 60%);
		overflow-y: auto;
	}

	.project-import-shell__timeline {
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
