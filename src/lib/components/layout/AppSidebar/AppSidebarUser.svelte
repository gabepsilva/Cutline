<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import type { User } from '$lib/types/user';

	interface Props {
		user: User;
		class?: string;
	}

	let { user, class: className = '' }: Props = $props();
</script>

<div class={['app-sidebar-user', className]}>
	<Avatar name={user.name} initials={user.initials} size="sm" />
	<div class="app-sidebar-user__meta">
		<div class="app-sidebar-user__name">{user.name}</div>
		<div class="app-sidebar-user__plan">{user.planLabel}</div>
	</div>
</div>

<style>
	.app-sidebar-user {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 6px 0;
	}

	.app-sidebar-user__meta {
		line-height: 1.25;
		min-width: 0;
	}

	.app-sidebar-user__name {
		font-size: 12.5px;
		font-weight: 500;
		color: var(--text-1);
	}

	.app-sidebar-user__plan {
		font-size: 10.5px;
		color: var(--text-7);
	}
</style>
