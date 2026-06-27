import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import ImportGatewayHarness from './ImportGateway.harness.svelte';

describe('ImportGateway.svelte', () => {
	it('renders idle import gateway', async () => {
		render(ImportGatewayHarness);

		await expect.element(page.getByTestId('import-gateway-idle')).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: 'Start your video' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByTestId('import-gateway-idle').getByRole('button', { name: 'Record' }))
			.toBeInTheDocument();
		await expect
			.element(
				page.getByTestId('import-gateway-idle').getByRole('button', { name: 'Upload a file' })
			)
			.toBeInTheDocument();
	});

	it('fires onrecord when Record is clicked', async () => {
		const onrecord = vi.fn();
		render(ImportGatewayHarness, { onrecord });

		await userEvent.click(
			page.getByTestId('import-gateway-idle').getByRole('button', { name: 'Record' })
		);

		expect(onrecord).toHaveBeenCalledOnce();
	});

	it('shows uploading state after files are selected', async () => {
		render(ImportGatewayHarness);

		const fileInput = document.querySelector<HTMLInputElement>('.import-gateway__file-input');
		expect(fileInput).not.toBeNull();

		const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		fileInput!.files = dataTransfer.files;
		fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

		await expect.element(page.getByTestId('import-gateway-uploading')).toBeInTheDocument();
		await expect.element(page.getByText('Uploading footage')).toBeInTheDocument();
		await expect.element(page.getByText('clip.mp4')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Cancel all' })).toBeInTheDocument();
	});

	it('cancel all returns to idle gateway', async () => {
		render(ImportGatewayHarness);

		const fileInput = document.querySelector<HTMLInputElement>('.import-gateway__file-input');
		const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		fileInput!.files = dataTransfer.files;
		fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

		await expect.element(page.getByTestId('import-gateway-uploading')).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Cancel all' }));

		await expect.element(page.getByTestId('import-gateway-idle')).toBeInTheDocument();
		await expect.element(page.getByTestId('import-gateway-uploading')).not.toBeInTheDocument();
	});
});
