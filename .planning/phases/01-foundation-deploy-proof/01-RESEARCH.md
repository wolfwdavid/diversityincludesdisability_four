# Phase 1: Foundation & Deploy Proof - Research

**Researched:** 2026-07-04
**Domain:** Static SvelteKit (adapter-static) deploy to GitHub Pages under base path `/diversityincludesdisability_four`, proven live
**Confidence:** HIGH (stack pins verified live against npm 2026-07-04 in STACK.md; base-path/`.nojekyll`/404-fallback config verified against svelte.dev; `gh` Pages API + Pages-actions versions re-verified today)

## Summary

This phase does exactly one thing and proves it: scaffold a static SvelteKit app and get a hello-world **live on the real GitHub Pages URL** — `https://wolfwdavid.github.io/diversityincludesdisability_four/` — with the base path, `.nojekyll`, SPA `404.html` fallback, and pnpm-based GitHub Actions deploy all validated **before any content, mode system, or 3D is built on top**. The entire value of Phase 1 is that base-path and Pages-hosting bugs (the #1 way SvelteKit-on-Pages ships broken) are found on day one, when they cost minutes, instead of at launch when they cost a frantic rewrite of every link.

The technical surface is small and fully understood: two config files (`svelte.config.js`, `src/routes/+layout.ts`), one empty static file (`static/.nojekyll`), one Actions workflow (`.github/workflows/deploy.yml`), plus the project-family pins (pnpm 11.10.0, Node 24). Everything here is copied and made concrete from the already-verified `research/STACK.md`. The only genuinely new work versus that research is (a) picking and justifying a `trailingSlash` policy, (b) the exact `gh` CLI sequence to create the remote and enable Pages with the **GitHub Actions** source, and (c) reconciling the **`master` vs `main`** branch mismatch that will otherwise cause the workflow to never trigger.

**Primary recommendation:** Scaffold with `sv create` (minimal + TS + ESLint + Prettier + Playwright), swap to `adapter-static`, wire the exact `svelte.config.js`/`+layout.ts`/`.nojekyll`/`deploy.yml` below, **rename the local branch `master` → `main` before first push** so it matches the workflow trigger, create the repo under `wolfwdavid` with `gh`, enable Pages with `build_type=workflow`, push, then verify the live URL with the concrete curl/grep checks in Validation Architecture. Use `trailingSlash: 'always'`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **DEPLOY-01** | Fully static via `adapter-static`, all routes prerendered, correct `paths.base` for `/diversityincludesdisability_four` | `svelte.config.js` (adapter-static + `paths.base` from `BASE_PATH`), `src/routes/+layout.ts` (`prerender = true`), `prerender.entries: ['*']`. Verified config from STACK.md §"GitHub Pages configuration". |
| **DEPLOY-02** | Artifacts include `static/.nojekyll` and a `404.html` SPA fallback so `_app/` and deep links resolve on Pages | `adapter({ fallback: '404.html' })` emits `build/404.html`; `static/.nojekyll` (empty, committed) copied verbatim to `build/`. adapter-static does **not** emit `.nojekyll` — must be committed manually. |
| **DEPLOY-03** | GitHub Actions workflow builds with pnpm and deploys via `upload-pages-artifact` + `deploy-pages`, injecting `BASE_PATH` from repo name | `.github/workflows/deploy.yml` below — `pnpm/action-setup@v4`, `setup-node@v4` (node 24, `cache: pnpm`), `BASE_PATH: '/${{ github.event.repository.name }}'`, `upload-pages-artifact@v3` → `deploy-pages@v4`. |

> DEPLOY-04 (live-under-base-path verification) is formally mapped to Phase 5 in REQUIREMENTS.md, but this phase's whole point is an early **deploy proof**. Treat the Validation Architecture checks below as the Phase-1 acceptance gate; Phase 5 re-verifies against finished content.
</phase_requirements>

## Environment Reality (must address in the plan)

These are concrete, verified facts about *this* repo as it stands on 2026-07-04. The planner must turn each into an explicit task.

| Fact | Verified how | Consequence for the plan |
|------|--------------|--------------------------|
| **Repo is local-only** — `git remote -v` returns nothing | ran in repo root | A task must create the GitHub remote (`gh repo create wolfwdavid/…`) before any deploy can happen. Deploy proof is impossible until then. |
| **Default branch is `master`, not `main`** — `git branch` shows `* master` | ran in repo root | The workflow triggers on `push: branches:[main]`. If left as `master`, the workflow **never runs** and there is no deploy. Fix: rename `master`→`main` before first push (recommended), OR trigger on `master`. Pick one; do not leave them mismatched. |
| **GitHub user is `wolfwdavid`** (NOT the HF handle `WolfDavid`) | project memory + convention | Repo path is `wolfwdavid/diversityincludesdisability_four`; live URL is `https://wolfwdavid.github.io/diversityincludesdisability_four/`. |
| **Pages source must be "GitHub Actions"** not "Deploy from a branch" | svelte.dev + GitHub docs | Set once via API: `gh api -X PUT /repos/wolfwdavid/diversityincludesdisability_four/pages -f build_type=workflow`. May require the user's authenticated `gh` (see gotcha below). |
| **adapter-static does NOT emit `.nojekyll`** | svelte.dev adapter-static guide | `static/.nojekyll` must be created and committed manually, or Jekyll silently drops `_app/` and the whole site 404s its own JS/CSS. |
| **pnpm 11.10.0 / Node 24 locally** | STACK.md (verified) | Pin `packageManager` + `engines` + `.nvmrc` so CI matches local. |

**`gh` auth gotcha:** `gh repo create`, `git push`, and the Pages-enable API call all require an authenticated `gh` with `repo` + `workflow` scopes for `wolfwdavid`. If the agent's `gh` is not logged in as `wolfwdavid`, these steps hand off to the user. The plan should treat "create remote + enable Pages" as a discrete, possibly-human step, and everything after it (verify live URL) as gated on it succeeding. Check first with `gh auth status`.

## Standard Stack

Only the packages this phase actually needs to produce a deployable hello-world. The full toolchain (Threlte, axe, Lighthouse, motion) is installed in later phases — do **not** front-load it here; a lean Phase 1 keeps the deploy proof fast and the failure surface small.

### Core (required this phase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | `5.56.4` | UI framework | Svelte 5 runes; current stable. Installed by `sv create`. |
| @sveltejs/kit | `2.69.1` | App framework / router | Current SvelteKit 2; `$app/paths` is base-path aware. |
| @sveltejs/adapter-static | `3.0.10` | Static site generation | **Required** for Pages. Prerenders routes + SPA `fallback`. Replaces adapter-auto. |
| vite | `8.1.3` | Build tool | SvelteKit's bundler (installed by scaffold). |
| @sveltejs/vite-plugin-svelte | `7.1.2` | Svelte↔Vite | Installed transitively; peers `vite@^8`, `svelte@^5.46.4`. |
| typescript | `~5.x` | Type safety | `<script lang="ts">` + `svelte-check`. |
| pnpm | `11.10.0` | Package manager | Project convention; pin via `packageManager`. |

### Supporting (dev, useful in CI even at Phase 1)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| svelte-check | `4.7.1` | Type/a11y diagnostics | Optional CI gate before build; cheap sanity check. |
| cross-env | `^10` (or `^7`) | Set `BASE_PATH` in an npm script portably | Only if you want a **local** prod-base build script that works in PowerShell *and* bash (Windows env-var gotcha). CI (Linux) doesn't need it. Verify latest: `pnpm view cross-env version`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `adapter-static` | `adapter-auto` | Never here — adapter-auto targets serverless hosts and won't emit a plain static bundle. Remove it right after scaffolding. |
| Official Pages actions (`upload-pages-artifact` + `deploy-pages`) | `peaceiris/actions-gh-pages` (branch push) | Only if branch-based Pages is mandated. The artifact flow is the current recommended path and avoids committing `build/`. |
| Rename `master`→`main` | Trigger workflow on `master` | Either works. Renaming to `main` matches the family convention and every workflow example; a single source of truth is less error-prone. |

**Scaffold + install:**
```bash
# From the parent dir OR run in-place; sv create scaffolds into ./ if given "."
pnpm dlx sv create diversityincludesdisability_four   # minimal, TypeScript, ESLint, Prettier, Playwright
cd diversityincludesdisability_four

pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-static@3.0.10
pnpm add -D svelte-check@4.7.1
# Optional, only for a portable local prod-base build script:
# pnpm add -D cross-env
```

**Version verification (run before pinning):**
```bash
pnpm view @sveltejs/adapter-static version   # expect 3.0.10 (or newer patch)
pnpm view @sveltejs/kit version              # expect 2.69.1+
pnpm view svelte version                     # expect 5.56.4+
```
STACK.md verified all of these live on 2026-07-04. Re-confirm only if the scaffold pulls a different pin.

**Toolchain pins:**
```
# .nvmrc
24
```
```jsonc
// package.json
"packageManager": "pnpm@11.10.0",
"engines": { "node": ">=24" }
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 slice only)
```
diversityincludesdisability_four/
├── .github/workflows/deploy.yml   # pnpm build + Pages deploy (DEPLOY-03)
├── .nvmrc                         # 24
├── package.json                   # packageManager, engines, scripts
├── svelte.config.js               # adapter-static, paths.base, prerender, 404 fallback
├── static/
│   └── .nojekyll                  # EMPTY, committed — DEPLOY-02
└── src/
    ├── app.html                   # default scaffold shell (mode script comes in Phase 2)
    └── routes/
        ├── +layout.ts             # export const prerender = true; trailingSlash = 'always'
        └── +page.svelte           # hello-world proof page (uses {base} for any link/asset)
```
Everything else in ARCHITECTURE.md's tree (`lib/stores`, `lib/premium`, `app.css` tokens, `ModeToggle`, etc.) belongs to Phases 2–4. Phase 1 ships the skeleton + deploy pipeline only.

### Pattern 1: Base path driven by `BASE_PATH` env, empty in dev
**What:** `paths.base` is `''` during `vite dev` (so localhost works at root) and `process.env.BASE_PATH` in build/CI (so prod lives under the subpath). CI injects `BASE_PATH` from the repo name — never hardcode the path in two places.
**When to use:** Always, for any base-path Pages deploy.
```js
// svelte.config.js — Source: svelte.dev adapter-static / GitHub Pages guide, verified 2026-07-04
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
      // relative asset URLs are the SvelteKit default (paths.relative: true) — leave it on;
      // it is the most robust fix for _app/immutable chunk 404s under a base path.
    },
    prerender: {
      entries: ['*'],                 // crawl + prerender every reachable route
      handleHttpError: 'fail',        // broken internal link fails the build, not prod
      handleMissingId: 'fail'
    }
  }
};

