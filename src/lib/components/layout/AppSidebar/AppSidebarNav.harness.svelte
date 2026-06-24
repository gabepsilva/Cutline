<script lang="ts">
	import AppSidebarNav from './AppSidebarNav.svelte';
	import { defaultSidebarNavItems } from './AppSidebarNav.fixtures';
	import type { AppSidebarNavItemData } from './AppSidebarNav.types';

	interface Props {
		items?: AppSidebarNavItemData[];
		onitemclick?: (item: AppSidebarNavItemData, event: MouseEvent) => void;
	}

	let { items = defaultSidebarNavItems, onitemclick }: Props = $props();
</script>

<AppSidebarNav {items} {onitemclick} />
