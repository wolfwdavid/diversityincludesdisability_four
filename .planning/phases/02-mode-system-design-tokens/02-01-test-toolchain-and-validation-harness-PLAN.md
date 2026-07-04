---
phase: 02-mode-system-design-tokens
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - playwright.config.ts
  - eslint.config.js
  - scripts/check-no-raw-hex.mjs
  - tests/a11y.spec.ts
  - tests/mode-toggle.spec.ts
  - tests/os-signal.spec.ts
  - tests/no-flash.spec.ts
autonomous: true
requirements: [MODE-01, MODE-02, MODE-03, MODE-04, MODE-05, DS-01, DS-02]
must_haves:
  truths:
    - "pnpm exec playwright test --list enumerates all 4 spec files without a collection error"
    - "package.json defines test:e2e, test:a11y, test:tokens, lint scripts"
    - "The raw-hex token gate runs and passes on the current (token-free) src tree"
    - "@fontsource, @playwright/test, @axe-core/playwright, eslint-plugin-svelte are installed"
  artifacts:
    - path: "playwright.config.ts"
      provides: "Playwright runner config (chromium, pnpm dev webServer, baseURL)"
      contains: "webServer"
    - path: "eslint.config.js"
      provides: "Flat ESLint config with svelte a11y rules"
      contains: "eslint-plugin-svelte"
    - path: "scripts/check-no-raw-hex.mjs"
      provides: "Token-discipline gate (fails on raw hex outside tokens.css)"
      contains: "process.exit(1)"
    - path: "tests/a11y.spec.ts"
      provides: "axe zero-violations scan in both modes (DS-01, DS-02)"
      contains: "AxeBuilder"
    - path: "tests/mode-toggle.spec.ts"
      provides: "toggle flip + persist + announce (MODE-01, MODE-02, MODE-05)"
      contains: "aria-pressed"
    - path: "tests/os-signal.spec.ts"
      provides: "OS-signal auto-select (MODE-04)"
      contains: "emulateMedia"
    - path: "tests/no-flash.spec.ts"
      provides: "pre-paint data-mode + no google-fonts (MODE-03)"
      contains: "waitUntil"
  key_links:
    - from: "package.json"
      to: "playwright.config.ts"
      via: "test:e2e script → playwright test"
      pattern: "playwright test"
    - from: "package.json"
      to: "scripts/check-no-raw-hex.mjs"
      via: "test:tokens script"
      pattern: "check-no-raw-hex"
---

<objective>
Stand up the Phase 2 validation harness (the conceptual "Wave 0"): install the missing
font + test + lint toolchain, author the Playwright/axe config, the ESLint flat config, the
raw-hex token gate, and the four Playwright spec files that encode the VALIDATION map for
MODE-01..05 / DS-01 / DS-02.

These specs are written FIRST and are expected to FAIL (RED) until the engine (Plan 02) and
UI wiring (Plan 03) exist. This plan's acceptance is that the toolchain installs, the scripts
are wired, and Playwright can COLLECT the specs — not that they pass yet.