export default config;
```

### Pattern 2: Force prerender at the root layout
```ts
// src/routes/+layout.ts — Source: svelte.dev adapter-static guide
export const prerender = true;
export const trailingSlash = 'always';   // see trailingSlash decision below
```

### Pattern 3: Base-aware links/assets from day one
Even the hello-world page must model the correct habit so no hardcoded `/` path ever creeps in.
```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { base } from '$app/paths';
</script>

<main>
  <h1>Diversity Includes Disability — deploy proof</h1>
  <p>If you can read this at the base path with styles intact, Phase 1 is green.</p>
  <a href="{base}/">Home (base-aware link)</a>
</main>
```
In `app.html`, any favicon/manifest/asset must use `%sveltekit.assets%`, never a literal `/favicon.png`.

### Anti-Patterns to Avoid
- **Hardcoding `/about`, `/logo.png`:** 404s under `/diversityincludesdisability_four/`. Use `{base}` / Vite imports / `%sveltekit.assets%`.
- **Forgetting `static/.nojekyll`:** Jekyll drops `_app/`; site silently 404s all JS/CSS.
- **Leaving `master`/`main` mismatched:** workflow never triggers; "deploy" appears configured but nothing ever publishes.
- **Deploying `.svelte-kit/` instead of `build/`:** upload the adapter-static output dir (`build`), which is what `upload-pages-artifact` points at.
- **Front-loading the full toolchain in Phase 1:** keeps the deploy-proof failure surface unnecessarily large. Install Threlte/axe/Lighthouse in their phases.

## trailingSlash Decision

**Decision: `trailingSlash: 'always'`** (set in `src/routes/+layout.ts`).

**Why:**
- With `'always'`, each route is emitted as `<route>/index.html` (e.g. `build/index.html`, later `build/about/index.html`). GitHub Pages serves a directory request `/base/about/` → `/base/about/index.html` **deterministically**, with no reliance on Pages' extension-stripping "pretty URL" behavior.
- The default `'never'` emits `about.html` and depends on GitHub Pages silently rewriting `/about` → `/about.html` and on trailing-slash redirects — both of which can shift the relative base and reintroduce `_app/immutable` asset-resolution ambiguity under a subpath. That is precisely the failure class this phase exists to eliminate.
- SvelteKit's default `paths.relative: true` makes relative asset URLs resolve correctly from either depth, so `'always'` costs nothing and removes a variable.
- This matches the recommendation in both `research/PITFALLS.md` (Pitfall 3) and `research/ARCHITECTURE.md`, keeping the corpus consistent.

**Consistency rule:** pick it once here and keep it for every route added in later phases. Mixing policies produces redirect/404 surprises on Pages.

## The Concrete Deploy Artifacts

### `.nojekyll` (DEPLOY-02)
```bash
# Empty file, committed. Copied verbatim into build/ by adapter-static.
# Git Bash / CI:
touch static/.nojekyll
# PowerShell equivalent:
#   New-Item -ItemType File -Force static/.nojekyll
```
Confirm it is tracked: `git add static/.nojekyll` (an empty file is easy to forget in `git status`).

### `.github/workflows/deploy.yml` (DEPLOY-03)
```yaml
# Source: STACK.md + svelte.dev Pages guide; action versions re-verified 2026-07-04
# upload-pages-artifact@v3 + deploy-pages@v4 is the current compatible pair.
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]          # MUST match the actual default branch (rename master→main)
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
      - uses: pnpm/action-setup@v4          # reads packageManager: pnpm@11.10.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'   # => /diversityincludesdisability_four
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
`BASE_PATH` is derived from `github.event.repository.name`, so `svelte.config.js` and CI can never drift. Requires a committed `pnpm-lock.yaml` (from `pnpm install` locally) for `--frozen-lockfile`.

