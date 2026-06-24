<script lang="ts">
	import DashboardLayout from './DashboardLayout.svelte';
	import { fixtureStorageUsage } from '$lib/test/fixtures/storage';
	import { fixtureUser } from '$lib/test/fixtures/user';

	interface Props {
		slotContent?: string;
	}

	let { slotContent = 'Dashboard main content' }: Props = $props();
</script>

<DashboardLayout user={fixtureUser} usage={fixtureStorageUsage}>
	<p>{slotContent}</p>
</DashboardLayout>
