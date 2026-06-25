<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppSidebarLogo from '$lib/components/layout/AppSidebar/AppSidebarLogo.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="auth-layout" data-testid="auth-layout">
	<div class="auth-layout__panel" role="main">
		<header class="auth-layout__header">
			<AppSidebarLogo />
		</header>
		<div class="auth-layout__content">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.auth-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 32px 20px;
	}

	.auth-layout__panel {
		width: min(100%, 420px);
		padding: 32px 28px 28px;
		border: 1px solid var(--border-5);
		border-radius: var(--radius-2xl);
		background: var(--surface-5);
		box-shadow: 0 24px 64px color-mix(in srgb, var(--surface-base) 55%, transparent);
	}

	.auth-layout__header {
		margin-bottom: 24px;
	}

	.auth-layout__header :global(.app-sidebar-logo) {
		padding: 0;
	}

	.auth-layout__content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
</style>
