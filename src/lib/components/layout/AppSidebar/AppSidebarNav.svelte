<script lang="ts">
	import AppSidebarNavItem from './AppSidebarNavItem.svelte';
	import type { AppSidebarNavItemData } from './AppSidebarNav.types';

	interface Props {
		items: AppSidebarNavItemData[];
		ariaLabel?: string;
		class?: string;
		onitemclick?: (item: AppSidebarNavItemData, event: MouseEvent) => void;
	}

	let {
		items,
		ariaLabel = 'Main navigation',
		class: className = '',
		onitemclick
	}: Props = $props();
</script>

<nav class={['app-sidebar-nav', className]} aria-label={ariaLabel}>
	{#each items as item (item.id)}
		<AppSidebarNavItem
			label={item.label}
			icon={item.icon}
			active={item.active}
			href={item.href}
			disabled={item.disabled}
			onclick={(event) => onitemclick?.(item, event)}
		/>
	{/each}
</nav>

<style>
	.app-sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
</style>
