<script lang="ts">
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import TimecodeDisplay from '$lib/components/ui/TimecodeDisplay.svelte';

	interface Props {
		playing: boolean;
		current: number;
		total: number;
		ontoStart?: () => void;
		ontogglePlay?: () => void;
		ontoEnd?: () => void;
		class?: string;
	}

	let {
		playing,
		current,
		total,
		ontoStart,
		ontogglePlay,
		ontoEnd,
		class: className = ''
	}: Props = $props();

	const playLabel = $derived(playing ? 'Pause' : 'Play');
</script>

<div class={['transport-controls', className]} role="group" aria-label="Transport controls">
	<IconButton label="Skip to start" variant="ghost" size="md" onclick={ontoStart}>
		<svg
			class="transport-controls__icon"
			width="15"
			height="15"
			viewBox="0 0 16 16"
			aria-hidden="true"
		>
			<rect x="3" y="3" width="2" height="10" fill="currentColor" />
			<polygon points="13,3 13,13 6,8" fill="currentColor" />
		</svg>
	</IconButton>

	<IconButton
		label={playLabel}
		variant="primary"
		size="lg"
		class="transport-controls__play"
		onclick={ontogglePlay}
	>
		{#if playing}
			<svg
				class="transport-controls__icon"
				width="16"
				height="16"
				viewBox="0 0 16 16"
				aria-hidden="true"
			>
				<rect x="3.5" y="2.5" width="3.2" height="11" rx="1" fill="currentColor" />
				<rect x="9.3" y="2.5" width="3.2" height="11" rx="1" fill="currentColor" />
			</svg>
		{:else}
			<svg
				class="transport-controls__icon"
				width="16"
				height="16"
				viewBox="0 0 16 16"
				aria-hidden="true"
			>
				<polygon points="4,2.5 13,8 4,13.5" fill="currentColor" />
			</svg>
		{/if}
	</IconButton>

	<IconButton label="Skip to end" variant="ghost" size="md" onclick={ontoEnd}>
		<svg
			class="transport-controls__icon"
			width="15"
			height="15"
			viewBox="0 0 16 16"
			aria-hidden="true"
		>
			<polygon points="3,3 3,13 10,8" fill="currentColor" />
			<rect x="11" y="3" width="2" height="10" fill="currentColor" />
		</svg>
	</IconButton>

	<div class="transport-controls__divider" aria-hidden="true"></div>
	<TimecodeDisplay {current} {total} />
</div>

<style>
	.transport-controls {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0 auto;
		padding: 5px 10px;
		background: var(--surface-6);
		border: 1px solid var(--border-5);
		border-radius: var(--radius-lg);
	}

	.transport-controls__divider {
		width: 1px;
		height: 20px;
		margin: 0 4px;
		background: var(--border-6);
	}

	.transport-controls__icon {
		display: block;
	}

	:global(.transport-controls__play.icon-button--primary) {
		border-radius: 9px;
	}
</style>
