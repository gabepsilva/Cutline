<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		class?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let { title, description, class: className = '', children, footer }: Props = $props();

	const titleId = $props.id();
</script>

<section class={['auth-card', className]} aria-labelledby={titleId}>
	<header class="auth-card__header">
		<h1 class="auth-card__title" id={titleId}>{title}</h1>
		{#if description}
			<p class="auth-card__description">{description}</p>
		{/if}
	</header>

	<div class="auth-card__body">
		{@render children()}
	</div>

	{#if footer}
		<footer class="auth-card__footer">
			{@render footer()}
		</footer>
	{/if}
</section>

<style>
	.auth-card {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.auth-card__header {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.auth-card__title {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text-1);
		line-height: 1.2;
	}

	.auth-card__description {
		margin: 0;
		font-size: 13px;
		color: var(--text-6);
		line-height: 1.45;
	}

	.auth-card__body {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.auth-card__footer {
		padding-top: 4px;
		font-size: 13px;
		color: var(--text-6);
		line-height: 1.45;
		text-align: center;
	}

	.auth-card__footer :global(a) {
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
	}

	.auth-card__footer :global(a:hover) {
		text-decoration: underline;
	}
</style>