### `package.json` scripts
Scaffold defaults are sufficient; the key one is `build`. Add an optional portable local prod-base build for pre-push validation.
```jsonc
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "preview": "vite preview",
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  // Optional local prod-base build (needs cross-env; CI does NOT use this — it sets BASE_PATH inline):
  "build:base": "cross-env BASE_PATH=/diversityincludesdisability_four vite build"
}
```
**Windows env-var gotcha:** `BASE_PATH=/x pnpm build` does not work in PowerShell. For a one-off local prod-base build without `cross-env`:
```powershell
$env:BASE_PATH='/diversityincludesdisability_four'; pnpm build; Remove-Item Env:BASE_PATH
```

### Create remote + enable Pages (the deploy-proof enabling steps)
```bash
gh auth status   # confirm logged in as wolfwdavid with repo+workflow scopes first

# 1. Rename branch so it matches the workflow trigger
git branch -m master main

# 2. Create the public repo under wolfwdavid, set origin, push
gh repo create wolfwdavid/diversityincludesdisability_four \
  --public --source=. --remote=origin --push

# 3. Enable Pages with the GitHub Actions source (build_type=workflow)
gh api -X PUT /repos/wolfwdavid/diversityincludesdisability_four/pages \
  -f build_type=workflow
#   If the site doesn't exist yet and PUT 404s, create it first:
#   gh api -X POST /repos/wolfwdavid/diversityincludesdisability_four/pages -f build_type=workflow

# 4. The push in step 2 (branch main) triggers deploy.yml. Watch it:
gh run watch
```
If `gh` is not authenticated as `wolfwdavid`, steps 2–3 are a human handoff.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static export for Pages | Custom Vite static build / manual HTML copy | `@sveltejs/adapter-static@3.0.10` | Handles prerender crawl, fallback emission, asset hashing, base-path rewriting. |
| SPA deep-link fallback | Custom 404 redirect hack (`spa-github-pages` querystring trick) | `adapter({ fallback: '404.html' })` | First-class SvelteKit feature; the client router recovers the real route. |
| Base-path URL rewriting | String-replacing `/` in output | `paths.base` + `{base}` + `paths.relative` | Framework rewrites links, assets, and `_app/immutable` chunks correctly. |
| Publishing to Pages | Manual `git push` to a `gh-pages` branch | `upload-pages-artifact@v3` + `deploy-pages@v4` | Official artifact flow; no build output committed; atomic, concurrency-guarded. |
| Enabling Pages | Clicking through Settings UI (non-reproducible) | `gh api ... -f build_type=workflow` | Scriptable, reproducible, documented in the plan. |

