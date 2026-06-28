<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal/Modal.svelte';

	interface Props {
		open: boolean;
		onclose?: () => void;
		onconfirm?: () => void;
	}

	let { open, onclose, onconfirm }: Props = $props();
</script>

<Modal {open} title="Re-transcribe clip?" layer="export" {onclose}>
	<p class="retranscribe-confirm__body">
		This replaces your entire transcript and discards manual edits — including filler removal and
		word-level cuts. This cannot be undone.
	</p>
	<div class="retranscribe-confirm__actions">
		<Button type="button" variant="secondary" onclick={onclose}>Cancel</Button>
		<Button type="button" variant="danger" onclick={onconfirm}>Re-transcribe</Button>
	</div>
</Modal>

<style>
	.retranscribe-confirm__body {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--text-6);
	}

	.retranscribe-confirm__actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 20px;
	}
</style>
