<script lang="ts">
	interface Props {
		label?: string;
		class?: string;
	}

	let { label = 'Cutline', class: className = '' }: Props = $props();
</script>

<div class={['app-sidebar-logo', className]}>
	<span class="app-sidebar-logo__mark" aria-hidden="true">
		<span class="app-sidebar-logo__mark-inner"></span>
	</span>
	<span class="app-sidebar-logo__label">{label}</span>
</div>

<style>
	.app-sidebar-logo {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 6px 24px;
	}

	.app-sidebar-logo__mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: var(--radius-sm);
		background: var(--accent);
		flex-shrink: 0;
	}

	.app-sidebar-logo__mark-inner {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		background: var(--on-accent);
	}

	.app-sidebar-logo__label {
		font-size: 16px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-1);
		line-height: 1.2;
	}
</style>
