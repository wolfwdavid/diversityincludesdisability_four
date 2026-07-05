---
phase: 05-launch-hardening
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - static/og-image.svg
  - static/og-image.png
  - scripts/gen-og-image.mjs
  - tests/no-flash.spec.ts
  - src/lib/components/premium/HeroScene.svelte
  - src/lib/styles/tokens.css
  - playwright.config.ts
autonomous: true
requirements: [SEO-01]

must_haves:
  truths:
    - "A 1200×630 branded OG card exists at static/og-image.png and ships to build/og-image.png"
    - "The no-flash MODE-03 test is deterministic under parallel workers (no flake), still proving data-mode is present pre-paint"
    - "The accessible home page loads NO HeroScene CSS <link>, while the premium JS code-split stays intact"
  artifacts:
    - path: "static/og-image.png"
      provides: "1200×630 social card referenced by Seo.svelte og:image"
    - path: "tests/no-flash.spec.ts"
      provides: "Deterministic MODE-03 pre-paint assertion via expect.poll + optional chaining"
    - path: "src/lib/styles/tokens.css"
      provides: ".hero-scene positioning rules (hoisted from HeroScene <style>)"
      contains: ".hero-scene"
  key_links:
    - from: "src/lib/components/premium/HeroScene.svelte"
      to: "src/lib/styles/tokens.css"
      via: "class=\"hero-scene\" (no scoped <style> → no hoisted CSS <link> on home)"
      pattern: "hero-scene"
    - from: "static/og-image.png"
      to: "Seo.svelte og:image"
      via: "${site.url}${base}/og-image.png"
      pattern: "og-image\\.png"
---

<objective>
Deliver the OG image asset (completes SEO-01 alongside Plan 05-01) and land the two carried-over
local fixes that must be green before the CI verify gate is wired: the no-flash flake (Follow-up 2)
and the HeroScene eager-CSS leak (Follow-up 3). All three are locally verifiable and touch files
disjoint from Plan 05-01, so this runs in parallel.

Purpose: (1) social validators need a real 1200×630 card at an absolute URL; (2) the CI `verify`
job runs the full e2e suite under CI worker contention — the no-flash test MUST be deterministic
or it will red the gate; (3) the accessible critical path should not fetch premium scene CSS.

Output: `static/og-image.{svg,png}`, a reproducible generator script, a deterministic
`no-flash.spec.ts`, HeroScene CSS hoisted into `tokens.css`, and a CI worker cap.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-launch-hardening/05-RESEARCH.md
@tests/no-flash.spec.ts
@src/lib/components/premium/HeroScene.svelte
@playwright.config.ts

