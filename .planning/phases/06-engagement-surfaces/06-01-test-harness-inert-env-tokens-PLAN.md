---
phase: 06-engagement-surfaces
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - vitest.config.ts
  - playwright.enabled.config.ts
  - playwright.config.ts
  - .env
  - .env.example
  - .gitignore
  - src/lib/styles/tokens.css
  - scripts/check-token-contrast.mjs
autonomous: true
requirements: [ENGAGE-01, ENGAGE-02, ENGAGE-03]

must_haves:
  truths:
    - "A default `pnpm build` succeeds with no key set (committed empty `.env` supplies the export) and the site is unchanged — proving the inert-until-configured foundation for ENGAGE-02."
    - "The vitest + enabled-Playwright harness exists so Wave 2 can author RED component/enabled specs against real runners."
    - "The new engagement tokens (--danger/--success/--field-border) exist in BOTH mode themes and pass a computed WCAG contrast gate (≥7:1 text, ≥3:1 border)."
  artifacts:
    - path: ".env"
      provides: "Committed empty default PUBLIC_WEB3FORMS_KEY so $env/static/public export always exists"
      contains: 'PUBLIC_WEB3FORMS_KEY=""'
    - path: "vitest.config.ts"
      provides: "jsdom component-test runner with $lib alias + @testing-library/svelte"
      contains: "jsdom"
    - path: "playwright.enabled.config.ts"
      provides: "Second Playwright config that builds WITH a dummy key, isolated port"
      contains: "PUBLIC_WEB3FORMS_KEY"
    - path: "scripts/check-token-contrast.mjs"
      provides: "Computed WCAG contrast gate for the new tokens in both modes"
      contains: "CONTRAST OK"
    - path: "src/lib/styles/tokens.css"
      provides: "--danger/--success/--field-border in accessible + premium blocks"
      contains: "--field-border"
  key_links:
    - from: "playwright.enabled.config.ts"
      to: "vite build"
      via: "webServer.env PUBLIC_WEB3FORMS_KEY=test-key overrides the empty .env default"
      pattern: "env:\\s*\\{[^}]*PUBLIC_WEB3FORMS_KEY"
    - from: "playwright.config.ts"
      to: "tests/unit/**"
      via: "testIgnore keeps Playwright from running vitest specs"
      pattern: "testIgnore"
---

<objective>
Stand up the Wave-0 harness for Phase 6: install the component-test toolchain, add the second (enabled) Playwright config, commit the inert `.env` default that makes the form ship hidden, and add the AAA-safe engagement tokens with a computed contrast gate.

Purpose: Every downstream plan (contact form, media section, integration) depends on this foundation existing and green. Nothing here renders new UI — it is pure infrastructure so the form/media work can be built test-first and inert-by-default.
Output: `.env`/`.env.example`, `vitest.config.ts`, `playwright.enabled.config.ts`, an updated `playwright.config.ts`, new package scripts, the three new tokens in both modes, and `scripts/check-token-contrast.mjs`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/06-engagement-surfaces/06-RESEARCH.md
@.planning/phases/06-engagement-surfaces/06-VALIDATION.md

<interfaces>
<!-- Existing infra the executor must match, extracted from the repo. Do NOT explore further. -->

playwright.config.ts (existing default): PORT from `process.env.PREVIEW_PORT ?? 4173`; webServer.command = `pnpm build && pnpm preview --port ${PORT} --strictPort`; single chromium project. The enabled config mirrors this but sets `testMatch` + `webServer.env`.

.gitignore (existing, relevant lines):
```
.env
.env.*
!.env.example
!.env.test
```
`.env` is currently IGNORED. It MUST become tracked (empty, public value) — add `!.env`.

tokens.css theme blocks: `[data-mode='accessible'] { … --bg: #ffffff; --accent: #9a3412; … }` and `[data-mode='premium'] { … --bg: #0a0e14; --accent: #ff9e5e; … }`. New tokens go inside each block.

package.json scripts (existing): `test:e2e`, `test:tokens`, `test`, `test:launch`, etc. Package manager is **pnpm** (never npm).

Research-pinned versions (verify with `npm view <pkg> version` before pinning): `vitest@4.1.10`, `@testing-library/svelte@5.4.2`, `jsdom@29.1.1`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install component-test toolchain + author vitest and enabled-Playwright configs</name>
  <read_first>package.json, playwright.config.ts, svelte.config.js</read_first>
  <files>package.json, vitest.config.ts, playwright.enabled.config.ts, playwright.config.ts</files>
  <action>
Install the runners (pnpm, never npm). Confirm versions first, then pin:
```bash
npm view vitest version && npm view @testing-library/svelte version && npm view jsdom version
pnpm add -D vitest@4.1.10 @testing-library/svelte@5.4.2 jsdom@29.1.1
```

Add three scripts to `package.json` (definitions only — wiring into the `test`/`test:launch` aggregates + CI happens in plan 06-04):
```json
"test:unit": "vitest run",
"test:e2e:enabled": "playwright test --config playwright.enabled.config.ts",
"test:contrast": "node scripts/check-token-contrast.mjs",
```

