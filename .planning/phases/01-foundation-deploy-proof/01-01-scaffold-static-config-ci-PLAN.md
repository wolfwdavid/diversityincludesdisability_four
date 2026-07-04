---
phase: 01-foundation-deploy-proof
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - pnpm-lock.yaml
  - .nvmrc
  - .npmrc
  - svelte.config.js
  - src/routes/+layout.ts
  - src/routes/+page.svelte
  - static/.nojekyll
  - .github/workflows/deploy.yml
  - .gitignore
autonomous: true
requirements: [DEPLOY-01, DEPLOY-02, DEPLOY-03]
user_setup: []

must_haves:
  truths:
    - "Running a prod-base build (BASE_PATH=/diversityincludesdisability_four) emits build/index.html"
    - "Built index.html references _app asset URLs prefixed with /diversityincludesdisability_four/"
    - "build/ contains an empty .nojekyll and a 404.html SPA fallback"
    - "A GitHub Actions workflow builds with pnpm on Node 24 and deploys via upload-pages-artifact@v3 + deploy-pages@v4, injecting BASE_PATH from the repo name"
    - "adapter-static (not adapter-auto) is the configured adapter and pnpm-lock.yaml is committed for --frozen-lockfile CI"
  artifacts:
    - path: "svelte.config.js"
      provides: "adapter-static, fallback 404.html, paths.base from BASE_PATH, prerender fail-loud"
      contains: "adapter-static"
    - path: "src/routes/+layout.ts"
      provides: "prerender=true and trailingSlash='always'"
      contains: "prerender"
    - path: "src/routes/+page.svelte"
      provides: "hello-world proof page using base-aware link"
      contains: "$app/paths"
    - path: "static/.nojekyll"
      provides: "stops Jekyll dropping _app/ on Pages (empty, committed)"
      min_lines: 0
    - path: ".github/workflows/deploy.yml"
      provides: "pnpm build + Pages artifact deploy, BASE_PATH from repo name"
      contains: "upload-pages-artifact@v3"
    - path: "package.json"
      provides: "packageManager pnpm@11.10.0, engines node>=24, adapter-static dep"
      contains: "adapter-static"
    - path: ".nvmrc"
      provides: "Node 24 pin so CI matches local"
      contains: "24"
  key_links:
    - from: ".github/workflows/deploy.yml"
      to: "svelte.config.js paths.base"
      via: "env BASE_PATH: '/${{ github.event.repository.name }}'"
      pattern: "BASE_PATH.*github.event.repository.name"
    - from: ".github/workflows/deploy.yml"
      to: "build/ (adapter-static output)"
      via: "upload-pages-artifact path: build"
      pattern: "path:\\s*build"
    - from: "static/.nojekyll"
      to: "build/.nojekyll"
      via: "static/ copied verbatim by adapter-static"
      pattern: "\\.nojekyll"
---

<objective>
Scaffold a minimal static SvelteKit app (Svelte 5 runes, TypeScript, pnpm), configure it
for GitHub Pages under the base path `/diversityincludesdisability_four`, and author the
CI deploy workflow — then PROVE it locally by building with the production base path and
asserting the output. This is the thin vertical slice that de-risks base-path/`.nojekyll`/
404-fallback bugs on day one, before any content, mode toggle, or 3D exists.

Purpose: Every later phase builds on validated, base-path-correct static hosting. Getting
`paths.base`, `static/.nojekyll`, `fallback: '404.html'`, and the pnpm/Pages workflow right
now costs minutes; getting them wrong at launch costs a rewrite of every link.

Output: A buildable SvelteKit app whose `pnpm build` (with prod `BASE_PATH`) emits
`build/index.html`, `build/404.html`, `build/.nojekyll`, with `_app` assets prefixed by the
base path — plus a committed `.github/workflows/deploy.yml` ready for Wave 2 to trigger.

Scope guard (do NOT do here): no site content, no mode toggle, no design tokens, no Threlte/
3D, no axe/Playwright/Lighthouse toolchain. Those belong to Phases 2–5. Keep the failure
surface small.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-foundation-deploy-proof/01-RESEARCH.md
@.planning/phases/01-foundation-deploy-proof/01-VALIDATION.md
@.planning/research/STACK.md
@CLAUDE.md

<verified_pins>
<!-- From research/STACK.md, verified live against npm 2026-07-04. Do not downgrade. -->
- svelte@5.56.4  (Svelte 5 runes — never Svelte 4 export let / $: syntax)
- @sveltejs/kit@2.69.1
- @sveltejs/adapter-static@3.0.10   (REQUIRED — remove adapter-auto after scaffold)
- vite@8.1.3
- @sveltejs/vite-plugin-svelte@7.1.2 (peers vite@^8, svelte@^5.46.4)
- pnpm@11.10.0, Node 24
</verified_pins>

