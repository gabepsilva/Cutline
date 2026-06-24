<script lang="ts">
	import Avatar from './Avatar.svelte';
	import type { AvatarSize } from './Avatar.types';

	interface Props {
		name?: string;
		initials?: string;
		size?: AvatarSize;
		class?: string;
	}

	let { name = 'Alex Chen', initials = 'AC', size = 'md', class: className = '' }: Props = $props();
</script>

<Avatar {name} {initials} {size} class={className} />