<facts>
- `data-mode` is written ONLY by the synchronous inline `<head>` script in app.html (pre-paint). The mode store merely READS it on init; it only rewrites on an explicit user toggle (which never fires in the no-flash test). So polling for `data-mode` still proves pre-paint origin — the fix cannot create a false positive (research Follow-up 2).
- `scripts/check-no-raw-hex.mjs` walks ONLY `src/` — `static/og-image.svg` is exempt, so it may use literal brand hex values (they should MATCH the token values below).
- Accessible-mode token colors (tokens.css): `--bg #ffffff`, `--text #111111`, `--primary #0a4e8b`, `--accent #9a3412`, `--on-primary #ffffff`. Use these exact values in the SVG so the card is on-brand.
- HeroScene.svelte scoped `<style>` (`.scene { position:absolute; inset:0; pointer-events:none } .scene :global(canvas){width/height:100%}`) is what SvelteKit hoists as a `<link>` on the prerendered home page. The JS split (PremiumHero → `import('./HeroScene.svelte')`) is separate and must stay intact — `scripts/check-3d-boundary.mjs` proves it.
- `playwright.config.ts` currently has no `workers` override; `fullyParallel: true`.
</facts>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author og-image.svg (1200×630) and rasterize to og-image.png</name>
  <read_first>
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"OG Image"
    - src/lib/styles/tokens.css (brand color values to reuse)
  </read_first>
  <action>
    1. Create `static/og-image.svg` — a 1200×630 (viewBox="0 0 1200 630") text-forward branded card using the token colors verbatim:
       - Background `#ffffff`; a solid brand band or left rule in `#0a4e8b`; wordmark "Diversity Includes Disability" in `#111111` (bold, ~72px, font-family Lexend, system-ui fallback); tagline / subhead line drawn from `site.tagline` in `#404a56`; a small accent element in `#9a3412`.
       - No external fonts/images (self-contained SVG; system-ui fallback is fine — this rasterizes once).
       - Invent no claims: only the org name + tagline (verified facts) appear as text.
    2. Create `scripts/gen-og-image.mjs` (reproducible one-off rasterizer using the already-installed Playwright chromium — no new dependency):
       ```js
       import { chromium } from '@playwright/test';
       import { readFileSync } from 'node:fs';

       const svg = readFileSync('static/og-image.svg', 'utf8');
       const browser = await chromium.launch();
       const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
       await page.setContent(`<!doctype html><style>*{margin:0;padding:0}</style>${svg}`, { waitUntil: 'networkidle' });
       await page.screenshot({ path: 'static/og-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
       await browser.close();
       console.log('wrote static/og-image.png (1200x630)');
       ```
    3. Run `node scripts/gen-og-image.mjs` to produce `static/og-image.png`. Commit BOTH the svg source and the png.
    4. Confirm it ships: `pnpm build` then check `build/og-image.png` exists (adapter-static copies `static/` to `build/`).
  </action>
  <acceptance_criteria>
    - `static/og-image.png` exists; `node -e "const s=require('node:fs').statSync('static/og-image.png'); if(s.size<2000) process.exit(1)"` exits 0 (non-trivial PNG).
    - PNG is 1200×630: `node -e "const b=require('node:fs').readFileSync('static/og-image.png'); const w=b.readUInt32BE(16), h=b.readUInt32BE(20); if(w!==1200||h!==630){console.error(w+'x'+h);process.exit(1)}"` exits 0.
    - `rg '#0a4e8b|#111111' static/og-image.svg` matches (token colors reused).
    - After `pnpm build`, `build/og-image.png` exists.
    - `pnpm test:tokens` still passes (og-image.svg lives in static/, outside the raw-hex walk).
  </acceptance_criteria>
  <verify>
    <automated>node scripts/gen-og-image.mjs</automated>
  </verify>
  <done>A committed 1200×630 branded PNG (with reproducible SVG source + generator) exists in static/ and copies to build/.</done>
</task>

<task type="auto">
  <name>Task 2: Make no-flash MODE-03 deterministic (Follow-up 2)</name>
  <read_first>
    - tests/no-flash.spec.ts (the one-shot page.evaluate that flakes)
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"Follow-up 2: no-flash Flake"
  </read_first>
  <action>
    Replace ONLY the MODE-03 test body in `tests/no-flash.spec.ts` with the `expect.poll` + optional-chaining
    form (keep `waitUntil: 'commit'` — do NOT relax it; keep the second "no Google Fonts" test unchanged):
    ```ts
    test('mode applied before hydration (no flash) — MODE-03', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
      await page.goto('/', { waitUntil: 'commit' });
      // data-mode is written ONLY by the synchronous inline <head> script (pre-paint); the store
      // merely reads it. Polling therefore still proves pre-paint origin — no later code path can
      // satisfy it. `?.` tolerates the transient-null documentElement race that flaked the old
      // one-shot page.evaluate() under parallel-worker contention.
      await expect
        .poll(() => page.evaluate(() => document.documentElement?.dataset.mode ?? null), {
          timeout: 5_000
        })
        .toBe('premium');
    });
    ```
  </action>
  <acceptance_criteria>
    - `rg 'expect\s*\.\s*poll' tests/no-flash.spec.ts` matches; `rg "document.documentElement\?\." tests/no-flash.spec.ts` matches.
    - `rg "waitUntil: 'commit'" tests/no-flash.spec.ts` still matches (pre-paint meaning preserved).
    - `rg "waitUntil: 'load'|networkidle" tests/no-flash.spec.ts` returns ONLY the second test's line (MODE-03 not weakened).
    - `pnpm exec playwright test tests/no-flash.spec.ts --workers=4` passes (repeat 3× to confirm no flake).
  </acceptance_criteria>
  <verify>
    <automated>pnpm exec playwright test tests/no-flash.spec.ts --workers=4</automated>
  </verify>
  <done>MODE-03 asserts data-mode pre-paint via polling; deterministic under 4 workers; the guarantee is not weakened.</done>
