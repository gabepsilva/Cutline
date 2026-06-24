<script lang="ts">
	import AppSidebar from './AppSidebar.svelte';
	import type { AppSidebarNavItemData } from './AppSidebarNav.types';
	import { fixtureStorageUsage } from '$lib/test/fixtures/storage';
	import { fixtureUser } from '$lib/test/fixtures/user';

	interface Props {
		onnavclick?: (item: AppSidebarNavItemData, event: MouseEvent) => void;
	}

	let { onnavclick }: Props = $props();
</script>

<AppSidebar user={fixtureUser} usage={fixtureStorageUsage} {onnavclick} />
