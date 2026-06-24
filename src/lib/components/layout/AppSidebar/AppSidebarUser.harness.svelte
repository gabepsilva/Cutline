<script lang="ts">
	import AppSidebarUser from './AppSidebarUser.svelte';
	import { fixtureUser } from '$lib/test/fixtures/user';
	import type { User } from '$lib/types/user';

	interface Props {
		user?: User;
	}

	let { user = fixtureUser }: Props = $props();
</script>

<AppSidebarUser {user} />
