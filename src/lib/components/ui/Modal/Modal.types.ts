export type ModalLayer = 'export' | 'record';

export const MODAL_LAYER_Z: Record<ModalLayer, string> = {
	export: 'var(--z-export)',
	record: 'var(--z-record)'
};
