<script lang="ts">
	import AppSidebarLogo from './AppSidebarLogo.svelte';

	interface Props {
		label?: string;
	}

	let { label = 'Cutline' }: Props = $props();
</script>

<AppSidebarLogo {label} />
