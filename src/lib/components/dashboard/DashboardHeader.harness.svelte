<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import DashboardHeader from './DashboardHeader.svelte';

	interface Props {
		title?: string;
		greeting?: string;
		showCta?: boolean;
		onnewProject?: (event: MouseEvent) => void;
	}

	let {
		title = 'Home',
		greeting = 'Welcome back, Alex',
		showCta = true,
		onnewProject
	}: Props = $props();
</script>

<DashboardHeader {title} {greeting}>
	{#snippet actions()}
		{#if showCta}
			<Button variant="primary" size="lg" onclick={onnewProject} class="dashboard-header__cta">
				<span class="dashboard-header__cta-icon" aria-hidden="true"></span>
				New project
			</Button>
		{/if}
	{/snippet}
</DashboardHeader>

<style>
	:global(.dashboard-header__cta) {
		font-size: 13.5px;
		padding: 11px 18px;
		border-radius: 9px;
		gap: 9px;
	}

	.dashboard-header__cta-icon {
		position: relative;
		width: 13px;
		height: 13px;
		flex-shrink: 0;
	}

	.dashboard-header__cta-icon::before,
	.dashboard-header__cta-icon::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		background: var(--on-accent);
		border-radius: 2px;
	}

	.dashboard-header__cta-icon::before {
		width: 13px;
		height: 2px;
	}

	.dashboard-header__cta-icon::after {
		width: 2px;
		height: 13px;
	}
</style>
