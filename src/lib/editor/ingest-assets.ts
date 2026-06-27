import type { MediaAssetUrls } from '$lib/server/storage/media-assets';
import type { FilmstripMeta, WaveformData } from '$lib/types/ingest-assets';
import type { MediaStatus } from '$lib/types/media-upload';

export interface IngestAssetsState {
	mediaId: string;
	status: MediaStatus;
	transcodeUrl: string | null;
	waveform: WaveformData | null;
	filmstripUrl: string | null;
	filmstripMeta: FilmstripMeta | null;
}

export async function fetchMediaAssets(
	projectId: string,
	mediaId: string
): Promise<MediaAssetUrls> {
	const response = await fetch(`/api/projects/${projectId}/media/${mediaId}/assets`);
	if (!response.ok) {
		throw new Error(`Failed to load media assets (${response.status})`);
	}
	return (await response.json()) as MediaAssetUrls;
}

export async function loadIngestAssets(
	projectId: string,
	mediaId: string
): Promise<IngestAssetsState> {
	const urls = await fetchMediaAssets(projectId, mediaId);
	let waveform: WaveformData | null = null;
	let filmstripMeta: FilmstripMeta | null = null;

	if (urls.waveformUrl) {
		const response = await fetch(urls.waveformUrl);
		if (response.ok) {
			waveform = (await response.json()) as WaveformData;
		}
	}

	if (urls.filmstripMetaUrl) {
		const response = await fetch(urls.filmstripMetaUrl);
		if (response.ok) {
			filmstripMeta = (await response.json()) as FilmstripMeta;
		}
	}

	return {
		mediaId,
		status: urls.status,
		transcodeUrl: urls.transcodeUrl,
		waveform,
		filmstripUrl: urls.filmstripUrl,
		filmstripMeta
	};
}

/** Poll asset URLs while ingest is in progress. */
export function pollIngestAssets(
	projectId: string,
	mediaId: string,
	onUpdate: (state: IngestAssetsState) => void,
	intervalMs = 2_000
): () => void {
	let stopped = false;

	const tick = async () => {
		while (!stopped) {
			try {
				const state = await loadIngestAssets(projectId, mediaId);
				onUpdate(state);
				if (state.status === 'ready' || state.status === 'failed') {
					return;
				}
			} catch {
				// Keep polling through transient network errors.
			}
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
	};

	void tick();

	return () => {
		stopped = true;
	};
}
