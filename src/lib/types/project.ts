/** Dashboard project card shape (M4-00). */
export type ProjectKind = 'DEMO' | 'INTERVIEW' | 'TALKING HEAD' | 'VLOG' | 'WEBINAR';

export interface Project {
	id: string;
	title: string;
	durationLabel: string;
	kind: ProjectKind | (string & {});
	meta: string;
	thumb: string;
}
