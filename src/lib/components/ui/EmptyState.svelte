<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { EmptyStateAlign } from './EmptyState.types';

	interface Props {
		title: string;
		description?: string;
		align?: EmptyStateAlign;
		class?: string;
		action?: Snippet;
	}

	let { title, description, align = 'start', class: className = '', action }: Props = $props();
</script>

<div
	class={['empty-state', `empty-state--${align}`, className]}
	role="status"
	aria-label={description ? `${title}. ${description}` : title}
>
	<p class="empty-state__title">{title}</p>
	{#if description}
		<p class="empty-state__description">{description}</p>
	{/if}
	{#if action}
		<div class="empty-state__action">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.empty-state--start {
		align-items: flex-start;
		text-align: left;
	}

	.empty-state--center {
		align-items: center;
		text-align: center;
	}

	.empty-state__title {
		margin: 0;
		font-size: 11px;
		color: var(--text-placeholder);
		line-height: 1.4;
	}

	.empty-state__description {
		margin: 0;
		font-size: 11px;
		color: var(--text-placeholder);
		line-height: 1.4;
	}

	.empty-state__action {
		margin-top: 8px;
	}
</style>