**Key insight:** Every part of this pipeline is a solved, first-party SvelteKit/GitHub feature. The only "custom" work is wiring, branch reconciliation, and verification — there is nothing to invent.

## Common Pitfalls

### Pitfall 1: Works locally, 404s everything on Pages (base-path breakage)
**What goes wrong:** `_app/immutable/*` chunks, images, favicon all 404 on the live URL; blank/unstyled page. Fine at `localhost:5173`.
**Why:** dev serves from root; prod lives one dir deep. Hardcoded `/` paths point at the domain root, not the subpath.
**How to avoid:** `paths.base` from `BASE_PATH`; `{base}`/`%sveltekit.assets%` for every reference; keep `paths.relative` default-on; grep the built output for stray `href="/`/`src="/`.
**Warning signs:** DevTools Network full of red `_app/immutable` 404s in prod only.

### Pitfall 2: Missing `.nojekyll` — Jekyll eats `_app/`
**What goes wrong:** Even with correct base path, all app JS/CSS 404 because Jekyll ignores underscore-prefixed dirs.
**Why:** Pages runs Jekyll by default; `_app/` starts with an underscore; adapter-static doesn't emit `.nojekyll`.
**How to avoid:** Commit empty `static/.nojekyll`; verify it lands in `build/` and in the deployed artifact.
**Warning signs:** `_app` 404s despite correct paths; invisible in `vite preview` (only the real host runs Jekyll).

