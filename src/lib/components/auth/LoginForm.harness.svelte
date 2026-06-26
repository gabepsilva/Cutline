<script lang="ts">
	import LoginForm from './LoginForm.svelte';

	interface Props {
		message?: string;
		signupHref?: string;
	}

	let { message, signupHref = '/signup' }: Props = $props();
</script>

<LoginForm {message} {signupHref} />