Purpose: give Plans 02 and 03 an executable, automatable gate so every requirement is proven
by command, not by eyeball.
Output: package.json (deps + scripts), playwright.config.ts, eslint.config.js,
scripts/check-no-raw-hex.mjs, tests/*.spec.ts (4 files).
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-mode-system-design-tokens/02-RESEARCH.md
@.planning/phases/02-mode-system-design-tokens/02-VALIDATION.md
@CLAUDE.md

<constraints>
- pnpm ONLY (never npm). Project convention; npm has broken this website family before.
- Commit messages carry NO AI/assistant mention. Focus on the change.
- Versions are pinned per RESEARCH "Standard Stack" table — install those exact versions.
</constraints>

<interfaces>
<!-- Contracts the specs target (implemented in Plans 02/03). Executor: do NOT explore for these. -->
- localStorage key: `did-mode` = "accessible" | "premium"
- `<html>` carries `data-mode="accessible" | "premium"` (static fallback = "accessible")
- Toggle is queryable by role: getByRole('button', { name: /visual mode/i })
- aria-pressed = "true" when Premium is active, "false" when Accessible
- Announcer: `[role="status"][aria-live="polite"]` region, text contains "premium"/"accessible"
- Dev server base = '' → test URLs are plain '/'
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install font + test + lint toolchain and wire package.json scripts</name>
  <files>package.json</files>
  <read_first>
    - package.json (current: minimal SvelteKit scaffold, no test/font deps)
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Standard Stack table + Installation block + Example 9 scripts)
  </read_first>
  <action>
Run the exact pinned install from RESEARCH (pnpm, not npm):

```bash
pnpm add @fontsource/lexend@5.2.11 @fontsource/source-sans-3@5.2.9
pnpm add -D @playwright/test@1.61.1 @axe-core/playwright@4.12.1 axe-core@4.12.1 \
  eslint@10.6.0 eslint-plugin-svelte@3.20.0 svelte-eslint-parser@1.8.0 \
  typescript-eslint@8.62.1 eslint-config-prettier@10.1.8 \
  prettier@3.9.4 prettier-plugin-svelte@4.1.1 @lhci/cli@0.15.1 globals @eslint/js
pnpm exec playwright install --with-deps chromium
```

Then edit `package.json` `scripts` to ADD (keep existing dev/build/preview/prepare/check):

```jsonc
"lint": "eslint . && prettier --check .",
"test:a11y": "playwright test tests/a11y.spec.ts",
"test:e2e": "playwright test",
"test:tokens": "node scripts/check-no-raw-hex.mjs",
"test": "pnpm check && pnpm lint && pnpm test:tokens && pnpm test:e2e"
```

Note: RESEARCH Example 9 used a bash grep gate; we use a Node script (`test:tokens`) instead
for Windows/pnpm-shell robustness (no dependency on `bash`/`rg` on PATH). The Node gate is
authored in Task 2.
  </action>
  <acceptance_criteria>
    - `grep -q '@fontsource/lexend' package.json` (dependency present)
    - `grep -q '@axe-core/playwright' package.json` (dev dep present)
    - `grep -q 'eslint-plugin-svelte' package.json`
    - `grep -q '"test:e2e": "playwright test"' package.json`
    - `grep -q '"test:tokens": "node scripts/check-no-raw-hex.mjs"' package.json`
    - `test -d node_modules/@fontsource/lexend && test -d node_modules/@playwright/test`
  </acceptance_criteria>
  <verify>
    <automated>pnpm exec playwright --version</automated>
  </verify>
  <done>Toolchain installed with pinned versions; package.json has lint/test:a11y/test:e2e/test:tokens/test scripts; chromium browser installed.</done>
</task>

<task type="auto">
  <name>Task 2: Author playwright.config.ts, eslint.config.js, and the raw-hex token gate</name>
  <files>playwright.config.ts, eslint.config.js, scripts/check-no-raw-hex.mjs</files>
  <read_first>
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 6 playwright.config, Example 7 eslint.config, Example 9 grep gate)
    - svelte.config.js (existing adapter-static config — do not change)
  </read_first>
  <action>
Create `playwright.config.ts` verbatim from RESEARCH Example 6:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	fullyParallel: true,
	webServer: {
		command: 'pnpm dev --port 5173 --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
```

Create `eslint.config.js` verbatim from RESEARCH Example 7:

```js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: { projectService: true, extraFileExtensions: ['.svelte'], parser: ts.parser, svelteConfig }
		}
	},
	{ ignores: ['build/', '.svelte-kit/', 'node_modules/', 'tests/', 'playwright-report/'] }
);
```

Create `scripts/check-no-raw-hex.mjs` (Node port of RESEARCH Example 9 grep gate — fails
nonzero if any `.svelte`/`.css` file OTHER than `src/lib/styles/tokens.css` contains a raw
3/6/8-digit hex color):

```js
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
const ALLOW = ['src/lib/styles/tokens.css'];
const EXT = ['.svelte', '.css'];
const failures = [];

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name).split('\\').join('/');
		if (entry.isDirectory()) {
			walk(p);
			continue;
		}
		if (!EXT.some((e) => p.endsWith(e))) continue;
		if (ALLOW.includes(p)) continue;
		readFileSync(p, 'utf8')
			.split('\n')
			.forEach((line, i) => {
				if (HEX.test(line)) failures.push(`${p}:${i + 1}: ${line.trim()}`);
			});
	}
}

walk('src');
if (failures.length) {
	console.error('FAIL: raw hex outside tokens.css:\n' + failures.join('\n'));
	process.exit(1);
}
console.log('OK: components use tokens, no raw hex');
```
  </action>
  <acceptance_criteria>
    - `grep -q 'webServer' playwright.config.ts && grep -q "testDir: 'tests'" playwright.config.ts`
    - `grep -q 'eslint-plugin-svelte' eslint.config.js` (imported as `svelte`)
    - `grep -q 'process.exit(1)' scripts/check-no-raw-hex.mjs`
    - `node scripts/check-no-raw-hex.mjs` exits 0 and prints "OK: components use tokens" (current src has no raw hex)
  </acceptance_criteria>
  <verify>
    <automated>node scripts/check-no-raw-hex.mjs</automated>
  </verify>
  <done>playwright.config.ts + eslint.config.js exist; the Node raw-hex gate runs green on the current token-free tree.</done>
</task>

<task type="auto">
  <name>Task 3: Write the four Playwright spec files encoding the VALIDATION map (RED expected)</name>
  <files>tests/a11y.spec.ts, tests/mode-toggle.spec.ts, tests/os-signal.spec.ts, tests/no-flash.spec.ts</files>
  <read_first>
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 8 test skeletons — copy verbatim)
    - .planning/phases/02-mode-system-design-tokens/02-VALIDATION.md (Per-Requirement Verification Map)
  </read_first>
  <action>
Create the four spec files EXACTLY as RESEARCH Example 8. These target contracts built in
Plans 02/03, so they will FAIL now — that is the intended RED state; do NOT run them to
green in this plan.

`tests/a11y.spec.ts` (DS-01, DS-02):

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const m of ['accessible', 'premium'] as const) {
	test(`axe: zero violations in ${m} mode`, async ({ page }) => {
		await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-mode', m);
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(violations).toEqual([]);
	});
}
```

`tests/mode-toggle.spec.ts` (MODE-01, MODE-02, MODE-05):

```ts
import { test, expect } from '@playwright/test';

test('toggle flips data-mode + aria-pressed and persists across reload', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'accessible'));
	await page.goto('/');
	const html = page.locator('html');
	const toggle = page.getByRole('button', { name: /visual mode/i });

	await expect(html).toHaveAttribute('data-mode', 'accessible');
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	await toggle.click();
	await expect(html).toHaveAttribute('data-mode', 'premium');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');

	await page.reload();
	await expect(html).toHaveAttribute('data-mode', 'premium');
	expect(await page.evaluate(() => localStorage.getItem('did-mode'))).toBe('premium');
});

test('switch announces via polite live region (MODE-05)', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /visual mode/i }).click();
	await expect(page.locator('[role="status"][aria-live="polite"]')).toHaveText(/premium/i);
});
```

`tests/os-signal.spec.ts` (MODE-04):

```ts
import { test, expect } from '@playwright/test';

test('reduced-motion auto-selects Accessible (no stored choice)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'accessible');
});

test('prefers-contrast: more auto-selects Accessible (no stored choice)', async ({ page }) => {
	await page.emulateMedia({ contrast: 'more' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'accessible');
});

test('no OS signal defaults to Premium', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'premium');
});

test('explicit stored choice overrides OS signal (MODE-04 agency)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'premium');
});
```

`tests/no-flash.spec.ts` (MODE-03 + no-google-fonts):

```ts
import { test, expect } from '@playwright/test';

test('mode applied before hydration (no flash) — MODE-03', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/', { waitUntil: 'commit' });
	expect(await page.evaluate(() => document.documentElement.dataset.mode)).toBe('premium');
});

test('no Google Fonts request fires (self-hosted)', async ({ page }) => {
	const hits: string[] = [];
	page.on('request', (r) => {
		const u = r.url();
		if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) hits.push(u);
	});
	await page.goto('/', { waitUntil: 'networkidle' });
	expect(hits).toEqual([]);
});
```
  </action>
  <acceptance_criteria>
    - `test -f tests/a11y.spec.ts && test -f tests/mode-toggle.spec.ts && test -f tests/os-signal.spec.ts && test -f tests/no-flash.spec.ts`
    - `grep -q 'AxeBuilder' tests/a11y.spec.ts`
    - `grep -q 'aria-pressed' tests/mode-toggle.spec.ts && grep -q 'aria-live' tests/mode-toggle.spec.ts`
    - `grep -q "emulateMedia" tests/os-signal.spec.ts && grep -q "contrast: 'more'" tests/os-signal.spec.ts`
    - `grep -q "waitUntil: 'commit'" tests/no-flash.spec.ts && grep -q 'fonts.googleapis.com' tests/no-flash.spec.ts`
    - `pnpm exec playwright test --list` enumerates tests from all 4 files with no collection/parse error (tests are NOT run to pass here)
  </acceptance_criteria>
  <verify>
    <automated>pnpm exec playwright test --list</automated>
  </verify>
  <done>All 4 spec files exist, are parseable by Playwright's collector, and encode the full VALIDATION map. RED (failing on run) is expected and acceptable until Plans 02–03 land.</done>
</task>

</tasks>

<verification>
- `pnpm exec playwright --version` prints a version.
- `node scripts/check-no-raw-hex.mjs` exits 0.
- `pnpm exec playwright test --list` collects specs from all 4 files without error.
- package.json contains the 5 new scripts.
</verification>

<success_criteria>
- Pinned toolchain installed via pnpm (fonts, playwright, axe, eslint stack, prettier, lhci).
- playwright.config.ts (chromium + pnpm dev webServer), eslint.config.js (svelte a11y), and the
  Node raw-hex gate exist and run.
- Four spec files encode MODE-01..05 + DS-01/DS-02 and are collectable by Playwright.
- No functional engine code written here (that is Plan 02); specs are RED by design.
</success_criteria>

<output>
After completion, create `.planning/phases/02-mode-system-design-tokens/02-01-SUMMARY.md`.
</output>
