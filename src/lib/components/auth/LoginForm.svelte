<script lang="ts">
	import AuthCard from '$lib/components/auth/AuthCard.svelte';
	import AuthFormField from '$lib/components/auth/AuthFormField.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		message?: string;
		signupHref: string;
		class?: string;
	}

	let { message, signupHref, class: className = '' }: Props = $props();
</script>

<div class={['login-form', className]}>
	<AuthCard title="Welcome back" description="Sign in to continue editing your projects.">
		<form class="login-form__form" method="post" action="?/signInEmail">
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

			{#if message}
				<p class="login-form__error" role="alert">{message}</p>
			{/if}

			<Button type="submit" variant="primary" size="lg" class="login-form__submit">Sign in</Button>
		</form>

		{#snippet footer()}
			Don't have an account?
			<!-- signupHref is resolved by the route shell (+page.svelte). -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={signupHref}>Create one</a>
		{/snippet}
	</AuthCard>

	<form class="login-form__social" method="post" action="?/signInSocial">
		<input type="hidden" name="provider" value="github" />
		<input type="hidden" name="callbackURL" value="/" />
		<Button type="submit" variant="secondary" size="lg" class="login-form__social-button">
			Continue with GitHub
		</Button>
	</form>
</div>

<style>
	.login-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.login-form__form,
	.login-form__social {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.login-form__error {
		margin: 0;
		font-size: 12px;
		color: var(--danger-text);
		line-height: 1.4;
	}

	:global(.login-form__submit),
	:global(.login-form__social-button) {
		width: 100%;
	}
</style>
