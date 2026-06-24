import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'bun run build && bun run preview',
		port: 4173,
		env: {
			DATABASE_URL: process.env.DATABASE_URL,
			BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET
		}
	},
	testMatch: '**/*.e2e.{ts,js}'
});