<environment_facts>
<!-- Verified in this repo on 2026-07-04. -->
- This directory IS `diversityincludesdisability_four/` and already contains `.git/`, `.planning/`, and `CLAUDE.md`. Scaffold must land here without destroying those.
- Default git branch is `master` (branch rename to `main` happens in Wave 2 / plan 01-02, not here).
- Repo is local-only (no remote). Remote creation + push + Pages-enable is Wave 2.
- adapter-static does NOT emit `.nojekyll` — it must be committed manually as `static/.nojekyll`.
- GitHub user/namespace is `wolfwdavid`; live URL will be https://wolfwdavid.github.io/diversityincludesdisability_four/ (proven in Wave 2).
</environment_facts>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold minimal SvelteKit app, swap to adapter-static, pin toolchain</name>
  <files>package.json, pnpm-lock.yaml, .nvmrc, .npmrc, tsconfig.json, svelte.config.js (scaffold stub, replaced in Task 2), src/app.html, src/app.d.ts, .gitignore</files>
  <read_first>
    - .planning/research/STACK.md §"Installation" and §"Version Compatibility"
    - .planning/phases/01-foundation-deploy-proof/01-RESEARCH.md §"Standard Stack" and §"Toolchain pins"
    - Existing repo root (note that .git/, .planning/, CLAUDE.md already exist here)
  </read_first>
  <action>
Scaffold a minimal TypeScript SvelteKit app IN THIS EXISTING DIRECTORY without clobbering
.git/, .planning/, or CLAUDE.md, then swap the adapter and pin the toolchain.

1. Scaffold in place (non-interactive). Primary command:
   ```
   pnpm dlx sv create . --template minimal --types ts --install pnpm
   ```
   If `sv create .` refuses because the directory is non-empty, use this robust fallback:
   ```
   pnpm dlx sv create .svktmp --template minimal --types ts --no-install
   # move scaffold contents up (including dotfiles), then remove the temp dir:
   #   cp -r .svktmp/. ./ && rm -rf .svktmp
   ```
   Keep it MINIMAL: template=minimal, types=ts. Do NOT add the Playwright/axe/Lighthouse
   add-ons here — they are installed in the a11y/launch phases to keep this deploy-proof lean.

2. Swap adapter-auto → adapter-static (pinned):
   ```
   pnpm remove @sveltejs/adapter-auto
   pnpm add -D @sveltejs/adapter-static@3.0.10
   ```

