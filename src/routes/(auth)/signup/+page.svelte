<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import AuthCard from '$lib/components/auth/AuthCard.svelte';
	import AuthFormField from '$lib/components/auth/AuthFormField.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ActionData } from './$types';

	let { form = undefined }: { form?: ActionData } = $props();
</script>

<svelte:head>
	<title>Create account — Cutline</title>
	<meta name="description" content="Create your Cutline account" />
</svelte:head>

<AuthCard title="Create your account" description="Start editing videos with AI-powered tools.">
	<form class="signup-page__form" method="post" action="?/signUpEmail" use:enhance>
		<AuthFormField
			id="signup-name"
			name="name"
			label="Name"
			type="text"
			autocomplete="name"
			required
		/>
		<AuthFormField
			id="signup-email"
			name="email"
			label="Email"
			type="email"
			autocomplete="email"
			required
		/>
		<AuthFormField
			id="signup-password"
			name="password"
			label="Password"
			type="password"
			autocomplete="new-password"
			required
		/>

		{#if form?.message}
			<p class="signup-page__error" role="alert">{form.message}</p>
		{/if}

		<Button type="submit" variant="primary" size="lg" class="signup-page__submit">
			Create account
		</Button>
	</form>

	{#snippet footer()}
		Already have an account? <a href={resolve('/login')}>Sign in</a>
	{/snippet}
</AuthCard>

<style>
	.signup-page__form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.signup-page__error {
		margin: 0;
		font-size: 12px;
		color: var(--danger-text);
		line-height: 1.4;
	}

	:global(.signup-page__submit) {
		width: 100%;
	}
</style>
