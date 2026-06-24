<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppSidebar from './AppSidebar/AppSidebar.svelte';
	import type { AppSidebarNavItemData } from './AppSidebar/AppSidebarNav.types';
	import { defaultSidebarNavItems } from './AppSidebar/AppSidebarNav.fixtures';
	import type { StorageUsage } from '$lib/types/storage';
	import type { User } from '$lib/types/user';

	interface Props {
		user: User;
		usage: StorageUsage;
		navItems?: AppSidebarNavItemData[];
		class?: string;
		onnavclick?: (item: AppSidebarNavItemData, event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		user,
		usage,
		navItems = defaultSidebarNavItems,
		class: className = '',
		onnavclick,
		children
	}: Props = $props();
</script>

<div class={['dashboard-layout', className]}>
	<AppSidebar {user} {usage} {navItems} {onnavclick} />
	<main class="dashboard-layout__main">
		{@render children()}
	</main>
</div>

<style>
	.dashboard-layout {
		display: flex;
		width: 100%;
		min-height: 100vh;
	}

	.dashboard-layout__main {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		padding: 30px 40px 60px;
	}
</style>