3. Pin the toolchain so CI matches local. Create `.nvmrc` containing exactly:
   ```
   24
   ```
   Create `.npmrc` containing:
   ```
   engine-strict=true
   ```
   In `package.json`, add these fields (merge, don't remove scaffold scripts):
   ```jsonc
   "packageManager": "pnpm@11.10.0",
   "engines": { "node": ">=24" }
   ```

4. Ensure `pnpm install` has run so `pnpm-lock.yaml` exists and is committed-ready
   (CI uses `--frozen-lockfile`). Confirm `.gitignore` ignores `build/`, `node_modules/`,
   `.svelte-kit/` but does NOT ignore `static/`, `.nojekyll`, or `pnpm-lock.yaml`.

Note: Task 2 fully replaces the scaffold's `svelte.config.js`; a stub here is fine.
  </action>
  <acceptance_criteria>
    - `test -f package.json && test -f pnpm-lock.yaml` — both exist
    - `grep -q '"@sveltejs/adapter-static"' package.json` — adapter-static present
    - `grep -q 'adapter-auto' package.json` returns NOTHING (adapter-auto removed)
    - `grep -q '"pnpm@11.10.0"' package.json` — packageManager pinned
    - `grep -q '"node": ">=24"' package.json` — engines pinned
    - `test "$(cat .nvmrc | tr -d '[:space:]')" = "24"` — .nvmrc is 24
    - `test -d src/routes` — SvelteKit route tree scaffolded
  </acceptance_criteria>
  <verify>
    <automated>grep -q '"@sveltejs/adapter-static"' package.json && ! grep -q 'adapter-auto' package.json && test -f pnpm-lock.yaml && test "$(cat .nvmrc | tr -d '[:space:]')" = "24"</automated>
  </verify>
  <done>Minimal TS SvelteKit app scaffolded in place; adapter-static@3.0.10 installed and adapter-auto removed; .nvmrc/.npmrc/packageManager/engines pinned; pnpm-lock.yaml present; .planning/.git/CLAUDE.md untouched.</done>
</task>

<task type="auto">
  <name>Task 2: Wire static Pages config (base path, .nojekyll, 404 fallback, hello-world) and prove build locally</name>
  <files>svelte.config.js, src/routes/+layout.ts, src/routes/+page.svelte, static/.nojekyll</files>
  <read_first>
    - .planning/phases/01-foundation-deploy-proof/01-RESEARCH.md §"Architecture Patterns" (Pattern 1/2/3), §"trailingSlash Decision", §"The Concrete Deploy Artifacts"
    - .planning/research/STACK.md §"GitHub Pages configuration"
    - svelte.config.js produced by Task 1 (about to be replaced)
  </read_first>
  <action>
Replace the scaffold config with the verified base-path-correct static config, add the
root-layout prerender directives, write the hello-world proof page using a base-aware link,
and commit the empty `static/.nojekyll`. Copy these file contents VERBATIM.

1. `svelte.config.js` — replace entirely:
   ```js
   import adapter from '@sveltejs/adapter-static';
   import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

   const dev = process.argv.includes('dev');

   /** @type {import('@sveltejs/kit').Config} */
   const config = {
     preprocess: vitePreprocess(),
     kit: {
       adapter: adapter({
         // Defaults: pages/assets => 'build'.
         fallback: '404.html'   // SPA fallback for deep links / hard refresh on Pages
       }),
       paths: {
         base: dev ? '' : (process.env.BASE_PATH ?? '')
         // relative asset URLs are the SvelteKit default (paths.relative: true) — leave on;
         // most robust fix for _app/immutable chunk 404s under a base path.
       },
       prerender: {
         entries: ['*'],
         handleHttpError: 'fail',
         handleMissingId: 'fail'
       }
     }
   };

   export default config;
   ```

2. `src/routes/+layout.ts` — create with exactly:
   ```ts
   export const prerender = true;
   export const trailingSlash = 'always';
   ```
   (trailingSlash 'always' emits `<route>/index.html`, which GitHub Pages serves
   deterministically under a subpath — see research trailingSlash Decision.)

3. `src/routes/+page.svelte` — replace the scaffold page with:
   ```svelte
   <script lang="ts">
     import { base } from '$app/paths';
   </script>

   <main>
     <h1>Diversity Includes Disability — deploy proof</h1>
     <p>If you can read this at the base path with styles intact, Phase 1 is green.</p>
     <a href="{base}/">Home (base-aware link)</a>
   </main>
   ```

4. Create the EMPTY `static/.nojekyll` and make sure it is tracked:
   ```
   # bash: touch static/.nojekyll
   # PowerShell: New-Item -ItemType File -Force static/.nojekyll
   git add -f static/.nojekyll
   ```

5. Prove the production build locally. Set BASE_PATH to the repo subpath and build:
   ```
   # bash / CI:  BASE_PATH=/diversityincludesdisability_four pnpm build
   # PowerShell: $env:BASE_PATH='/diversityincludesdisability_four'; pnpm build; Remove-Item Env:BASE_PATH
   ```
   Then assert the output (all must pass):
   ```
   test -f build/index.html
   test -f build/404.html
   test -f build/.nojekyll
   grep -R "/diversityincludesdisability_four/_app" build/index.html
   # sanity: no root-absolute _app refs (should print nothing):
   grep -REn 'src="/_app|href="/_app' build/ && echo "FAIL unprefixed _app" || echo "OK"
   ```

Anti-patterns to avoid (from research): never hardcode `/about` or `/logo.png` (use `{base}`
/ `%sveltekit.assets%`); never delete the `.nojekyll`; never deploy `.svelte-kit/` (build/ is
the output).
  </action>
  <acceptance_criteria>
    - `grep -q "adapter-static" svelte.config.js` and `grep -q "fallback: '404.html'" svelte.config.js`
    - `grep -q "process.env.BASE_PATH" svelte.config.js`
    - `grep -q "prerender = true" src/routes/+layout.ts` and `grep -q "trailingSlash = 'always'" src/routes/+layout.ts`
    - `grep -q "\$app/paths" src/routes/+page.svelte`
    - `test -f static/.nojekyll` (empty file, git-tracked)
    - After `BASE_PATH=/diversityincludesdisability_four pnpm build`: `test -f build/index.html && test -f build/404.html && test -f build/.nojekyll`
    - `grep -Rq "/diversityincludesdisability_four/_app" build/index.html` (base-prefixed assets, non-empty match)
    - `grep -REn 'src="/_app|href="/_app' build/` returns NOTHING (no root-absolute _app refs)
  </acceptance_criteria>
  <verify>
    <automated>BASE_PATH=/diversityincludesdisability_four pnpm build && test -f build/index.html && test -f build/404.html && test -f build/.nojekyll && grep -Rq "/diversityincludesdisability_four/_app" build/index.html && ! grep -REn 'src="/_app|href="/_app' build/</automated>
  </verify>
  <done>Static config wired; a prod-base build emits index.html + 404.html + .nojekyll with all _app asset URLs prefixed by /diversityincludesdisability_four/ and zero root-absolute _app refs. DEPLOY-01 and DEPLOY-02 proven locally.</done>
</task>

<task type="auto">
  <name>Task 3: Author the pnpm GitHub Pages deploy workflow</name>
  <files>.github/workflows/deploy.yml</files>
  <read_first>
    - .planning/phases/01-foundation-deploy-proof/01-RESEARCH.md §"The Concrete Deploy Artifacts" (deploy.yml) and §"State of the Art" (v3+v4 requirement)
    - .planning/research/STACK.md §"GitHub Actions — build + deploy to GitHub Pages with pnpm"
  </read_first>
  <action>
Create `.github/workflows/deploy.yml` VERBATIM. This is the artifact-flow deploy: pnpm
install (frozen lockfile), build with BASE_PATH injected from the repo name, upload `build/`
as a Pages artifact, deploy. The `branches: [main]` trigger MUST match the actual default
branch — the master→main rename is handled in plan 01-02 before first push, so leave `main`
here (do not change to master).

Action versions are locked: `upload-pages-artifact@v3` + `deploy-pages@v4` are the current
compatible pair (older pairs fail on github.com after the Dec-2024 artifacts-v4 deprecation).

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'
        run: pnpm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Do not add an a11y gate job here (deferred to Phase 5). Keep this workflow lean.
  </action>
  <acceptance_criteria>
    - `test -f .github/workflows/deploy.yml`
    - `grep -q "upload-pages-artifact@v3" .github/workflows/deploy.yml`
    - `grep -q "deploy-pages@v4" .github/workflows/deploy.yml`
    - `grep -q "pnpm install --frozen-lockfile" .github/workflows/deploy.yml`
    - `grep -q "BASE_PATH: '/\${{ github.event.repository.name }}'" .github/workflows/deploy.yml`
    - `grep -Eq "branches:\s*\[main\]" .github/workflows/deploy.yml`
    - `grep -Eq "path:\s*build" .github/workflows/deploy.yml`
    - `grep -q "node-version: 24" .github/workflows/deploy.yml`
  </acceptance_criteria>
  <verify>
    <automated>test -f .github/workflows/deploy.yml && grep -q "upload-pages-artifact@v3" .github/workflows/deploy.yml && grep -q "deploy-pages@v4" .github/workflows/deploy.yml && grep -q "github.event.repository.name" .github/workflows/deploy.yml && grep -Eq "branches:\s*\[main\]" .github/workflows/deploy.yml</automated>
  </verify>
  <done>deploy.yml exists with the v3+v4 action pair, pnpm frozen-lockfile install, Node 24, BASE_PATH injected from repo name, uploads build/, triggers on main. DEPLOY-03 workflow authored (its green run is proven in plan 01-02).</done>
</task>

</tasks>

<verification>
Full-plan gate (run after all three tasks):
1. `BASE_PATH=/diversityincludesdisability_four pnpm build` exits 0.
2. `test -f build/index.html && test -f build/404.html && test -f build/.nojekyll` — all present.
3. `grep -Rq "/diversityincludesdisability_four/_app" build/index.html` — base-prefixed assets.
4. `grep -REn 'src="/_app|href="/_app' build/` — prints nothing.
5. `.github/workflows/deploy.yml` present with upload-pages-artifact@v3 + deploy-pages@v4, branches:[main], path: build.
6. `pnpm-lock.yaml` committed (required for CI --frozen-lockfile).
</verification>

<success_criteria>
- DEPLOY-01: Fully static via adapter-static; prod-base build emits prerendered index.html with correct `paths.base`; no root-absolute internal asset refs.
- DEPLOY-02: `build/.nojekyll` and `build/404.html` both emitted from `static/.nojekyll` + `fallback: '404.html'`.
- DEPLOY-03: `.github/workflows/deploy.yml` authored — pnpm build, BASE_PATH from repo name, artifact deploy via v3+v4.
- Toolchain pinned (.nvmrc=24, packageManager pnpm@11.10.0, engines node>=24), lockfile committed.
- No content/mode/3D/a11y-toolchain added (scope held to the deploy-proof slice).
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-deploy-proof/01-01-SUMMARY.md`
recording: scaffold decisions (minimal+ts, add-ons deferred), the exact installed pins,
build-output assertions that passed, and any deviation (e.g. non-empty-dir scaffold fallback).
Note that Wave 2 (plan 01-02) still owns branch rename, remote creation, Pages enable, and
the live-URL proof.
</output>
