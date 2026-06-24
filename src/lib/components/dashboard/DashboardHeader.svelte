<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		greeting?: string;
		class?: string;
		actions?: Snippet;
	}

	let { title, greeting, class: className = '', actions }: Props = $props();
</script>

<header class={['dashboard-header', className]}>
	<div class="dashboard-header__titles">
		{#if greeting}
			<p class="dashboard-header__greeting">{greeting}</p>
		{/if}
		<h1 class="dashboard-header__title">{title}</h1>
	</div>
	{#if actions}
		<div class="dashboard-header__actions">
			{@render actions()}
		</div>
	{/if}
</header>

<style>
	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 26px;
		gap: 16px;
	}

	.dashboard-header__titles {
		min-width: 0;
	}

	.dashboard-header__greeting {
		margin: 0 0 4px;
		font-size: 13px;
		color: var(--text-7);
		line-height: 1.2;
	}

	.dashboard-header__title {
		margin: 0;
		font-size: 26px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text-1);
		line-height: 1.15;
	}

	.dashboard-header__actions {
		flex-shrink: 0;
	}
</style>
