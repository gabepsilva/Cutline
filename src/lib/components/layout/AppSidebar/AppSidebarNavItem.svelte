<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AppSidebarNavIcon } from './AppSidebarNav.types';

	interface Props {
		label: string;
		icon: AppSidebarNavIcon;
		active?: boolean;
		href?: string;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
	}

	let {
		label,
		icon,
		active = false,
		href,
		disabled = false,
		onclick,
		class: className = ''
	}: Props = $props();

	const isLink = $derived(Boolean(href) && !disabled);
	const resolvedHref = $derived(href ? resolve(href as '/') : undefined);
</script>

{#if isLink}
	<a
		href={resolvedHref}
		class={['app-sidebar-nav-item', active && 'app-sidebar-nav-item--active', className]}
		aria-current={active ? 'page' : undefined}
		{onclick}
	>
		<span
			class={[
				'app-sidebar-nav-item__icon',
				`app-sidebar-nav-item__icon--${icon}`,
				active && 'app-sidebar-nav-item__icon--active'
			]}
			aria-hidden="true"
		></span>
		<span class="app-sidebar-nav-item__label">{label}</span>
	</a>
{:else}
	<span
		class={[
			'app-sidebar-nav-item',
			'app-sidebar-nav-item--static',
			active && 'app-sidebar-nav-item--active',
			disabled && 'app-sidebar-nav-item--disabled',
			className
		]}
		aria-current={active ? 'page' : undefined}
	>
		<span
			class={[
				'app-sidebar-nav-item__icon',
				`app-sidebar-nav-item__icon--${icon}`,
				active && 'app-sidebar-nav-item__icon--active'
			]}
			aria-hidden="true"
		></span>
		<span class="app-sidebar-nav-item__label">{label}</span>
	</span>
{/if}

<style>
	.app-sidebar-nav-item {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 9px 11px;
		border-radius: var(--radius-md);
		font-size: 13.5px;
		color: var(--text-6);
		text-decoration: none;
		line-height: 1.2;
	}

	.app-sidebar-nav-item--active {
		background: var(--surface-active);
		color: var(--text-1);
		font-weight: 500;
	}

	.app-sidebar-nav-item--static {
		cursor: default;
	}

	.app-sidebar-nav-item--disabled {
		opacity: 0.7;
	}

	.app-sidebar-nav-item__icon {
		width: 7px;
		height: 7px;
		flex-shrink: 0;
	}

	.app-sidebar-nav-item__icon--home {
		border-radius: 2px;
		border: 1.5px solid var(--text-8);
	}

	.app-sidebar-nav-item__icon--home.app-sidebar-nav-item__icon--active {
		background: var(--accent);
		border-color: var(--accent);
	}

	.app-sidebar-nav-item__icon--projects {
		border-radius: 2px;
		border: 1.5px solid var(--text-8);
	}

	.app-sidebar-nav-item__icon--templates {
		border-radius: var(--radius-pill);
		border: 1.5px solid var(--text-8);
	}

	.app-sidebar-nav-item__icon--trash {
		border-radius: 1px;
		background: var(--text-8);
		transform: rotate(45deg);
	}
</style>
