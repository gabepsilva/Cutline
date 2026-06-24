import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	// @libsql/client loads a native binding (@libsql/<platform> .node) via dynamic
	// require — bundling it breaks that lookup at runtime. Keep it external so the
	// adapter-node server requires it from node_modules. (T-10)
	ssr: {
		external: ['@libsql/client', 'libsql']
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-node: containerized SSR deploy to Kubernetes (tk8s). The built server
			// listens on HOST:PORT and honours ORIGIN — see Dockerfile + infra/k8s/.
			// https://svelte.dev/docs/kit/adapter-node
			adapter: adapter(),

			typescript: {
				config: (config) => ({
					...config,
					include: [...config.include, '../drizzle.config.ts']
				})
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			// istanbul: browser (client) project does not support v8 coverage APIs.
			provider: 'istanbul',
			reporter: ['text', 'html', 'lcov'],
			include: [
				'src/lib/**/*.{ts,svelte}',
				'src/routes/**/+page.server.ts',
				'src/routes/**/+server.ts'
			],
			exclude: [
				'src/**/*.d.ts',
				'src/**/*.spec.ts',
				'src/**/*.svelte.spec.ts',
				'src/**/*.e2e.ts',
				'src/**/*.test.ts',
				// Scaffold/demo routes — coverage enforced when real routes land (M3+).
				'src/routes/demo/**',
				'src/hooks.server.ts',
				// Server layer — enable in coverage when server tests land (M3+).
				'src/lib/server/**'
			],
			thresholds: {
				lines: 80,
				'src/lib/utils/**': { lines: 95 },
				'src/lib/editor/**': { lines: 90 },
				'src/lib/components/ui/**': { lines: 85 },
				'src/lib/components/**': { lines: 80 },
				'src/routes/**/+page.server.ts': { lines: 85 },
				'src/routes/**/+server.ts': { lines: 85 }
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					setupFiles: ['src/lib/test/setup.ts'],
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
