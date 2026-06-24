<script lang="ts">
	import type { TimelineBar } from './Timeline.types';

	interface Props {
		bars: TimelineBar[];
		playedPercent?: number;
		class?: string;
	}

	let { bars, playedPercent = 0, class: className = '' }: Props = $props();

	const playedWidth = $derived(`${playedPercent}%`);
</script>

<div class={['timeline-waveform', className]}>
	<div class="timeline-waveform__bars">
		{#each bars as bar (bar.id)}
			<div
				class="timeline-waveform__bar timeline-waveform__bar--unplayed"
				style:left={bar.left}
				style:width={bar.width}
				style:height={bar.height}
			></div>
		{/each}

		<div class="timeline-waveform__played" style:width={playedWidth}>
			{#each bars as bar (bar.id)}
				<div
					class="timeline-waveform__bar timeline-waveform__bar--played"
					style:left={bar.left}
					style:width={bar.width}
					style:height={bar.height}
				></div>
			{/each}
		</div>
	</div>
</div>

<style>
	.timeline-waveform {
		position: absolute;
		inset: 6px 0;
	}

	.timeline-waveform__bars {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.timeline-waveform__bar {
		position: absolute;
		bottom: 50%;
		transform: translateY(50%);
		border-radius: 1px;
	}

	.timeline-waveform__bar--unplayed {
		background: var(--text-9);
	}

	.timeline-waveform__bar--played {
		background: var(--accent);
	}

	.timeline-waveform__played {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		overflow: hidden;
	}
</style>
