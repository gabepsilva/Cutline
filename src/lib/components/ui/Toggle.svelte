<script lang="ts">
	import type { ToggleSize } from './Toggle.types';

	interface Props {
		checked?: boolean;
		label: string;
		size?: ToggleSize;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
		class?: string;
	}

	let {
		checked = false,
		label,
		size = 'md',
		disabled = false,
		onchange,
		class: className = ''
	}: Props = $props();

	function handleClick() {
		onchange?.(!checked);
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	{disabled}
	class={['toggle', `toggle--${size}`, checked && 'toggle--checked', className]}
	onclick={handleClick}
>
	<span class="toggle__thumb" aria-hidden="true"></span>
</button>

<style>
	.toggle {
		position: relative;
		flex-shrink: 0;
		padding: 0;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.toggle--sm {
		width: 30px;
		height: 17px;
		border-radius: 9px;
	}

	.toggle--md {
		width: 38px;
		height: 22px;
		border-radius: 11px;
	}

	.toggle:not(.toggle--checked) {
		background: var(--surface-7);
	}

	.toggle--checked {
		background: var(--accent);
	}

	.toggle__thumb {
		position: absolute;
		top: 2px;
		border-radius: var(--radius-pill);
		background: var(--on-accent);
		transition:
			left 0.15s,
			right 0.15s;
	}

	.toggle--sm .toggle__thumb {
		width: 13px;
		height: 13px;
	}

	.toggle--md .toggle__thumb {
		width: 18px;
		height: 18px;
	}

	.toggle:not(.toggle--checked) .toggle__thumb {
		left: 2px;
		right: auto;
	}

	.toggle--checked .toggle__thumb {
		left: auto;
		right: 2px;
	}
</style>
