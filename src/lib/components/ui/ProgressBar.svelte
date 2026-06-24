<script lang="ts">
	interface Props {
		value: number;
		label?: string;
		class?: string;
	}

	let { value, label, class: className = '' }: Props = $props();

	const clampedValue = $derived(Math.min(100, Math.max(0, value)));
	const ariaLabel = $derived(label ?? `Progress: ${clampedValue}%`);
</script>

<div
	role="progressbar"
	aria-valuenow={clampedValue}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-label={ariaLabel}
	class={['progress-bar', className]}
>
	<div class="progress-bar__track">
		<div class="progress-bar__fill" style:width="{clampedValue}%"></div>
	</div>
</div>

<style>
	.progress-bar {
		width: 100%;
	}

	.progress-bar__track {
		height: 5px;
		border-radius: var(--radius-xs);
		background: var(--border-4);
		overflow: hidden;
	}

	.progress-bar__fill {
		height: 100%;
		border-radius: var(--radius-xs);
		background: var(--accent);
		transition: width 0.15s;
	}
</style>
