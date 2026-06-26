// @vitest/mocker's browser dynamicImportPlugin wraps import() in every Vite environment,
// but __vitest_browser_runner__ only exists in the browser context. SSR modules (e.g.
// hooks.server.ts via SvelteKit's generated internal.js) crash without this passthrough.
// https://github.com/vitest-dev/vitest/issues/10319
declare global {
	var __vitest_browser_runner__: { wrapDynamicImport<T>(moduleFactory: () => T): T } | undefined;
}

globalThis.__vitest_browser_runner__ ??= {
	wrapDynamicImport: <T>(moduleFactory: () => T): T => moduleFactory()
};

export {};
