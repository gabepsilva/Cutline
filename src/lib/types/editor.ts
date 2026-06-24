/** Editor modal / record state machines (M5-00). */
export type ExportPhase = 'none' | 'config' | 'exporting' | 'done';

export type RecordPhase = 'none' | 'live' | 'countdown' | 'recording' | 'review';

export type AccentColor = '#ff6a3d' | '#7c5cff' | '#2ad1a3' | '#3d7bff';
