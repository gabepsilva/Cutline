<script lang="ts">
	import type { AuthFormFieldType } from './AuthFormField.types';

	interface Props {
		id: string;
		name: string;
		label: string;
		type?: AuthFormFieldType;
		value?: string;
		placeholder?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		required?: boolean;
		disabled?: boolean;
		error?: string;
		class?: string;
	}

	let {
		id,
		name,
		label,
		type = 'text',
		value = '',
		placeholder = '',
		autocomplete,
		required = false,
		disabled = false,
		error,
		class: className = ''
	}: Props = $props();

	const describedBy = $derived(error ? `${id}-error` : undefined);
</script>

<div class={['auth-form-field', error ? 'auth-form-field--error' : '', className]}>
	<label class="auth-form-field__label" for={id}>{label}</label>
	<input
		class="auth-form-field__input"
		{id}
		{name}
		{type}
		{value}
		{placeholder}
		{autocomplete}
		{required}
		{disabled}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
	/>
	{#if error}
		<p class="auth-form-field__error" id="{id}-error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.auth-form-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
	}

	.auth-form-field__label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-4);
		line-height: 1.3;
	}

	.auth-form-field__input {
		width: 100%;
		box-sizing: border-box;
		padding: 10px 12px;
		border: 1px solid var(--border-5);
		border-radius: var(--radius-md);
		background: var(--surface-6);
		color: var(--text-1);
		font: inherit;
		font-size: 13px;
		line-height: 1.3;
		outline: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.auth-form-field__input::placeholder {
		color: var(--text-placeholder);
	}

	.auth-form-field__input:focus-visible {
		border-color: var(--accent-tint-55);
		box-shadow: 0 0 0 3px var(--accent-tint-08);
	}

	.auth-form-field__input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.auth-form-field--error .auth-form-field__input {
		border-color: var(--danger-tint-42);
	}

	.auth-form-field__error {
		margin: 0;
		font-size: 12px;
		color: var(--danger-text);
		line-height: 1.3;
	}
</style>
