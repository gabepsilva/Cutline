<script lang="ts">
	import AuthFormField from './AuthFormField.svelte';
	import type { AuthFormFieldType } from './AuthFormField.types';

	interface Props {
		id?: string;
		name?: string;
		label?: string;
		type?: AuthFormFieldType;
		value?: string;
		placeholder?: string;
		error?: string;
		disabled?: boolean;
	}

	let {
		id = 'auth-email',
		name = 'email',
		label = 'Email',
		type = 'email',
		value = '',
		placeholder = 'you@example.com',
		error,
		disabled = false
	}: Props = $props();
</script>

<AuthFormField
	{id}
	{name}
	{label}
	{type}
	{value}
	{placeholder}
	{error}
	{disabled}
	autocomplete="email"
	required
/>
