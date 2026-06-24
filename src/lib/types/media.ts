/** Media shelf resource shape (M6-00). */
export type MediaKind = 'B-roll' | 'Graphic' | 'Recording';

export interface MediaResource {
	id: string;
	name: string;
	dur: number;
	kind: MediaKind | (string & {});
	thumb: string;
}
