<script lang="ts">
	import TranscriptSpeaker from './TranscriptSpeaker.svelte';
	import type { TranscriptSpeakerData } from './TranscriptSpeaker.types';
	import { fixtureUser } from '$lib/test/fixtures/user';

	interface Props {
		speaker?: TranscriptSpeakerData;
		class?: string;
	}

	let {
		speaker = {
			name: fixtureUser.name,
			initials: fixtureUser.initials
		},
		class: className = ''
	}: Props = $props();
</script>

<TranscriptSpeaker {speaker} class={className} />
