<script lang="ts">
	import LoginPage from '../../routes/(auth)/login/+page.svelte';

	interface Props {
		message?: string;
	}

	let { message }: Props = $props();
</script>

<LoginPage form={message ? { message } : undefined} />
