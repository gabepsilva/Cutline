<script lang="ts">
	import { resolve } from '$app/paths';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import type { ActionData } from './$types';

	let { form = undefined }: { form?: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign in — Cutline</title>
	<meta name="description" content="Sign in to your Cutline account" />
</svelte:head>

<LoginForm message={form?.message} signupHref={resolve('/signup')} />
