<script lang="ts">
	interface Props {
		label?: string;
		class?: string;
	}

	let { label = 'Processing…', class: className = '' }: Props = $props();
</script>

<div class={['timeline-processing', className]} role="status">
	<span class="timeline-processing__label">{label}</span>
</div>

<style>
	.timeline-processing {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--surface-2) 82%, transparent);
		pointer-events: none;
	}

	.timeline-processing__label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-6);
		letter-spacing: 0.02em;
	}
</style>
