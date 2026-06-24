// MOCK: Media shelf cards for shell preview until media library API exists (M6-04).
// TODO(backend): Replace with media library query in editor load (M6-04).
import type { MediaResource } from '$lib/types/media';

export const mockMediaResources: MediaResource[] = [
	{
		id: 'media-1',
		name: 'Office wide shot',
		dur: 12.4,
		kind: 'B-roll',
		thumb: 'repeating-linear-gradient(135deg,#1a2330 0 11px,#151c26 11px 22px)'
	},
	{
		id: 'media-2',
		name: 'Screen capture',
		dur: 8.2,
		kind: 'Recording',
		thumb: 'repeating-linear-gradient(135deg,#1f1a28 0 11px,#181420 11px 22px)'
	},
	{
		id: 'media-3',
		name: 'Lower third',
		dur: 5.0,
		kind: 'Graphic',
		thumb: 'repeating-linear-gradient(135deg,#1a2820 0 11px,#151f18 11px 22px)'
	}
];
