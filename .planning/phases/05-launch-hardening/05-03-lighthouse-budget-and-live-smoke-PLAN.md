---
phase: 05-launch-hardening
plan: 03
type: execute
wave: 2
depends_on: ["05-01"]
files_modified:
  - lighthouserc.json
  - scripts/live-smoke.mjs
  - package.json
autonomous: true
requirements: [QA-01, DEPLOY-04]

must_haves:
  truths:
    - "`lhci autorun` audits the base-less build/ and blocks on accessibility < 0.95 and seo < 0.90"
    - "`node scripts/live-smoke.mjs` exits 0 against the live Pages URL: 5 routes 200 + an _app asset 200 + SPA-404 shell + no google-fonts"
  artifacts:
    - path: "lighthouserc.json"
      provides: "Lighthouse budgets against staticDistDir build/"
      contains: "categories:accessibility"
    - path: "scripts/live-smoke.mjs"
      provides: "Live base-path smoke check (Node 24 global fetch, no dependency)"
      contains: "_app/immutable"
  key_links:
    - from: "lighthouserc.json"
      to: "build/ (base-less)"
      via: "collect.staticDistDir"
      pattern: "staticDistDir"
    - from: "scripts/live-smoke.mjs"
      to: "live Pages URL under base path"
      via: "fetch(BASE + route)"
      pattern: "fetch\\("
---

<objective>
Add the two launch-verification instruments that the CI workflow (Plan 05-04) will run:
the Lighthouse budget (QA-01, the secondary a11y/SEO/best-practices gate) and the live-URL smoke
check (DEPLOY-04). Both are authored and proven LOCALLY here — `lhci autorun` against a local
base-less build, and `live-smoke.mjs` against the CURRENT live site (already deployed through
Phase 4) — so the workflow plan only has to wire them.

Purpose: QA-01 mandates a Lighthouse budget alongside the axe suite; DEPLOY-04 mandates a real
live-URL verification, not just local preview. Depends on 05-01 so the Lighthouse SEO category
scores against real per-route meta (and to serialize the shared package.json edit).

Output: `lighthouserc.json`, `scripts/live-smoke.mjs`, and `lhci` + `smoke` package scripts.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-launch-hardening/05-RESEARCH.md
@package.json

<facts>
- lhci `staticDistDir` serves at ROOT → point it at the BASE-LESS `build/` (plain `pnpm build`, no BASE_PATH). Pointing it at a BASE_PATH build makes every asset 404 (research Pitfall 1). lhci auto-discovers the prerendered `*.html` and audits each.
- `@lhci/cli@0.15.1` installed; `pnpm exec lhci --version` → 0.15.1. Uses the runner's Chrome on ubuntu; locally uses installed Chrome/Chromium.
- Node 24.18.0 has global `fetch` — no `node-fetch` dependency.
- `relative:false` bakes ABSOLUTE, base-prefixed `_app/immutable` URLs into every prerendered page, so the smoke script can regex an absolute chunk URL out of the home HTML.
- Live URL: `https://wolfwdavid.github.io/diversityincludesdisability_four` (stable per repo; already live through Phase 4).
</facts>

<interfaces>
lighthouserc.json (verbatim from research §"lighthouserc.json"):
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "build",
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:performance": ["warn", { "minScore": 0.85 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add lighthouserc.json + lhci script and prove it locally</name>
  <read_first>
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"CI Gate (QA-01)" + Pitfall 1
    - package.json (scripts)
  </read_first>
  <action>
    1. Create `lighthouserc.json` at the repo root EXACTLY as the `<interfaces>` snippet (staticDistDir `build`,
       a11y ≥ 0.95 error, seo ≥ 0.90 error, best-practices ≥ 0.90 error, performance ≥ 0.85 warn).
    2. Add to `package.json` `scripts`: `"lhci": "lhci autorun"`.
    3. Prove locally:
       - `pnpm build` (BASE-LESS — do NOT set BASE_PATH) so `build/` assets sit at root.
       - `pnpm exec lhci autorun` → must exit 0 with accessibility ≥ 0.95 and seo ≥ 0.90.
    4. If performance dips below 0.85, leave it as `warn` (non-blocking, per research Open Question 2) — do NOT
       raise the a11y/seo floors to compensate. If accessibility or seo fails, STOP and fix the underlying
       meta/markup (do not lower the thresholds).
  </action>
  <acceptance_criteria>
    - `rg '"staticDistDir": "build"' lighthouserc.json` matches; `rg 'categories:accessibility.*0.95' lighthouserc.json` matches.
    - `rg '"lhci": "lhci autorun"' package.json` matches.
    - `pnpm build && pnpm exec lhci autorun` exits 0; console shows no failing `categories:accessibility` / `categories:seo` assertion.
  </acceptance_criteria>
  <verify>
    <automated>pnpm exec lhci autorun</automated>
  </verify>
  <done>Lighthouse budget exists, targets the base-less build/, blocks on a11y<0.95 / seo<0.90, and passes locally.</done>
