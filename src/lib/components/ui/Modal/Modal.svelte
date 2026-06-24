<script module lang="ts">
	let modalIdCounter = 0;

	export function nextModalTitleId(): string {
		modalIdCounter += 1;
		return `modal-title-${modalIdCounter}`;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ModalLayer } from './Modal.types';
	import { MODAL_LAYER_Z } from './Modal.types';

	interface Props {
		open: boolean;
		title: string;
		layer?: ModalLayer;
		onclose?: () => void;
		class?: string;
		header?: Snippet;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		open,
		title,
		layer = 'export',
		onclose,
		class: className = '',
		header,
		children,
		footer
	}: Props = $props();

	const titleId = nextModalTitleId();

	let panelEl = $state<HTMLDivElement | null>(null);
	let closeButtonEl = $state<HTMLButtonElement | null>(null);

	const zIndex = $derived(MODAL_LAYER_Z[layer]);

	function getFocusableElements(): HTMLElement[] {
		if (!panelEl) return [];
		return [
			...panelEl.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		];
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onclose?.();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			onclose?.();
			return;
		}

		if (event.key !== 'Tab' || !panelEl) return;

		const focusable = getFocusableElements();
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement | null;

		if (event.shiftKey && active === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	$effect(() => {
		if (!open) return;

		const previousFocus = document.activeElement as HTMLElement | null;
		closeButtonEl?.focus();

		return () => {
			previousFocus?.focus();
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class={['modal', className]} style:--modal-z={zIndex} role="presentation">
		<div class="modal__overlay" onclick={handleOverlayClick} role="presentation"></div>
		<div
			bind:this={panelEl}
			class="modal__panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
		>
			<header class="modal__header">
				{#if header}
					{@render header()}
				{:else}
					<h2 id={titleId} class="modal__title">{title}</h2>
				{/if}
				<button
					type="button"
					bind:this={closeButtonEl}
					class="modal__close"
					aria-label="Close"
					onclick={onclose}
				>
					<span class="modal__close-icon" aria-hidden="true">✕</span>
				</button>
			</header>
			<div class="modal__body">
				{@render children()}
			</div>
			{#if footer}
				<footer class="modal__footer">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		inset: 0;
		z-index: var(--modal-z);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal__overlay {
		position: absolute;
		inset: 0;
		background: rgb(6 6 8 / 74%);
		backdrop-filter: blur(6px);
		cursor: pointer;
	}

	.modal__panel {
		position: relative;
		width: min(100% - 32px, 540px);
		background: var(--surface-5);
		border: 1px solid var(--border-7);
		border-radius: var(--radius-3xl);
		padding: 24px;
		box-shadow: var(--shadow-modal);
		outline: none;
	}

	.modal__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 18px;
	}

	.modal__title {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-1);
		line-height: 1.2;
	}

	.modal__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 1px solid var(--border-6);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-6);
		font-family: inherit;
		cursor: pointer;
	}

	.modal__close-icon {
		font-size: 14px;
		line-height: 1;
	}

	.modal__body {
		color: var(--text-3);
	}

	.modal__footer {
		margin-top: 18px;
	}
</style>
