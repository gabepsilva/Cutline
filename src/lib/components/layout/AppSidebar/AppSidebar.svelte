<script lang="ts">
	import AppSidebarLogo from './AppSidebarLogo.svelte';
	import AppSidebarNav from './AppSidebarNav.svelte';
	import { defaultSidebarNavItems } from './AppSidebarNav.fixtures';
	import type { AppSidebarNavItemData } from './AppSidebarNav.types';
	import AppSidebarStorage from './AppSidebarStorage.svelte';
	import AppSidebarUser from './AppSidebarUser.svelte';
	import type { StorageUsage } from '$lib/types/storage';
	import type { User } from '$lib/types/user';

	interface Props {
		user: User;
		usage: StorageUsage;
		navItems?: AppSidebarNavItemData[];
		class?: string;
		onnavclick?: (item: AppSidebarNavItemData, event: MouseEvent) => void;
	}

	let {
		user,
		usage,
		navItems = defaultSidebarNavItems,
		class: className = '',
		onnavclick
	}: Props = $props();
</script>

<aside class={['app-sidebar', className]} aria-label="Application sidebar">
	<AppSidebarLogo />
	<AppSidebarNav items={navItems} onitemclick={onnavclick} />
	<div class="app-sidebar__bottom">
		<AppSidebarStorage {usage} />
		<AppSidebarUser {user} />
	</div>
</aside>

<style>
	.app-sidebar {
		display: flex;
		flex-direction: column;
		width: var(--sidebar-w);
		flex: 0 0 var(--sidebar-w);
		min-height: 100vh;
		padding: 22px 16px;
		background: var(--surface-3);
		border-right: 1px solid var(--border-3);
	}

	.app-sidebar__bottom {
		margin-top: auto;
		display: flex;
		flex-direction: column;
	}
</style>
