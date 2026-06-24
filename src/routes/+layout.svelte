<script lang="ts">
	import '$lib/styles/global.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Cutline</title>
	<meta name="description" content="AI-powered video editing" />
</svelte:head>

<div class="app-root" data-testid="app-root">
	{@render children()}
</div>

<style>
	.app-root {
		width: 100%;
		min-height: 100vh;
		overflow: hidden;
		background: radial-gradient(120% 80% at 50% -10%, var(--surface-4) 0%, var(--surface-base) 55%);
		color: var(--text-1);
		position: relative;
	}
</style>
