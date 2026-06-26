<script lang="ts">
	interface Props {
		class?: string;
		withBackground?: boolean;
		caption?: string;
		glowPos?: string;
		subjectX?: string;
		subjectY?: string;
	}

	let {
		class: className = '',
		withBackground = false,
		caption,
		glowPos = '38% 42%',
		subjectX = '32%',
		subjectY = '46%'
	}: Props = $props();
</script>

<div
	class={['simulated-frame', withBackground && 'simulated-frame--bg', className]}
	aria-hidden="true"
	style:--glow-pos={glowPos}
	style:--subject-x={subjectX}
	style:--subject-y={subjectY}
>
	<div class="simulated-frame__glow"></div>
	<div class="simulated-frame__subject"></div>
	{#if caption}
		<p class="simulated-frame__caption">{caption}</p>
	{/if}
</div>

<style>
	.simulated-frame {
		position: absolute;
		inset: 0;
	}

	.simulated-frame--bg {
		background: repeating-linear-gradient(
			135deg,
			var(--surface-5) 0 14px,
			var(--surface-2) 14px 28px
		);
	}

	.simulated-frame__glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(58% 75% at var(--glow-pos), var(--accent-tint-14), transparent 68%);
	}

	.simulated-frame__subject {
		position: absolute;
		left: var(--subject-x);
		top: var(--subject-y);
		transform: translate(-50%, -50%);
		width: 120px;
		height: 120px;
		border-radius: var(--radius-pill);
		background: radial-gradient(circle at 40% 35%, var(--border-7), var(--surface-5));
		border: 1px solid var(--border-7);
	}

	.simulated-frame__caption {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 14px;
		margin: 0;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--text-8);
	}
</style>
