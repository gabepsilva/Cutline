<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import DashboardLayout from '$lib/components/layout/DashboardLayout.svelte';
	import DashboardHeader from '$lib/components/dashboard/DashboardHeader.svelte';
	import ContinueEditingHero from '$lib/components/dashboard/ContinueEditingHero.svelte';
	import ProjectGrid from '$lib/components/dashboard/ProjectGrid.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { Project } from '$lib/types/project';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const greeting = $derived(`Welcome back, ${data.user.name.split(' ')[0]}`);

	function openProject(project: Project) {
		goto(resolve(`/projects/${project.id}`));
	}
</script>

<svelte:head>
	<title>Home — Cutline</title>
	<meta name="description" content="Your Cutline projects and recent edits" />
</svelte:head>

<DashboardLayout user={data.user} usage={data.usage}>
	<DashboardHeader title="Home" {greeting}>
		{#snippet actions()}
			<form method="POST" action="?/create" use:enhance>
				<Button type="submit" variant="primary" size="lg" class="home-page__cta">
					<span class="home-page__cta-icon" aria-hidden="true"></span>
					New project
				</Button>
			</form>
		{/snippet}
	</DashboardHeader>

	{#if data.latestProject}
		<ContinueEditingHero project={data.latestProject} onclick={openProject} />
	{/if}

	{#if data.projects.length}
		<ProjectGrid projects={data.projects} onprojectclick={openProject} />
	{:else}
		<EmptyState title="No projects yet" />
	{/if}
</DashboardLayout>

<style>
	:global(.home-page__cta) {
		font-size: 13.5px;
		padding: 11px 18px;
		border-radius: 9px;
		gap: 9px;
	}

	.home-page__cta-icon {
		position: relative;
		width: 13px;
		height: 13px;
		flex-shrink: 0;
	}

	.home-page__cta-icon::before,
	.home-page__cta-icon::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		background: var(--on-accent);
		border-radius: 2px;
	}

	.home-page__cta-icon::before {
		width: 13px;
		height: 2px;
	}

	.home-page__cta-icon::after {
		width: 2px;
		height: 13px;
	}
</style>
