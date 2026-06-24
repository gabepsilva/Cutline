export type EditorRailIcon = 'preview' | 'record' | 'audio' | 'media' | 'settings';

export interface EditorRailItem {
	id: string;
	label: string;
	icon: EditorRailIcon;
	active?: boolean;
}
