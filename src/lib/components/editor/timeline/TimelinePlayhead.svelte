<script lang="ts">
	interface Props {
		positionPercent: number;
		class?: string;
	}

	let { positionPercent, class: className = '' }: Props = $props();

	const left = $derived(`${positionPercent}%`);
</script>

<div
	class={['timeline-playhead', className]}
	style:left
	data-testid="timeline-playhead"
	aria-hidden="true"
>
	<div class="timeline-playhead__caret"></div>
</div>

<style>
	.timeline-playhead {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: var(--accent);
		pointer-events: none;
		z-index: var(--z-playhead);
	}

	.timeline-playhead__caret {
		position: absolute;
		top: -1px;
		left: 50%;
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 8px solid var(--accent);
		transform: translateX(-50%);
	}
</style>
