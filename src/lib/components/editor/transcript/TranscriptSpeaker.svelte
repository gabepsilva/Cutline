<script lang="ts">
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import type { TranscriptSpeakerData } from './TranscriptSpeaker.types';

	interface Props {
		speaker: TranscriptSpeakerData;
		class?: string;
	}

	let { speaker, class: className = '' }: Props = $props();

	const subtitle = $derived(speaker.subtitle ?? 'Creator · single speaker');
</script>

<div class={['transcript-speaker', className]}>
	<Avatar name={speaker.name} initials={speaker.initials} size="md" />
	<div class="transcript-speaker__meta">
		<p class="transcript-speaker__name">{speaker.name}</p>
		<p class="transcript-speaker__subtitle">{subtitle}</p>
	</div>
</div>

<style>
	.transcript-speaker {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 18px;
	}

	.transcript-speaker__meta {
		line-height: 1.25;
	}

	.transcript-speaker__name {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-2);
	}

	.transcript-speaker__subtitle {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--text-7);
	}
</style>
