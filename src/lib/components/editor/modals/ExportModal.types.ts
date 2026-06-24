export type ExportFormat = 'mp4' | 'mov' | 'gif';
export type ExportResolution = '720p' | '1080p' | '4k';

export interface ExportConfig {
	format: ExportFormat;
	resolution: ExportResolution;
	burnCaptions: boolean;
}