Create `vitest.config.ts` (jsdom, browser condition so Svelte 5's client runtime is used, `$lib` alias; include ONLY the unit dir so Playwright specs are never picked up):
```ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	resolve: {
		alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
		conditions: ['browser']
	},
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['tests/unit/**/*.spec.ts']
	}
});
```

Create `playwright.enabled.config.ts` — mirrors the default config but (a) runs ONLY `*.enabled.spec.ts`, (b) builds WITH a dummy key via `webServer.env` (process.env overrides the empty `.env` at build time → `$env/static/public` bakes the key → the form renders), (c) uses an isolated port to avoid colliding with the default preview:
```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PREVIEW_PORT ?? 4271);
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.enabled.spec.ts',
	testIgnore: '**/unit/**',
	timeout: 30_000,
	fullyParallel: true,
	workers: process.env.CI ? 2 : undefined,
	webServer: {
		command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
		url: ORIGIN,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		// Build the ENABLED variant: this dummy key overrides the committed empty .env default,
		// so $env/static/public bakes a non-empty PUBLIC_WEB3FORMS_KEY and the form prerenders.
		env: { PUBLIC_WEB3FORMS_KEY: 'test-key-web3forms-dummy', PREVIEW_PORT: String(PORT) }
	},
	use: { baseURL: ORIGIN, trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
```

Edit the DEFAULT `playwright.config.ts`: add `testIgnore: '**/unit/**',` (just under `testDir: 'tests',`) so the default suite never tries to run the vitest unit spec that will live at `tests/unit/`. Change nothing else.
  </action>
  <verify>
    <automated>node -e "const p=require('./package.json').scripts; if(!p['test:unit']||!p['test:e2e:enabled']||!p['test:contrast']) process.exit(1)" && grep -q "testMatch: '\*\*/\*.enabled.spec.ts'" playwright.enabled.config.ts && grep -q "testIgnore" playwright.config.ts && grep -q "jsdom" vitest.config.ts && pnpm exec vitest --version</automated>
  </verify>
  <done>Deps installed; the three scripts exist; `vitest.config.ts`, `playwright.enabled.config.ts` exist; default `playwright.config.ts` ignores `tests/unit/**`; `pnpm exec vitest --version` prints a version.</done>
</task>

<task type="auto">
  <name>Task 2: Commit the inert PUBLIC_WEB3FORMS_KEY default (.env + .env.example + un-ignore)</name>
  <read_first>.gitignore, svelte.config.js</read_first>
  <files>.env, .env.example, .gitignore</files>
  <action>
The inert-until-configured pattern (RESEARCH Pattern 1) requires `$env/static/public` to always export `PUBLIC_WEB3FORMS_KEY`. `$env/static/public` throws at build if the var is undefined, so a COMMITTED empty default is mandatory. The value is public-by-design and empty, so committing it leaks nothing.

Create `.env` (committed, empty default → form ships hidden):
```dotenv
# PUBLIC (not a secret) + empty by default → the contact form ships HIDDEN and the mailto stays
# primary (ENGAGE-02). $env/static/public requires this export to exist at build time; the empty
# value keeps every build (local, CI, fresh clone) green with no form. Override via a repo Actions
# Variable or process.env to enable the live form — no code change.
PUBLIC_WEB3FORMS_KEY=""
```

Create `.env.example` (human documentation):
```dotenv
# Web3Forms access key (PUBLIC). Empty = contact form hidden, mailto primary.
# Provision (2 min, no account): submit emanrimawi@gmail.com at https://web3forms.com — the key is
# emailed to that address and only ever forwards mail to it. Set as a repo Actions VARIABLE (not a
# Secret) named PUBLIC_WEB3FORMS_KEY, or edit the committed .env, to enable the live form.
PUBLIC_WEB3FORMS_KEY=""
```

`.env` is currently ignored by `.gitignore`. Add a negation so the empty default is tracked. Append `!.env` immediately after the existing `!.env.test` line in the `# Env` group:
```
.env
.env.*
!.env.example
!.env.test
!.env
```

Then verify the default build still succeeds (the export now exists; no page imports it yet, so nothing renders — the form arrives in 06-02):
```bash
git add .env && git check-ignore .env; echo "exit=$?"   # expect exit=1 (NOT ignored)
pnpm build
```
  </action>
  <verify>
    <automated>grep -q 'PUBLIC_WEB3FORMS_KEY=""' .env && grep -q '!.env' .gitignore && ! git check-ignore -q .env && pnpm build</automated>
  </verify>
  <done>`.env` and `.env.example` exist with the empty key; `.gitignore` un-ignores `.env` (`git check-ignore .env` exits non-zero); `pnpm build` succeeds with the env present.</done>
</task>

<task type="auto">
  <name>Task 3: Add AAA-safe engagement tokens in both modes + computed contrast gate</name>
  <read_first>src/lib/styles/tokens.css, scripts/check-no-raw-hex.mjs</read_first>
  <files>src/lib/styles/tokens.css, scripts/check-token-contrast.mjs</files>
  <action>
The new form components are NOT in the `premium/` raw-hex exemption, so their error/success/border colors must be tokens. Add three tokens to BOTH mode blocks in `tokens.css`. --danger/--success are TEXT colors → target ≥7:1 (matches the axe `wcag2aaa` gate); --field-border is a non-text UI boundary (WCAG 1.4.11) → ≥3:1. Use HEX values (the contrast script parses hex).

Inside `[data-mode='accessible'] { … }` (on `--bg: #ffffff`) add:
```css
	--danger: #9a3412;
	--success: #1b5e20;
	--field-border: #565f6b;
```

Inside `[data-mode='premium'] { … }` (on `--bg: #0a0e14`) add:
```css
	--danger: #ff9d8a;
	--success: #7ee0a0;
	--field-border: #8a97a8;
```

Create `scripts/check-token-contrast.mjs` — parses each mode block, computes WCAG contrast of each token against that mode's `--bg`, and fails if a threshold is missed. If any pair fails, DARKEN (accessible) or LIGHTEN (premium) the value until it passes; the axe `wcag2aaa` run on the enabled `/contact` in 06-04 is the ultimate proof, this is the fast pre-check:
```js
// WCAG contrast gate for the Phase-6 engagement tokens (RESEARCH Pitfall 5).
// --danger/--success are text → >=7:1 (AAA); --field-border is a UI boundary → >=3:1.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/lib/styles/tokens.css', 'utf8');
const block = (mode) => {
	const m = css.match(new RegExp(`\\[data-mode='${mode}'\\]\\s*\\{([\\s\\S]*?)\\}`));
	if (!m) throw new Error(`no ${mode} block`);
	return m[1];
};
const tok = (body, name) => {
	const m = body.match(new RegExp(`--${name}:\\s*([^;]+);`));
	return m ? m[1].trim() : null;
};
const hexToRgb = (h) => {
	h = h.replace('#', '');
	if (h.length === 3) h = h.split('').map((c) => c + c).join('');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (rgb) => {
	const a = rgb.map((v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const ratio = (h1, h2) => {
	const l1 = lum(hexToRgb(h1)), l2 = lum(hexToRgb(h2));
	const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (hi + 0.05) / (lo + 0.05);
};

const fails = [];
for (const mode of ['accessible', 'premium']) {
	const b = block(mode);
	const bg = tok(b, 'bg');
	for (const [name, min] of [['danger', 7], ['success', 7], ['field-border', 3]]) {
		const val = tok(b, name);
		if (!val) { fails.push(`${mode}: --${name} missing`); continue; }
		if (!val.startsWith('#')) { fails.push(`${mode}: --${name} must be hex (got ${val})`); continue; }
		const r = ratio(val, bg);
		if (r < min) fails.push(`${mode}: --${name} (${val}) on --bg (${bg}) = ${r.toFixed(2)}:1 < ${min}:1`);
		else console.log(`OK ${mode} --${name} ${val} on ${bg} = ${r.toFixed(2)}:1 (>=${min})`);
	}
}
if (fails.length) { console.error('CONTRAST FAIL:\n' + fails.join('\n')); process.exit(1); }
console.log('CONTRAST OK: engagement tokens meet WCAG thresholds in both modes');
```

Run it and the existing raw-hex gate (tokens.css is the ONE allowed hex file, so no regression):
```bash
node scripts/check-token-contrast.mjs
pnpm test:tokens
```
  </action>
  <verify>
    <automated>node scripts/check-token-contrast.mjs && pnpm test:tokens && grep -c -- "--field-border" src/lib/styles/tokens.css</automated>
  </verify>
  <done>All three tokens exist in both mode blocks; `node scripts/check-token-contrast.mjs` prints `CONTRAST OK` (danger/success ≥7:1, field-border ≥3:1 in both modes); `pnpm test:tokens` stays green (hex only in tokens.css).</done>
</task>

</tasks>

<verification>
- `pnpm exec vitest --version` resolves (toolchain installed).
- `pnpm build` succeeds with the committed empty `.env` (inert foundation for ENGAGE-02).
- `node scripts/check-token-contrast.mjs` passes; `pnpm test:tokens` still green.
- Default suite unchanged: `pnpm test:e2e` still green (no new UI yet — this wave only adds infra, tokens, and config).
</verification>

<success_criteria>
- Committed empty `PUBLIC_WEB3FORMS_KEY` default; `.env` tracked; build green with env unset.
- vitest + enabled-Playwright + contrast configs/scripts present and self-verifying.
- --danger/--success/--field-border defined AAA-safe in both modes and gated computationally.
- No regression to any existing gate.
</success_criteria>

<output>
After completion, create `.planning/phases/06-engagement-surfaces/06-01-SUMMARY.md`.
</output>
