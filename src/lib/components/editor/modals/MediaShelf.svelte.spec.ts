import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import { mockMediaResources } from '$lib/mocks/media.mock';
import MediaShelfHarness from './MediaShelf.harness.svelte';

describe('MediaShelf.svelte', () => {
	it('renders media library when open', async () => {
		render(MediaShelfHarness, { open: true });

		await expect.element(page.getByRole('region', { name: 'Media library' })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Media library' })).toBeInTheDocument();
		await expect.element(page.getByText('Record new')).toBeInTheDocument();
		await expect.element(page.getByText(mockMediaResources[0].name)).toBeInTheDocument();
	});

	it('hides shelf when closed', async () => {
		render(MediaShelfHarness, { open: false });

		await expect
			.element(page.getByRole('region', { name: 'Media library' }))
			.not.toBeInTheDocument();
	});

	it('fires onclose when close button is clicked', async () => {
		const onclose = vi.fn();
		render(MediaShelfHarness, { onclose });

		await userEvent.click(page.getByRole('button', { name: 'Close media library' }));

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('fires onrecord when record new is clicked', async () => {
		const onrecord = vi.fn();
		render(MediaShelfHarness, { onrecord });

		await userEvent.click(page.getByRole('button', { name: 'Record new' }));

		expect(onrecord).toHaveBeenCalledOnce();
	});

	it('fires onresourceclick with the selected resource', async () => {
		const onresourceclick = vi.fn();
		render(MediaShelfHarness, { onresourceclick });

		await userEvent.click(page.getByRole('button', { name: mockMediaResources[1].name }));

		expect(onresourceclick).toHaveBeenCalledOnce();
		expect(onresourceclick).toHaveBeenCalledWith(mockMediaResources[1]);
	});
});
