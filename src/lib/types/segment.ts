export type SegmentType = 'video' | 'image' | 'audio';

/** Ordered A-roll segment in the primary storyline. */
export interface ARollSegment {
	id: string;
	projectId: string;
	order: number;
	type: SegmentType;
	mediaId: string | null;
	durationSeconds: number;
	trimIn: number | null;
	trimOut: number | null;
}