### Pitfall 3: Workflow never runs (branch mismatch)
**What goes wrong:** Everything looks configured but no deployment ever appears; live URL 404s or shows nothing.
**Why:** default branch is `master`; workflow triggers on `main`.
**How to avoid:** `git branch -m master main` before first push (or trigger on the real branch). Confirm with `gh run list`.
**Warning signs:** `gh run list` empty after push; Actions tab shows no runs.

### Pitfall 4: Deep-link / hard-refresh shows GitHub's 404
**What goes wrong:** `/diversityincludesdisability_four/about` typed directly or refreshed returns GitHub's generic 404.
**Why:** Pages has no server routing; without a fallback there's nothing to serve unknown paths.
**How to avoid:** `fallback: '404.html'` emits `build/404.html`; Pages serves it and the client router resolves the route. (With full prerender + `trailingSlash:'always'`, real routes have their own `index.html`; `404.html` is the safety net for anything unprerendered.)
**Warning signs:** first load works, refresh on a subpage breaks.

### Pitfall 5: Prerender build failure (`window is not defined`, un-crawlable route)
**What goes wrong:** `vite build` throws "not prerendered" or `ReferenceError: window is not defined`.
**Why:** browser-only code at module top-level runs in Node during prerender; or a route is only reachable via JS navigation.
**How to avoid:** guard browser code with `import { browser } from '$app/environment'` / `onMount`; keep every route reachable via a real `<a href>` or list it in `prerender.entries`. Phase 1's single page sidesteps this, but set `handleHttpError:'fail'` now so future regressions fail loudly.
**Warning signs:** build-time `document`/`window` errors; "marked prerenderable but not prerendered".

## Code Examples

