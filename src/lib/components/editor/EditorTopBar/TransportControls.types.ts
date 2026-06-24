export interface TransportControlsProps {
	playing: boolean;
	current: number;
	total: number;
	ontoStart?: () => void;
	ontogglePlay?: () => void;
	ontoEnd?: () => void;
}
