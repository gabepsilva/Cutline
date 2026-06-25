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
	<title>Sign in — Cutline</title>
	<meta name="description" content="Sign in to your Cutline account" />
</svelte:head>

<AuthCard title="Welcome back" description="Sign in to continue editing your projects.">
	<form class="login-page__form" method="post" action="?/signInEmail" use:enhance>
		<AuthFormField
			id="login-email"
			name="email"
			label="Email"
			type="email"
			autocomplete="email"
			required
		/>
		<AuthFormField
			id="login-password"
			name="password"
			label="Password"
			type="password"
			autocomplete="current-password"
			required
		/>

		{#if form?.message}
			<p class="login-page__error" role="alert">{form.message}</p>
		{/if}

		<Button type="submit" variant="primary" size="lg" class="login-page__submit">Sign in</Button>
	</form>

	{#snippet footer()}
		Don't have an account? <a href={resolve('/signup')}>Create one</a>
	{/snippet}
</AuthCard>

<form class="login-page__social" method="post" action="?/signInSocial" use:enhance>
	<input type="hidden" name="provider" value="github" />
	<input type="hidden" name="callbackURL" value="/" />
	<Button type="submit" variant="secondary" size="lg" class="login-page__social-button">
		Continue with GitHub
	</Button>
</form>

<style>
	.login-page__form,
	.login-page__social {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.login-page__error {
		margin: 0;
		font-size: 12px;
		color: var(--danger-text);
		line-height: 1.4;
	}

	:global(.login-page__submit),
	:global(.login-page__social-button) {
		width: 100%;
	}
</style>
