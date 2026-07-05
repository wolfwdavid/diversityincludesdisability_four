---
phase: 04-premium-3d-needs-research
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - scripts/check-no-raw-hex.mjs
  - scripts/check-3d-boundary.mjs
  - src/lib/a11y/prefers.svelte.ts
  - tests/premium-3d.spec.ts
autonomous: true
requirements: [PREM-01, PREM-02, PREM-04]

must_haves:
  truths:
    - "three@0.185.1 + @threlte/core@8.5.16 are installed at exact pinned versions; @threlte/extras is NOT installed"
    - "A build-grep gate (scripts/check-3d-boundary.mjs) can prove zero three/@threlte in the Accessible/home critical bundle and ≥1 separate premium chunk exists"
    - "A reactive prefersReducedMotion rune + synchronous webglSupported() feature-detect exist and are browser-guarded"
    - "tests/premium-3d.spec.ts encodes canvas-gating, aria-hidden, reduced-motion-poster, dispose-loop, and context-loss expectations (RED until the scene ships)"
    - "The raw-hex gate no longer scans src/lib/components/premium/ (quarantined scene files may use token-derived three.Color hex constants)"
  artifacts:
    - path: "scripts/check-3d-boundary.mjs"
      provides: "PREM-02 build-grep bundle boundary proof"
      contains: "build/_app/immutable"
    - path: "src/lib/a11y/prefers.svelte.ts"
      provides: "prefersReducedMotion rune + webglSupported() detect"
      exports: ["prefersReducedMotion", "webglSupported"]
    - path: "tests/premium-3d.spec.ts"
      provides: "PREM-01/02/04 runtime e2e assertions"
      min_lines: 60
    - path: "package.json"
      provides: "pinned 3D deps + test:split script wired into test chain"
      contains: "@threlte/core"
  key_links:
    - from: "package.json test script"
      to: "scripts/check-3d-boundary.mjs"
      via: "test:split invoked after build"
      pattern: "check-3d-boundary"
    - from: "src/lib/a11y/prefers.svelte.ts"
      to: "$app/environment browser guard"
      via: "import { browser }"
      pattern: "if \\(!browser\\) return"
---

<objective>
Stand up the Phase-4 boundary harness BEFORE any WebGL exists: install the pinned 3D
dependencies inside a code-split-ready project, author the machine-verifiable bundle-boundary
gate (the primary PREM-02 proof), add the reactive reduced-motion / WebGL-support gating
helpers, and commit the RED Playwright spec that every later task drives green.

Purpose: The load-bearing requirement (PREM-02: zero WebGL in the Accessible bundle) is only
provable with a build-grep gate. Authoring the gate + specs first (RED) makes the whole phase
test-driven — the scene is only "done" when these turn green.
Output: pinned deps, scripts/check-3d-boundary.mjs, src/lib/a11y/prefers.svelte.ts,
tests/premium-3d.spec.ts, raw-hex gate updated to exempt the premium/ quarantine folder.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-premium-3d-needs-research/04-RESEARCH.md
@.planning/phases/04-premium-3d-needs-research/04-VALIDATION.md

<interfaces>
<!-- Contracts the executor needs. Use directly — no codebase exploration required. -->

Mode store — src/lib/stores/mode.svelte.ts (already exists, do NOT modify):
```ts
export type Mode = 'accessible' | 'premium';
export const mode; // mode.current: 'accessible' | 'premium'  (Svelte 5 rune)
```

Existing test harness conventions (from tests/a11y.spec.ts, tests/mode-toggle.spec.ts):
- Seed mode: `await page.addInitScript((m) => localStorage.setItem('did-mode', m), 'premium');`
- Wait for hydration: `await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');`
- Mode reflected on: `html[data-mode="accessible"|"premium"]`
- Routes carry a trailing slash (trailingSlash: 'always') → About is `/about/`.
- Playwright default reducedMotion is 'no-preference'; pin it per-test with
  `await page.emulateMedia({ reducedMotion: 'reduce' | 'no-preference' })`.
- webServer builds+previews the production adapter-static artifact (playwright.config.ts).

