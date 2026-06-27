import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'bun run build && bun run preview',
		port: 4173,
		env: {
			DATABASE_URL: process.env.DATABASE_URL,
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
			ORIGIN: process.env.ORIGIN ?? 'http://localhost:4173',
			R2_ENDPOINT: process.env.R2_ENDPOINT,
			R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
			R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
			R2_BUCKET: process.env.R2_BUCKET,
			ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY
		}
	},
	testMatch: '**/*.e2e.{ts,js}'
});