All concrete artifacts (svelte.config.js, +layout.ts, +page.svelte, deploy.yml, .nojekyll, package.json) are in **"The Concrete Deploy Artifacts"** and **"Architecture Patterns"** above — copy them directly. Sources: svelte.dev adapter-static/GitHub Pages guide and STACK.md, both verified 2026-07-04.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gh-pages` npm / `peaceiris/actions-gh-pages` pushing a `gh-pages` branch | `upload-pages-artifact` + `deploy-pages` artifact flow, Source = "GitHub Actions" | 2022+, hardened through 2024 | No build output committed; atomic deploys; `id-token` OIDC. |
| `upload-pages-artifact@v2` / `deploy-pages@v3` | **`upload-pages-artifact@v3` + `deploy-pages@v4`** | Dec 2024 deprecation (artifacts v4 required) | Older pairs now fail on github.com. Use v3+v4 exactly. |
| Svelte 4 `export let` / `$:` | Svelte 5 runes | 2024–2025 | Scaffold emits Svelte 5; irrelevant to Phase 1 config but relevant to later phases. |

**Deprecated/outdated:**
- adapter-auto for Pages — never produced a static bundle; remove after scaffold.
- Manual `spa-github-pages` 404 querystring hack — superseded by adapter-static `fallback`.

## Open Questions

1. **Is `gh` authenticated as `wolfwdavid`?**
   - What we know: repo is local-only, no remote; user `wolfwdavid` owns the target namespace.
   - What's unclear: whether the executing environment's `gh` is logged in with `repo`+`workflow` scopes for that account.
   - Recommendation: run `gh auth status` as the first deploy task; if not, plan a human handoff for repo-create + Pages-enable, then resume automated verification.

2. **Public vs private repo.**
   - What we know: Pages on a **private** repo requires GitHub Pro/Team; PROJECT.md security note says commit only public site code + public content (Notion PII excluded).
   - What's unclear: whether the user wants the repo public.
   - Recommendation: create `--public` (simplest for free Pages + matches "public site code only"). Confirm with user before `gh repo create` if unsure. The `.gitignore`/secret-hygiene discipline from PROJECT.md applies regardless.

3. **First deploy propagation lag.**
   - What we know: a brand-new Pages site can take 1–2 minutes after the first successful `deploy-pages` run before the URL serves 200.
   - Recommendation: the live-URL curl check should poll/retry rather than assert once (see Validation Architecture).

## Validation Architecture

Nyquist validation is **enabled** (`config.json` → `workflow.nyquist_validation: true`). Phase 1 is infrastructure, so the "tests" are build-output assertions and live-URL probes rather than unit tests. These are the acceptance gate.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None required for Phase 1 (Playwright installed later for a11y). Validation is shell assertions against `build/` and the live URL. |
| Config file | none — see Wave 0 |
| Quick run command | `pnpm build` (must exit 0) |
| Full suite command | build + `build/`-output greps + live-URL curl checks (script below) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPLOY-01 | Static build with prerendered `index.html` under base path | build-assert | `pnpm build && test -f build/index.html` | ✅ (config) |
| DEPLOY-01 | Built asset URLs prefixed with `/diversityincludesdisability_four/` | grep-assert | `grep -R "/diversityincludesdisability_four/_app" build/index.html` (after prod-base build) | ✅ |
| DEPLOY-02 | `.nojekyll` present in output | build-assert | `test -f build/.nojekyll` | ✅ |
| DEPLOY-02 | `404.html` SPA fallback emitted | build-assert | `test -f build/404.html` | ✅ |
| DEPLOY-03 | Actions workflow builds+deploys via pnpm | CI-run | `gh run list --workflow deploy.yml` shows a green run | ✅ (deploy.yml) |
| DEPLOY-04* | Live URL returns 200 with resolving assets + deep-link fallback | live-probe | curl checks below | ❌ Wave 0 (needs remote) |

### Sampling Rate
- **Per task commit:** `pnpm build` exits 0 (fast local gate).
- **Per wave merge:** local prod-base build + `build/`-output assertions (below).
- **Phase gate:** green Actions run + all live-URL probes pass before `/gsd:verify-work`.

### Concrete validation commands

**A. Local build-output assertions (prod base path):**
```bash
# Build with the production base path locally (Linux/Git Bash):
BASE_PATH=/diversityincludesdisability_four pnpm build
#   PowerShell: $env:BASE_PATH='/diversityincludesdisability_four'; pnpm build; Remove-Item Env:BASE_PATH

test -f build/index.html   && echo "OK index.html (DEPLOY-01)"
test -f build/404.html     && echo "OK 404.html  (DEPLOY-02)"
test -f build/.nojekyll    && echo "OK .nojekyll (DEPLOY-02)"

# Asset URLs must carry the base path — expect matches, non-empty:
grep -R "/diversityincludesdisability_four/_app" build/index.html && echo "OK base-prefixed _app (DEPLOY-01)"

