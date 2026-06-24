<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'waveform';
		padded?: boolean;
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', padded = true, class: className = '', children }: Props = $props();
</script>

<div
	class={[
		'timeline-track',
		`timeline-track--${variant}`,
		padded && 'timeline-track--padded',
		className
	]}
>
	{@render children()}
</div>

<style>
	.timeline-track {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		border-bottom: 1px solid var(--border-faint);
	}

	.timeline-track--padded {
		padding: 5px;
	}

	.timeline-track--waveform {
		padding: 0;
		background: var(--surface-2);
	}
</style>
