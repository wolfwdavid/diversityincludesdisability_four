import { defineConfig, devices } from '@playwright/test';

// Preview port is configurable so this project never collides with a sibling site's preview
// server on the same machine (several diversityincludesdisability_* projects share port 4173).
// Defaults to 4173 (unchanged) when PREVIEW_PORT is unset. Set PREVIEW_PORT to an unused port
// to guarantee the suite serves THIS project's build, not a neighbor's leftover preview.
const PORT = Number(process.env.PREVIEW_PORT ?? 4173);
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	fullyParallel: true,
	// Run the suite against the PRODUCTION build (adapter-static + `pnpm preview`), not the dev
	// server. Dev-mode hydration compiles modules on demand, so a click can land before the
	// button's handler is attached (lost interaction). The preview build hydrates near-instantly,
	// so interaction tests are reliable — and it exercises the same artifact shipped to Pages.
	// `base` is '' here (BASE_PATH only set for the gh-pages build), so test URLs stay plain `/`.
	webServer: {
		command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
		url: ORIGIN,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	use: { baseURL: ORIGIN, trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
