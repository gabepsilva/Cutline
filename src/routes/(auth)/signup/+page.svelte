<script lang="ts">
	import { resolve } from '$app/paths';
	import SignupForm from '$lib/components/auth/SignupForm.svelte';
	import type { ActionData } from './$types';

	let { form = undefined }: { form?: ActionData } = $props();
</script>

<svelte:head>
	<title>Create account — Cutline</title>
	<meta name="description" content="Create your Cutline account" />
</svelte:head>

<SignupForm message={form?.message} loginHref={resolve('/login')} />
