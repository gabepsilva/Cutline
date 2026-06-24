<script lang="ts">
	import AppSidebarStorage from './AppSidebarStorage.svelte';
	import type { StorageUsage } from '$lib/types/storage';

	interface Props {
		usage?: StorageUsage;
	}

	let { usage = { percentUsed: 62, usageLabel: '38.4 GB of 60 GB used' } }: Props = $props();
</script>

<AppSidebarStorage {usage} />
