import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import { fixtureUser } from '$lib/test/fixtures/user';
import TranscriptSpeakerHarness from './TranscriptSpeaker.harness.svelte';

describe('TranscriptSpeaker.svelte', () => {
	it('renders speaker name and default subtitle', async () => {
		render(TranscriptSpeakerHarness);

		await expect.element(page.getByText(fixtureUser.name)).toBeInTheDocument();
		await expect.element(page.getByText('Creator · single speaker')).toBeInTheDocument();
	});

	it('renders custom subtitle when provided', async () => {
		render(TranscriptSpeakerHarness, {
			speaker: {
				name: fixtureUser.name,
				initials: fixtureUser.initials,
				subtitle: 'Host · podcast episode'
			}
		});

		await expect.element(page.getByText('Host · podcast episode')).toBeInTheDocument();
	});

	it('exposes avatar with accessible name', async () => {
		render(TranscriptSpeakerHarness);

		await expect.element(page.getByRole('img', { name: fixtureUser.name })).toBeInTheDocument();
		await expect.element(page.getByText(fixtureUser.initials)).toBeInTheDocument();
	});
});
