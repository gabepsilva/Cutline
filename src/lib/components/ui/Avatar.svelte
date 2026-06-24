<script lang="ts">
	import type { AvatarSize } from './Avatar.types';

	interface Props {
		name: string;
		initials: string;
		size?: AvatarSize;
		class?: string;
	}

	let { name, initials, size = 'md', class: className = '' }: Props = $props();
</script>

<div role="img" aria-label={name} class={['avatar', `avatar--${size}`, className]}>
	<span class="avatar__initials" aria-hidden="true">{initials}</span>
</div>

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--radius-pill);
		background: linear-gradient(135deg, var(--border-7), var(--surface-5));
		color: var(--text-2);
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		line-height: 1;
	}

	.avatar--sm {
		width: 30px;
		height: 30px;
	}

	.avatar--md {
		width: 32px;
		height: 32px;
	}

	.avatar__initials {
		user-select: none;
	}
</style>
