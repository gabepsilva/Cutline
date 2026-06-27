import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '$lib/test/render';
import ImportGatewayHarness from './ImportGateway.harness.svelte';

vi.mock('$lib/editor/media-upload', () => ({
	uploadImportMedia: vi.fn()
}));

import { uploadImportMedia } from '$lib/editor/media-upload';

const mockedUpload = vi.mocked(uploadImportMedia);

describe('ImportGateway.svelte', () => {
	beforeEach(() => {
		mockedUpload.mockReset();
		mockedUpload.mockImplementation(async ({ onProgress, onProjectCreated }) => {
			onProjectCreated?.('proj-new');
			onProgress?.(0.5);
			onProgress?.(1);
			return {
				projectId: 'proj-new',
				mediaId: 'media-1',
				jobId: 'job-1',
				name: 'clip.mp4'
			};
		});
	});

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
		expect(mockedUpload).toHaveBeenCalled();
	});

	it('fires onprojectcreated when the first upload starts', async () => {
		const onprojectcreated = vi.fn();
		render(ImportGatewayHarness, { onprojectcreated });

		const fileInput = document.querySelector<HTMLInputElement>('.import-gateway__file-input');
		const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		fileInput!.files = dataTransfer.files;
		fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => {
			expect(onprojectcreated).toHaveBeenCalledWith('proj-new');
		});
	});

	it('retries project creation after the first upload fails', async () => {
		const onprojectcreated = vi.fn();
		mockedUpload.mockRejectedValueOnce(new Error('network boom'));
		render(ImportGatewayHarness, { onprojectcreated });

		const fileInput = document.querySelector<HTMLInputElement>('.import-gateway__file-input');

		const failing = new File(['video'], 'first.mp4', { type: 'video/mp4' });
		const firstDrop = new DataTransfer();
		firstDrop.items.add(failing);
		fileInput!.files = firstDrop.files;
		fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

		await expect.element(page.getByText('Failed')).toBeInTheDocument();
		expect(onprojectcreated).not.toHaveBeenCalled();

		const retry = new File(['video'], 'second.mp4', { type: 'video/mp4' });
		const secondDrop = new DataTransfer();
		secondDrop.items.add(retry);
		fileInput!.files = secondDrop.files;
		fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => {
			expect(onprojectcreated).toHaveBeenCalledWith('proj-new');
		});
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
