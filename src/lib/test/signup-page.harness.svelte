<script lang="ts">
	import SignupPage from '../../routes/(auth)/signup/+page.svelte';

	interface Props {
		message?: string;
	}

	let { message }: Props = $props();
</script>

<SignupPage form={message ? { message } : undefined} />