# No stray root-absolute internal asset refs (should print nothing):
grep -REn 'src="/_app|href="/_app' build/ && echo "FAIL: unprefixed _app ref" || echo "OK no root-absolute _app refs"
```

**B. Live-URL probes (after the Actions run is green):**
```bash
URL=https://wolfwdavid.github.io/diversityincludesdisability_four/

# Root returns 200 (retry — first deploy can lag 1-2 min):
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
  [ "$code" = "200" ] && { echo "OK root 200"; break; }
  echo "waiting… ($code)"; sleep 15
done

# The referenced _app bundle actually resolves (pull one asset path from the HTML, fetch it, expect 200):
asset=$(curl -s "$URL" | grep -oE '/diversityincludesdisability_four/_app/[^"]+\.js' | head -1)
curl -s -o /dev/null -w 'asset %{http_code}\n' "https://wolfwdavid.github.io${asset}"   # expect 200

# Deep-link / hard-refresh hits the SPA fallback rather than a hard failure:
curl -s -o /dev/null -w 'deep-link %{http_code}\n' "${URL}does-not-exist/"   # 404 status is fine — body must be the SvelteKit 404.html, not GitHub's generic page
curl -s "${URL}does-not-exist/" | grep -qi "sveltekit\|%sveltekit" && echo "OK SPA fallback served"
```
> Note: GitHub Pages returns HTTP 404 for the fallback path even when serving your `404.html`; assert on the **body** (your app shell) not the status code for the fallback check.

### Wave 0 Gaps
- [ ] GitHub remote `wolfwdavid/diversityincludesdisability_four` does not exist yet — `gh repo create` blocks all live probes.
- [ ] Pages not enabled — `gh api -X PUT …/pages -f build_type=workflow` required before first deploy serves.
- [ ] Branch `master`→`main` rename — else workflow never triggers.
- [ ] `pnpm-lock.yaml` must be committed for CI `--frozen-lockfile`.
- [ ] No test framework install needed this phase (Playwright/axe deferred to a11y phase).

## Sources

### Primary (HIGH confidence)
- `research/STACK.md` — verified version pins (npm registry 2026-07-04), exact `svelte.config.js`, deploy.yml, `.nojekyll` guidance.
- `research/ARCHITECTURE.md` — file tree, build/deploy flow, `trailingSlash:'always'` recommendation, prerender config.
- `research/PITFALLS.md` — base-path, `.nojekyll`, SPA-fallback, prerender/trailingSlash failure modes.
- svelte.dev — adapter-static / GitHub Pages guide (base path, `fallback:'404.html'`, manual `.nojekyll`, `prerender=true`) — verified 2026-07-04.
- [GitHub Changelog — Pages actions require artifacts v4](https://github.blog/changelog/2024-12-05-deprecation-notice-github-pages-actions-to-require-artifacts-actions-v4-on-github-com/) — confirms `upload-pages-artifact@v3` + `deploy-pages@v4` pair.

### Secondary (MEDIUM confidence)
- [community/discussions/51268 — enable Pages via `gh` CLI](https://github.com/orgs/community/discussions/51268) + [Configuring a publishing source — GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) — `gh api -X PUT /repos/{owner}/{repo}/pages -f build_type=workflow`.
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) / [actions/deploy-pages](https://github.com/actions/deploy-pages) — current version pair.

### Tertiary (LOW confidence / needs live confirmation)
- Exact `gh auth` state of the executing environment — must be checked at plan time (`gh auth status`).
- First-deploy propagation lag (1–2 min) — empirical, handle with retry.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pins verified live in STACK.md 2026-07-04.
- Deploy config (svelte.config.js / .nojekyll / 404 / workflow): HIGH — verified against svelte.dev + re-checked action versions today.
- `gh` repo-create + Pages-enable commands: MEDIUM-HIGH — API verified today; blocked only on local `gh` auth state.
- Branch reconciliation (`master`→`main`): HIGH — confirmed `master` is the current default by inspecting the repo.
- Live-URL probes: MEDIUM — cannot run until the remote exists; commands are standard curl.

**Research date:** 2026-07-04
**Valid until:** ~2026-08-04 (stable stack; re-verify Pages action major versions and any adapter-static patch before a long-delayed execution).
