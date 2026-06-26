<script lang="ts">
	import SignupForm from './SignupForm.svelte';

	interface Props {
		message?: string;
		loginHref?: string;
	}

	let { message, loginHref = '/login' }: Props = $props();
</script>

<SignupForm {message} {loginHref} />
