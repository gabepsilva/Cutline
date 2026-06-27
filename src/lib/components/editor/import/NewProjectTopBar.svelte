<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		title: string;
		onback?: () => void;
		ontitlechange?: (title: string) => void;
	}

	let { title, onback, ontitlechange }: Props = $props();
</script>

<header class="new-project-top-bar">
	<button type="button" class="new-project-top-bar__back" onclick={onback}>
		<span class="new-project-top-bar__back-chevron" aria-hidden="true"></span>
		Projects
	</button>

	<div class="new-project-top-bar__divider" aria-hidden="true"></div>

	<input
		class="new-project-top-bar__title"
		type="text"
		value={title}
		placeholder="Untitled project"
		aria-label="Project title"
		oninput={(event) => ontitlechange?.(event.currentTarget.value)}
	/>

	<Button variant="secondary" size="md" disabled class="new-project-top-bar__export">Export</Button>
</header>

<style>
	.new-project-top-bar {
		display: flex;
		align-items: center;
		gap: 14px;
		height: var(--topbar-h);
		flex: 0 0 var(--topbar-h);
		padding: 0 16px;
		background: var(--surface-3);
		border-bottom: 1px solid var(--border-3);
	}

	.new-project-top-bar__back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 9px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-5);
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}

	.new-project-top-bar__back-chevron {
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-right: 7px solid currentColor;
	}

	.new-project-top-bar__divider {
		width: 1px;
		height: 22px;
		background: var(--border-6);
		flex-shrink: 0;
	}

	.new-project-top-bar__title {
		width: min(220px, 100%);
		padding: 6px 8px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-1);
		font: inherit;
		font-size: 13.5px;
		font-weight: 600;
		outline: none;
	}

	.new-project-top-bar__title:focus {
		background: var(--surface-2);
		box-shadow: inset 0 0 0 1px var(--border-7);
	}

	:global(.new-project-top-bar__export.button) {
		margin-left: auto;
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