</task>

<task type="auto">
  <name>Task 3: Hoist HeroScene CSS into tokens.css + cap CI workers (Follow-up 3)</name>
  <read_first>
    - src/lib/components/premium/HeroScene.svelte (the scoped <style> to delete)
    - src/lib/styles/tokens.css (always-loaded target layer)
    - scripts/check-3d-boundary.mjs (must stay green)
    - playwright.config.ts
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"Follow-up 3: HeroScene CSS Hoist" (Option 3a)
  </read_first>
  <action>
    1. In `src/lib/components/premium/HeroScene.svelte`: change the wrapper `<div class="scene" aria-hidden="true">`
       to `<div class="hero-scene" aria-hidden="true">` and DELETE the entire `<style> … </style>` block.
    2. Append to `src/lib/styles/tokens.css` (global, unscoped — so `:global(canvas)` becomes a plain descendant selector):
       ```css
       /* HeroScene wrapper — hoisted from the premium scene's scoped <style> so no HeroScene CSS
          <link> loads on the accessible home critical path (JS code-split unaffected). */
       .hero-scene {
       	position: absolute;
       	inset: 0;
       	pointer-events: none; /* decorative — never captures pointer/AT, never in tab order */
       }
       .hero-scene canvas {
       	width: 100%;
       	height: 100%;
       }
       ```
    3. In `playwright.config.ts`, add to the `defineConfig({ … })` object (belt-and-suspenders CI stability per research §"Playwright / CI worker stability"):
       ```ts
       workers: process.env.CI ? 2 : undefined,
       ```
    4. Verify the leak is gone and the JS split is intact:
       - `pnpm build`
       - `build/index.html` must contain NO stylesheet `<link>` for a HeroScene chunk.
       - `pnpm test:split` (check-3d-boundary) still prints OK.
  </action>
  <acceptance_criteria>
    - `rg '<style>' src/lib/components/premium/HeroScene.svelte` returns NOTHING (scoped style deleted).
    - `rg 'class="hero-scene"' src/lib/components/premium/HeroScene.svelte` matches.
    - `rg '\.hero-scene' src/lib/styles/tokens.css` matches both rules.
    - After `pnpm build`: `node -e "const h=require('node:fs').readFileSync('build/index.html','utf8'); if(/HeroScene[^\"']*\.css/.test(h)){console.error('HeroScene CSS link still present');process.exit(1)} console.log('no HeroScene css link')"` exits 0.
    - `pnpm test:split` exits 0 (`OK: … premium chunk(s) split out; home bundle is WebGL-free`).
    - `rg 'workers: process.env.CI' playwright.config.ts` matches.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test:split</automated>
  </verify>
  <done>HeroScene emits no CSS chunk; home HTML has no HeroScene CSS <link>; the three/@threlte JS split stays proven; CI workers capped at 2.</done>
</task>

</tasks>

<verification>
- `node scripts/gen-og-image.mjs` produces a 1200×630 `static/og-image.png`; `build/og-image.png` present after build.
- `pnpm exec playwright test tests/no-flash.spec.ts --workers=4` green ×3.
- `pnpm build` then no HeroScene CSS `<link>` in `build/index.html`; `pnpm test:split` OK.
- Regression: `pnpm test:tokens`, `pnpm exec playwright test tests/premium-3d.spec.ts` still pass (premium hero still renders).
</verification>

<success_criteria>
OG card asset shipped; no-flash deterministic under parallel workers without weakening its pre-paint
guarantee; accessible home no longer loads HeroScene CSS while the WebGL JS boundary remains proven.
</success_criteria>

<output>
After completion, create `.planning/phases/05-launch-hardening/05-02-SUMMARY.md`.
</output>
