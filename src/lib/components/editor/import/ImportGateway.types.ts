export type ImportGatewayMode = 'idle' | 'uploading';

export interface ImportUploadFile {
	id: string;
	name: string;
	size: number;
	progress: number;
	done: boolean;
	error?: boolean;
	statusLabel: string;
}
