<script lang="ts">
	import AuthCard from '$lib/components/auth/AuthCard.svelte';
	import AuthFormField from '$lib/components/auth/AuthFormField.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		message?: string;
		loginHref: string;
		class?: string;
	}

	let { message, loginHref, class: className = '' }: Props = $props();
</script>

<div class={['signup-form', className]}>
	<AuthCard title="Create your account" description="Start editing videos with AI-powered tools.">
		<form class="signup-form__form" method="post" action="?/signUpEmail">
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

			{#if message}
				<p class="signup-form__error" role="alert">{message}</p>
			{/if}

			<Button type="submit" variant="primary" size="lg" class="signup-form__submit">
				Create account
			</Button>
		</form>

		{#snippet footer()}
			Already have an account?
			<!-- loginHref is resolved by the route shell (+page.svelte). -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={loginHref}>Sign in</a>
		{/snippet}
	</AuthCard>
</div>

<style>
	.signup-form__form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.signup-form__error {
		margin: 0;
		font-size: 12px;
		color: var(--danger-text);
		line-height: 1.4;
	}

	:global(.signup-form__submit) {
		width: 100%;
	}
</style>
