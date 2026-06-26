export type ModalLayer = 'dashboard' | 'export' | 'record';

export const MODAL_LAYER_Z: Record<ModalLayer, string> = {
	dashboard: 'var(--z-dashboard)',
	export: 'var(--z-export)',
	record: 'var(--z-record)'
};
