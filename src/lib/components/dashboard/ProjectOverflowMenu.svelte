<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Modal from '$lib/components/ui/Modal/Modal.svelte';
	import type { Project } from '$lib/types/project';

	interface Props {
		project: Project;
		variant?: 'card' | 'hero';
	}

	let { project, variant = 'card' }: Props = $props();

	let menuOpen = $state(false);
	let renameOpen = $state(false);
	let deleteOpen = $state(false);
	let renameTitle = $state('');

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		menuOpen = !menuOpen;
	}

	function openRename(event: MouseEvent) {
		event.stopPropagation();
		menuOpen = false;
		renameTitle = project.title;
		renameOpen = true;
	}

	function openDelete(event: MouseEvent) {
		event.stopPropagation();
		menuOpen = false;
		deleteOpen = true;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		if (!target?.closest('.project-overflow-menu')) {
			menuOpen = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class={['project-overflow-menu', `project-overflow-menu--${variant}`]}>
	<IconButton
		label="Project options"
		variant="bordered"
		size="sm"
		class="project-overflow-menu__trigger"
		onclick={toggleMenu}
	>
		<span class="project-overflow-menu__dots" aria-hidden="true">⋮</span>
	</IconButton>

	{#if menuOpen}
		<div class="project-overflow-menu__menu" role="menu">
			<button
				type="button"
				class="project-overflow-menu__item"
				role="menuitem"
				onclick={openRename}
			>
				Rename
			</button>
			<button
				type="button"
				class={['project-overflow-menu__item', 'project-overflow-menu__item--danger']}
				role="menuitem"
				onclick={openDelete}
			>
				Delete
			</button>
		</div>
	{/if}
</div>

<Modal
	open={renameOpen}
	title="Rename project"
	layer="dashboard"
	onclose={() => {
		renameOpen = false;
	}}
>
	<form
		method="POST"
		action="?/rename"
		class="project-overflow-menu__form"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					renameOpen = false;
					closeMenu();
					await update();
				}
			};
		}}
	>
		<input type="hidden" name="projectId" value={project.id} />
		<label class="project-overflow-menu__label" for="rename-title-{project.id}">Project title</label
		>
		<input
			id="rename-title-{project.id}"
			class="project-overflow-menu__input"
			type="text"
			name="title"
			maxlength="120"
			required
			bind:value={renameTitle}
		/>
		<div class="project-overflow-menu__actions">
			<Button
				type="button"
				variant="secondary"
				onclick={() => {
					renameOpen = false;
				}}
			>
				Cancel
			</Button>
			<Button type="submit" variant="primary">Save</Button>
		</div>
	</form>
</Modal>

<Modal
	open={deleteOpen}
	title="Delete project?"
	layer="dashboard"
	onclose={() => {
		deleteOpen = false;
	}}
>
	<p class="project-overflow-menu__warning">
		This permanently deletes <strong>{project.title}</strong> and its transcript, media, and overlays.
		This cannot be undone.
	</p>
	<form
		method="POST"
		action="?/delete"
		class="project-overflow-menu__form"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					deleteOpen = false;
					closeMenu();
					await update();
				}
			};
		}}
	>
		<input type="hidden" name="projectId" value={project.id} />
		<div class="project-overflow-menu__actions">
			<Button
				type="button"
				variant="secondary"
				onclick={() => {
					deleteOpen = false;
				}}
			>
				Cancel
			</Button>
			<Button type="submit" variant="primary" class="project-overflow-menu__delete-btn">
				Delete project
			</Button>
		</div>
	</form>
</Modal>

<style>
	.project-overflow-menu {
		position: absolute;
		z-index: 2;
	}

	.project-overflow-menu--card {
		top: 8px;
		right: 8px;
	}

	.project-overflow-menu--hero {
		top: 14px;
		right: 14px;
	}

	.project-overflow-menu__trigger {
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(4px);
	}

	.project-overflow-menu__dots {
		font-size: 14px;
		line-height: 1;
		color: var(--text-3);
	}

	.project-overflow-menu__menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 140px;
		padding: 6px;
		border: 1px solid var(--border-6);
		border-radius: var(--radius-md);
		background: var(--surface-5);
		box-shadow: var(--shadow-modal);
	}

	.project-overflow-menu__item {
		display: block;
		width: 100%;
		padding: 8px 10px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-2);
		font-family: inherit;
		font-size: 13px;
		text-align: left;
		cursor: pointer;
	}

	.project-overflow-menu__item:hover {
		background: var(--surface-4);
	}

	.project-overflow-menu__item--danger {
		color: #ff8f7a;
	}

	.project-overflow-menu__form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.project-overflow-menu__label {
		font-size: 12px;
		color: var(--text-5);
	}

	.project-overflow-menu__input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--border-6);
		border-radius: var(--radius-md);
		background: var(--surface-3);
		color: var(--text-1);
		font-family: inherit;
		font-size: 14px;
	}

	.project-overflow-menu__warning {
		margin: 0 0 16px;
		font-size: 14px;
		line-height: 1.5;
		color: var(--text-4);
	}

	.project-overflow-menu__actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	:global(.project-overflow-menu__delete-btn) {
		background: #c94f3d;
		color: #fff;
	}
</style>