Existing raw-hex gate — scripts/check-no-raw-hex.mjs:
```js
const ALLOW = ['src/lib/styles/tokens.css'];
// walks src/, flags #RGB/#RRGGBB/#RRGGBBAA in .svelte + .css unless path is in ALLOW
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install pinned 3D deps, wire test:split, exempt premium/ from the raw-hex gate</name>
  <read_first>
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Standard Stack — exact versions; §Concrete File List — package.json changes)
    - package.json (existing scripts block + deps)
    - scripts/check-no-raw-hex.mjs (existing ALLOW logic)
  </read_first>
  <files>package.json, scripts/check-no-raw-hex.mjs</files>
  <action>
    1. Install the pinned 3D layer with pnpm (project convention — NEVER npm). Do NOT install
       @threlte/extras (avoids OrbitControls focus-trap + chunk bloat, per research):
       ```bash
       pnpm add three@0.185.1 @threlte/core@8.5.16
       pnpm add -D @types/three@0.185.0
       ```
       three + @threlte/core are runtime deps (they load in the premium chunk at runtime);
       @types/three is dev-only. Confirm package.json now pins exactly 0.185.1 / 8.5.16 / 0.185.0.

    2. Add a "test:split" script and wire it into the aggregate "test" script AFTER "build"
       (the gate greps the built output, so it must run post-build). Edit package.json scripts:
       ```json
       "test:split": "node scripts/check-3d-boundary.mjs",
       "test": "pnpm check && pnpm lint && pnpm test:tokens && pnpm test:content && pnpm build && pnpm test:split && pnpm test:review && pnpm test:e2e"
       ```
       (Insert `pnpm test:split` immediately after `pnpm build` in the existing chain.)

    3. Exempt the premium/ quarantine folder from the raw-hex gate. Scene files legitimately need
       token-derived three.Color hex constants (e.g. #6FB4FF / #FF9E5E) and are code-split OUT of
       the Accessible bundle, so the accessible raw-hex contract does not apply to them. In
       scripts/check-no-raw-hex.mjs add a directory allow-list and skip it in walk():
       ```js
       const ALLOW = ['src/lib/styles/tokens.css'];
       const ALLOW_DIRS = ['src/lib/components/premium/']; // quarantined WebGL scene — code-split out of Accessible bundle
       // ...inside walk(), before the EXT check:
       if (ALLOW_DIRS.some((d) => p.startsWith(d))) continue;
       ```
       Keep the existing tokens.css ALLOW behavior untouched.
  </action>
  <acceptance_criteria>
    - `node -e "const p=require('./package.json'); const d={...p.dependencies,...p.devDependencies}; if(d.three!=='0.185.1'||d['@threlte/core']!=='8.5.16'||d['@types/three']!=='0.185.0'){process.exit(1)}; if(d['@threlte/extras']){console.error('extras must NOT be installed');process.exit(1)}"` exits 0
    - `grep -q "\"test:split\": \"node scripts/check-3d-boundary.mjs\"" package.json` matches
    - `grep -q "pnpm build && pnpm test:split" package.json` matches
    - `grep -q "src/lib/components/premium/" scripts/check-no-raw-hex.mjs` matches
    - `pnpm test:tokens` (existing raw-hex gate) still exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm test:tokens</automated>
  </verify>
  <done>three@0.185.1 + @threlte/core@8.5.16 + @types/three@0.185.0 pinned, extras absent, test:split wired after build, premium/ exempt from raw-hex gate, existing token gate still green.</done>
</task>

<task type="auto">
  <name>Task 2: Reactive reduced-motion + synchronous WebGL feature-detect helper</name>
  <read_first>
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Reduced-Motion, WebGL-Support & Fallback — verbatim rune module)
    - src/lib/stores/mode.svelte.ts (rune-class pattern + browser guard style to mirror)
  </read_first>
  <files>src/lib/a11y/prefers.svelte.ts</files>
  <action>
    Create src/lib/a11y/prefers.svelte.ts EXACTLY as researched — a browser-guarded reactive
    reduced-motion rune plus a cheap synchronous WebGL detect that runs BEFORE any three import
    (so we never download ~150KB just to fail). Verbatim:
    ```ts
    import { browser } from '$app/environment';

    class PrefersReducedMotion {
      current = $state(false);
      constructor() {
        if (!browser) return;
        const mq = matchMedia('(prefers-reduced-motion: reduce)');
        this.current = mq.matches;
        mq.addEventListener('change', (e) => (this.current = e.matches)); // mid-session OS toggle respected
      }
    }
    export const prefersReducedMotion = new PrefersReducedMotion();

    // Cheap synchronous WebGL feature-detect BEFORE importing three (avoid loading 150KB to fail).
    let _webgl: boolean | null = null;
    export function webglSupported(): boolean {
      if (!browser) return false;
      if (_webgl !== null) return _webgl;
      try {
        const c = document.createElement('canvas');
        _webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch {
        _webgl = false;
      }
      return _webgl;
    }
    ```
    This file imports ONLY $app/environment — it must never import three/@threlte (it is reached
    by the three-free boundary in the Accessible graph).
  </action>
  <acceptance_criteria>
    - `grep -q "export const prefersReducedMotion" src/lib/a11y/prefers.svelte.ts` matches
    - `grep -q "export function webglSupported" src/lib/a11y/prefers.svelte.ts` matches
    - `grep -q "if (!browser) return" src/lib/a11y/prefers.svelte.ts` matches
    - `! grep -Eq "three|@threlte" src/lib/a11y/prefers.svelte.ts` (helper is WebGL-free)
    - `pnpm check` (svelte-check) exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>prefers.svelte.ts exports a reactive prefersReducedMotion rune (live OS toggle) + memoized webglSupported(), browser-guarded, zero three imports, type-clean.</done>
</task>

<task type="auto">
  <name>Task 3: Bundle-boundary gate script + RED premium e2e spec</name>
  <read_first>
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Validation Architecture — check-premium-split.mjs blueprint + the four test blueprints)
    - .planning/phases/04-premium-3d-needs-research/04-VALIDATION.md (Per-Requirement Verification Map — the exact assertions)
    - tests/a11y.spec.ts (axe + withTags convention to reuse for the premium axe regression)
  </read_first>
  <files>scripts/check-3d-boundary.mjs, tests/premium-3d.spec.ts</files>
  <action>
    A) Create scripts/check-3d-boundary.mjs — the PREM-02 build-grep proof. After a build it (1)
    finds every premium chunk that contains three/@threlte and asserts ≥1 exists, then (2) parses
    the prerendered Accessible entry (build/index.html = Home) and asserts NONE of the chunks it
    references (modulepreload / module scripts) is a premium chunk. Exit non-zero on leak:
    ```js
    import { readFileSync, readdirSync } from 'node:fs';
    import { join } from 'node:path';

    const DIR = 'build/_app/immutable';
    const MARK = /@threlte|WebGLRenderer|three\.module/;

    const js = [];
    (function walk(d) {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        e.isDirectory() ? walk(p) : e.name.endsWith('.js') && js.push(p);
      }
    })(DIR);

    const premium = js.filter((f) => MARK.test(readFileSync(f, 'utf8')));
    if (premium.length === 0) {
      console.error('FAIL: no three/@threlte chunk found — split missing or scene not built');
      process.exit(1);
    }

    // build/index.html is the prerendered Accessible entry (Home). Collect the chunks it
    // preloads/loads and assert none is a premium chunk (three not in the critical path).
    const home = readFileSync('build/index.html', 'utf8');
    const referenced = [...home.matchAll(/_app\/immutable\/[^"']+\.js/g)].map((m) => m[0]);
    const leaked = referenced.filter((r) =>
      premium.some((p) => p.replace(/\\/g, '/').endsWith(r))
    );
    if (leaked.length) {
      console.error('FAIL: three/@threlte reachable from home critical bundle:\n' + leaked.join('\n'));
      process.exit(1);
    }
    console.log(`OK: ${premium.length} premium chunk(s) split out; home bundle is WebGL-free`);
    ```
    NOTE: this gate is expected to FAIL now (RED) because no scene chunk exists yet — that is
    correct. It goes GREEN in Plan 04-03 once the scene ships.

    B) Create tests/premium-3d.spec.ts consolidating every runtime assertion from the VALIDATION
    map (canvas-gating, aria-hidden/decorative, reduced-motion poster, PREM-02 network, dispose
    loop, context-loss fallback, axe-clean-in-premium). Author them GREEN-shaped (they RED now,
    pass once the scene exists). Use the harness conventions (seed did-mode, wait data-hydrated):
    ```ts
    import { test, expect } from '@playwright/test';
    import AxeBuilder from '@axe-core/playwright';

    const seed = (page, m) => page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);

    test('PREM-01/03 accessible mode: no canvas, poster present', async ({ page }) => {
      await seed(page, 'accessible');
      await page.goto('/');
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.locator('.hero__poster')).toBeVisible();
    });

    test('PREM-01/03 premium + reduced-motion: poster, still no canvas (SC-1)', async ({ page }) => {
      await seed(page, 'premium');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(page.locator('.hero__poster')).toBeVisible();
    });

    test('PREM-01 premium + motion: canvas mounts, decorative, axe clean', async ({ page }) => {
      await seed(page, 'premium');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
      // decorative: the canvas (or its wrapper) is aria-hidden and never in the tab order
      await expect(page.locator('[aria-hidden="true"] canvas, canvas[aria-hidden="true"]')).toHaveCount(1);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations).toEqual([]);
    });

    test('PREM-02 accessible mode downloads zero three chunks', async ({ page }) => {
      const bodies: string[] = [];
      page.on('response', async (r) => {
        if (r.url().endsWith('.js')) bodies.push(await r.text().catch(() => ''));
      });
      await seed(page, 'accessible');
      await page.goto('/', { waitUntil: 'networkidle' });
      await expect(page.locator('canvas')).toHaveCount(0);
      expect(bodies.some((b) => /@threlte|THREE\.WebGLRenderer/.test(b))).toBe(false);
    });

    test('PREM-02 premium+motion downloads a three chunk and mounts a canvas', async ({ page }) => {
      const bodies: string[] = [];
      page.on('response', async (r) => {
        if (r.url().endsWith('.js')) bodies.push(await r.text().catch(() => ''));
      });
      await seed(page, 'premium');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      await expect(page.locator('canvas')).toBeVisible();
      expect(bodies.some((b) => /@threlte|THREE\.WebGLRenderer/.test(b))).toBe(true);
    });

    test('PREM-04 nav away/back x15 disposes cleanly — no WebGL context leak', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (/too many active webgl|context lost/i.test(m.text())) errors.push(m.text());
      });
      await seed(page, 'premium');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
      for (let i = 0; i < 15; i++) {
        await expect(page.locator('canvas')).toBeVisible();
        await page.getByRole('link', { name: /about/i }).first().click();
        await expect(page).toHaveURL(/\/about\/?$/);
        await expect(page.locator('canvas')).toHaveCount(0);
        await page.goBack();
      }
      expect(errors).toEqual([]);
    });

    test('PREM-04 forced context loss -> poster fallback, no crash, content intact', async ({ page }) => {
      await seed(page, 'premium');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto('/');
      await expect(page.locator('canvas')).toBeVisible();
      await page.evaluate(() => {
        const c = document.querySelector('canvas') as HTMLCanvasElement;
        (c.getContext('webgl2') || c.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext();
      });
      await expect(page.locator('.hero__poster')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    });
    ```
    Do NOT run the full e2e suite to green in this plan — these are RED scaffolding. Only confirm
    the files type-check / lint. Green is Plan 04-03's job.
  </action>
  <acceptance_criteria>
    - `test -f scripts/check-3d-boundary.mjs && test -f tests/premium-3d.spec.ts` (both exist)
    - `grep -q "build/_app/immutable" scripts/check-3d-boundary.mjs` matches
    - `grep -c "^test(" tests/premium-3d.spec.ts` returns ≥ 7
    - `grep -q "emulateMedia({ reducedMotion: 'reduce' })" tests/premium-3d.spec.ts` matches
    - `grep -q "WEBGL_lose_context" tests/premium-3d.spec.ts` matches
    - `pnpm exec tsc --noEmit -p tsconfig.json` OR `pnpm lint` passes on the new spec (no type/lint errors)
    - `node scripts/check-3d-boundary.mjs` currently EXITS NON-ZERO with "no three/@threlte chunk found" (RED is correct — scene not built yet)
  </acceptance_criteria>
  <verify>
    <automated>pnpm lint</automated>
  </verify>
  <done>Bundle-boundary gate + consolidated premium-3d spec authored and lint/type-clean; the gate + spec are intentionally RED (no scene yet) and become the drive-green target for 04-02/04-03.</done>
</task>

</tasks>

<verification>
- pnpm test:tokens green (raw-hex gate still passes, premium/ now exempt).
- pnpm check + pnpm lint green (helper + spec type/lint clean).
- Deps pinned exactly; @threlte/extras absent.
- scripts/check-3d-boundary.mjs runs and RED-fails with the "no three/@threlte chunk" message (expected pre-scene).
</verification>

<success_criteria>
- three@0.185.1 + @threlte/core@8.5.16 + @types/three@0.185.0 installed; extras NOT installed.
- test:split wired into the aggregate test script after build.
- src/lib/a11y/prefers.svelte.ts exports prefersReducedMotion (reactive) + webglSupported(), WebGL-free.
- scripts/check-3d-boundary.mjs implements the two-part bundle proof (premium chunk exists + home critical path clean).
- tests/premium-3d.spec.ts encodes all PREM-01/02/04 runtime assertions (≥7 tests), RED until the scene ships.
- Raw-hex gate exempts src/lib/components/premium/.
</success_criteria>

<output>
After completion, create `.planning/phases/04-premium-3d-needs-research/04-01-SUMMARY.md`.
</output>