</task>

<task type="auto">
  <name>Task 2: Author scripts/live-smoke.mjs + smoke script, run against the live site</name>
  <read_first>
    - .planning/phases/05-launch-hardening/05-RESEARCH.md §"Live Smoke (DEPLOY-04)"
    - package.json (scripts)
  </read_first>
  <action>
    1. Create `scripts/live-smoke.mjs` (Node 24 global fetch; base URL from argv/env with the live default):
       ```js
       // DEPLOY-04 live smoke. Node 24 global fetch — no dependency. Base URL from arg or env.
       const BASE = (process.argv[2] || process.env.SMOKE_URL ||
         'https://wolfwdavid.github.io/diversityincludesdisability_four').replace(/\/$/, '');

       const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'];
       const fails = [];
       const get = (u) => fetch(u, { redirect: 'follow' });

       for (const r of ROUTES) {
         const res = await get(BASE + r);
         if (res.status !== 200) fails.push(`route ${r} -> ${res.status}`);
       }

       const homeHtml = await (await get(BASE + '/')).text();
       if (/fonts\.(googleapis|gstatic)\.com/.test(homeHtml)) fails.push('google fonts reference found');

       const m = homeHtml.match(/\/_app\/immutable\/[^"']+\.js/);
       if (!m) fails.push('no _app/immutable chunk referenced in home html');
       else {
         const asset = await get(BASE + m[0].replace(BASE, '')); // m[0] is absolute+base-prefixed
         if (asset.status !== 200) fails.push(`asset ${m[0]} -> ${asset.status}`);
         else if (!/javascript|ecmascript/.test(asset.headers.get('content-type') || '')) fails.push(`asset ${m[0]} bad content-type`);
       }

       const spa = await get(BASE + '/definitely-not-a-real-page-xyz/');
       const spaBody = await spa.text();
       if (!/_app\/immutable|data-mode/.test(spaBody)) fails.push('SPA 404 fallback shell not served');

       if (fails.length) { console.error('SMOKE FAIL:\n' + fails.join('\n')); process.exit(1); }
       console.log('SMOKE OK: all routes 200, asset 200, SPA fallback shell, no google fonts');
       ```
       Notes: the `_app/immutable` chunk URL is already absolute+base-prefixed (thanks to `relative:false`), so
       stripping BASE re-composes it cleanly. The SPA check asserts on BODY content, not status (Pages returns
       404 status while serving the `404.html` SPA shell).
    2. Add to `package.json` `scripts`: `"smoke": "node scripts/live-smoke.mjs"`.
    3. Run `pnpm smoke` against the CURRENT live site (deployed through Phase 4). It must exit 0.
       (If the live site predates Phase-5 SEO/CSS changes, the smoke checks here — routes/asset/SPA/fonts —
       are all Phase-4-independent, so it should still pass; the Phase-5 content is re-verified post-deploy in CI.)
  </action>
  <acceptance_criteria>
    - `rg '_app/immutable' scripts/live-smoke.mjs` and `rg 'fonts\.(googleapis|gstatic)' scripts/live-smoke.mjs` match.
    - `rg '"smoke": "node scripts/live-smoke.mjs"' package.json` matches.
    - `pnpm smoke` (against the live URL) prints `SMOKE OK: all routes 200, asset 200, SPA fallback shell, no google fonts` and exits 0.
    - `node scripts/live-smoke.mjs https://wolfwdavid.github.io/diversityincludesdisability_four` exits 0 (explicit URL arg form the CI job uses).
  </acceptance_criteria>
  <verify>
    <automated>pnpm smoke</automated>
  </verify>
  <done>live-smoke.mjs verifies 5 routes 200 + an _app asset 200 + SPA-404 shell + no google-fonts against the live URL, exits 0, and is wired as `pnpm smoke`.</done>
</task>

</tasks>

<verification>
- `pnpm build && pnpm exec lhci autorun` → exits 0 (a11y ≥ 0.95, seo ≥ 0.90 as errors).
- `pnpm smoke` → `SMOKE OK …`, exits 0 against the live Pages URL.
- `rg 'lhci|smoke' package.json` shows both scripts.
</verification>

<success_criteria>
The Lighthouse budget and live smoke are authored and proven locally, ready for the CI workflow
(Plan 05-04) to run as the `verify` (lhci) and `smoke` (post-deploy) jobs.
</success_criteria>

<output>
After completion, create `.planning/phases/05-launch-hardening/05-03-SUMMARY.md`.
</output>
