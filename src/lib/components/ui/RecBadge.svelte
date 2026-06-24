<script lang="ts">
	interface Props {
		label?: string;
		class?: string;
	}

	let { label = 'REC', class: className = '' }: Props = $props();
</script>

<span class={['rec-badge', className]}>
	<span class="rec-badge__dot" aria-hidden="true"></span>
	{label}
</span>

<style>
	.rec-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-3);
		background: rgb(0 0 0 / 40%);
		padding: 3px 8px;
		border-radius: 5px;
		line-height: 1;
	}

	.rec-badge__dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-pill);
		background: var(--danger);
		animation: pulseRec 1.6s infinite;
	}
</style>
