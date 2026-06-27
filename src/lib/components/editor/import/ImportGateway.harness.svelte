<script lang="ts">
	import ImportGateway from './ImportGateway.svelte';

	interface Props {
		onrecord?: () => void;
	}

	let { onrecord }: Props = $props();
</script>

<div class="import-gateway-harness">
	<ImportGateway {onrecord} />
</div>

<style>
	.import-gateway-harness {
		padding: 24px;
		background: var(--surface-1);
		min-height: 480px;
	}
</style>
