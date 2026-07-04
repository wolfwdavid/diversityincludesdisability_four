# Stack Research

**Domain:** Dual-mode (Premium 3D + Accessible) SvelteKit marketing/portfolio site, static-exported to GitHub Pages under a base path
**Researched:** 2026-07-04
**Confidence:** HIGH (all versions verified live against the npm registry on 2026-07-04; gh-pages config verified against official svelte.dev docs)

> All version numbers below were pulled from `registry.npmjs.org/<pkg>/latest` on 2026-07-04, not from training data. Peer-dependency ranges were read from each package's live manifest.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **svelte** | `5.56.4` | UI framework | Svelte 5 with **runes** (`$state`, `$derived`, `$effect`, `$props`) is the current stable line. Runes give explicit, fine-grained reactivity that is ideal for a persistent mode toggle shared across the app. Do NOT target Svelte 4 syntax. |
| **@sveltejs/kit** | `2.69.1` | App framework / router | Current stable SvelteKit 2. File-based routing, layouts, `$app/paths` (base-path aware), and first-class `adapter-static` support. |
| **@sveltejs/adapter-static** | `3.0.10` | Static site generation | **Required** for GitHub Pages. Prerenders every route to plain HTML/CSS/JS; supports an SPA `fallback` for client-routed 404 handling. Peer: `@sveltejs/kit@^2.0.0`. |
| **vite** | `8.1.3` | Build tool / dev server | SvelteKit's underlying bundler. Native code-splitting via dynamic `import()` is the mechanism that keeps Three.js out of the Accessible bundle. |
| **@sveltejs/vite-plugin-svelte** | `7.1.2` | Svelte↔Vite integration | Installed transitively by `sv create`. v7 peers `vite@^8` and `svelte@^5.46.4` — matches the versions above. If you pin Vite 7 instead, SvelteKit will pull vite-plugin-svelte 6; either combo is valid, but keep them paired (see Version Compatibility). |
| **typescript** | `~5.x` (kit peers `^5.3.3 \|\| ^6.0.0`) | Type safety | Use TS in `.svelte` (`<script lang="ts">`) and `.ts` modules. `svelte-check` provides editor/CI diagnostics. |
| **pnpm** | `11.10.0` | Package manager | Project constraint (npm has caused issues in this website family). Fast, strict, disk-efficient. Pin via `packageManager` field + `.npmrc`. |

### 3D Layer (Premium mode only — code-split, never in the Accessible bundle)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **three** | `0.185.1` | WebGL 3D engine | The rendering engine under Threlte. Tree-shakeable ES modules; import only the classes you use. |
| **@types/three** | `0.185.0` | Three.js types | Match the `three` minor exactly (`0.185.x` ↔ `0.185.x`). Three ships breaking changes on minor bumps, so keep these locked together. |
| **@threlte/core** | `8.5.16` | Declarative Three.js for Svelte 5 | Threlte 8 is the Svelte-5/runes-native major. Peers: `svelte >=5`, `three >=0.160`. Declarative `<T.Mesh>` components + a managed render loop. Lives entirely inside a lazy-loaded island so it is excluded from Accessible mode. |
| **@threlte/extras** | `9.21.0` | Threlte helpers | `<OrbitControls>`, `<Float>`, `useTexture`, `<Environment>`, etc. Peers same as core (`svelte >=5`, `three >=0.160`). Optional — add only if you need the helpers. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **motion** | `12.42.2` | Tasteful UI animation (formerly Framer Motion's vanilla core) | Premium-mode micro-interactions/parallax. Framework-agnostic, uses the Web Animations API, hardware-accelerated, tiny when tree-shaken. Gate every animation behind a `prefers-reduced-motion` check. **Alternative:** skip a lib entirely and use Svelte's built-in `transition:`/`animate:` + CSS `@media (prefers-reduced-motion)` — often enough and ships zero extra JS. |
| **@sveltejs/enhanced-img** | `0.11.0` | Build-time responsive/optimized images | Optional. Generates `<picture>` with AVIF/WebP + width variants at build time. Good for founder photos/hero art; keeps the Accessible payload light. Pre-1.0 but stable and maintained by the Svelte team. |

### Development Tools (Accessibility + Quality toolchain)

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **eslint** | `10.6.0` | Linting | Flat config (`eslint.config.js`). |
| **eslint-plugin-svelte** | `3.20.0` | Svelte + a11y lint rules | Ships the compiler's a11y warnings as lint rules (`svelte/a11y-*`). First static gate for accessibility. Pairs with `svelte-eslint-parser@1.8.0`. |
| **typescript-eslint** | `8.62.1` | TS lint rules | Flat-config helper for TS. |
| **@playwright/test** + **playwright** | `1.61.1` | E2E / a11y automation | Drives real browsers; runs axe scans against the built static site and asserts mode-toggle + keyboard flows. |
| **@axe-core/playwright** | `4.12.1` | axe engine bound to Playwright | `AxeBuilder(page).analyze()` → assert `violations` is empty on every page, in **both** modes. This is the core automated WCAG gate. |
| **axe-core** | `4.12.1` | Accessibility rules engine | Transitive under `@axe-core/playwright`; can also be injected in dev. Keep both `axe-core` and `@axe-core/playwright` on the same `4.12.x`. |
| **@lhci/cli** | `0.15.1` | Lighthouse CI | Budgets + Accessibility/Performance/SEO scores in CI against the static build. Assert `categories.accessibility >= 1.0`. |
| **svelte-check** | `4.7.1` | Type/a11y diagnostics | Run in CI before build. |
| **prettier** + **prettier-plugin-svelte** | `3.9.4` / `4.1.1` | Formatting | With `eslint-config-prettier@10.1.8` to disable conflicting rules. |

### Styling — recommended: **vanilla CSS + custom properties (no Tailwind)**

| Approach | Recommendation |
|----------|----------------|
| **Vanilla CSS with CSS custom properties + a `data-mode` attribute on `<html>`** | **RECOMMENDED.** The two modes are fundamentally a **theming** problem, which CSS custom properties solve natively. Define both palettes as token sets (`--color-bg`, `--color-fg`, `--color-accent`, `--space-*`, `--font-size-*`) and swap them with `:root[data-mode="accessible"] { … }` / `:root[data-mode="premium"] { … }`. Component styles reference tokens only, so both modes stay in sync with zero JS re-render. Add `@media (prefers-contrast: more)` and `@media (prefers-reduced-motion: reduce)` blocks. Scoped `<style>` in Svelte components keeps CSS local and dead-code-eliminated. This is the lightest possible Accessible payload and gives you exact control over WCAG AAA contrast ratios (≥7:1 body text, ≥4.5:1 large text). |
| **Tailwind v4** (`tailwindcss@4.3.2` + `@tailwindcss/vite@4.3.2`) | Considered and **not recommended here.** v4 supports CSS-variable theming and could express two modes via a `data-mode` variant, but it adds a build dependency and utility-class noise for a small content site whose defining requirement is *precise, auditable contrast tokens*. Choose Tailwind only if the team strongly prefers utility-first velocity over token precision. If you do, drive themes from CSS variables (not two full utility themes) so contrast stays auditable. |

---

## Installation

```bash
# Scaffold (interactive): choose "SvelteKit minimal", TypeScript, ESLint, Prettier, Playwright
pnpm dlx sv create diversityincludesdisability_four

cd diversityincludesdisability_four

# Swap the default adapter for adapter-static
pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-static@3.0.10

# 3D layer (Premium mode only — dynamically imported, see pattern below)
pnpm add three@0.185.1 @threlte/core@8.5.16 @threlte/extras@9.21.0
pnpm add -D @types/three@0.185.0

# Optional tasteful animation (or rely on Svelte transitions + CSS)
pnpm add motion@12.42.2

# Optional build-time image optimization
pnpm add -D @sveltejs/enhanced-img@0.11.0

# Accessibility + quality toolchain
pnpm add -D \
  eslint@10.6.0 eslint-plugin-svelte@3.20.0 svelte-eslint-parser@1.8.0 \
  typescript-eslint@8.62.1 eslint-config-prettier@10.1.8 \
  prettier@3.9.4 prettier-plugin-svelte@4.1.1 \
  @playwright/test@1.61.1 @axe-core/playwright@4.12.1 axe-core@4.12.1 \
  @lhci/cli@0.15.1 svelte-check@4.7.1

# Install the browser Playwright drives for a11y scans
pnpm exec playwright install --with-deps chromium
```

Pin the toolchain for reproducible CI:

```
# .nvmrc
24
```
```jsonc
// package.json
"packageManager": "pnpm@11.10.0",
"engines": { "node": ">=24" }
```

---

## GitHub Pages configuration (base path + SPA 404 + .nojekyll) — VERIFIED

All three requirements are handled in two files plus one static file. Verified against the official svelte.dev `adapter-static` / GitHub Pages guide (2026-07-04).

### `svelte.config.js`

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// `dev` is true during `vite dev` (argv contains 'dev').
const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Defaults are fine: pages/assets => 'build'.
      fallback: '404.html' // SPA fallback: GitHub Pages serves 404.html for unknown paths,
                            // and SvelteKit's client router resolves the real route.
    }),
    paths: {
      // In dev, base MUST be '' so localhost works.
      // In CI/prod, BASE_PATH is set to '/diversityincludesdisability_four'.
      base: dev ? '' : process.env.BASE_PATH
    }
  }
};

export default config;
```

### Root layout — force prerendering

```js
// src/routes/+layout.js  (or .ts)
export const prerender = true;
// Optional: keep client-side routing snappy after the fallback loads.
// export const ssr = true; // default; leave on so pages prerender to real HTML.
```

### `.nojekyll` — MUST be created manually

```bash
# Create an EMPTY file so GitHub Pages does NOT run Jekyll.
# Without this, Pages ignores files/dirs beginning with `_`
# (SvelteKit emits `_app/`), breaking all JS/CSS.
touch static/.nojekyll
```
`static/` contents are copied verbatim into `build/`, so `.nojekyll` lands in the deploy root. adapter-static does **not** create it for you — this is a common, silent gh-pages failure.

### Always use base-aware links

```svelte
<script>
  import { base } from '$app/paths';
</script>
<a href="{base}/about">About Eman</a>
<img src="{base}/img/hero.avif" alt="…" />
```
Never hardcode `/about` — it 404s under the `/diversityincludesdisability_four/` subpath. Use `{base}` for every internal link, asset, and `fetch`.

---

## Threlte gated behind Premium mode (the code-split pattern)

The goal: **Accessible mode ships zero WebGL/Three.js.** Achieve this by putting *all* Threlte/Three code inside a component that is only ever loaded via dynamic `import()`, which Vite splits into its own chunk fetched on demand.

```svelte
<!-- src/lib/PremiumHero.svelte -->
<!-- This file imports Threlte/three. It becomes its own lazy chunk. -->
<script>
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte'; // <T.Mesh> etc. — also in this chunk
</script>

<Canvas>
  <Scene />
</Canvas>
```

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { mode } from '$lib/mode.svelte.js'; // rune-based store, persisted to localStorage

  // Dynamic import => separate JS chunk. three/Threlte are pulled ONLY when
  // Premium is active, so the Accessible bundle contains none of it.
  let PremiumHero = $state(null);

  $effect(() => {
    if (mode.current === 'premium' && !PremiumHero) {
      import('$lib/PremiumHero.svelte').then((m) => (PremiumHero = m.default));
    }
  });
</script>

{#if mode.current === 'premium' && PremiumHero}
  <svelte:component this={PremiumHero} />
{:else}
  <!-- Accessible, flat, high-contrast hero — pure HTML/CSS, no JS 3D -->
  <FlatHero />
{/if}
```

Rules that keep the split clean:
- **Never** statically `import` anything from `three`, `@threlte/*`, or `motion` in a module that Accessible mode loads (layouts, shared stores, the Accessible hero). A single top-level import defeats the split.
- Guard prerender: Threlte's `<Canvas>` needs a browser. It only mounts client-side after the dynamic import, so SSR/prerender of the page succeeds without touching WebGL.
- Auto-select Accessible when `matchMedia('(prefers-reduced-motion: reduce)')` or `(prefers-contrast: more)` matches, unless the user has explicitly chosen Premium (persist the explicit choice).

---

## GitHub Actions — build + deploy to GitHub Pages with pnpm

Use the official Pages actions (not the older `gh-pages` npm package / branch push). This is the current best practice.

```yaml
# .github/workflows/deploy.yml
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
      - uses: pnpm/action-setup@v4        # reads packageManager / pnpm version
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'  # => /diversityincludesdisability_four
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

Notes:
- Set repo **Settings → Pages → Source = "GitHub Actions"** (not "Deploy from a branch").
- `BASE_PATH` is injected from the repo name so `svelte.config.js` and the CI stay in sync — no hardcoded path.
- Add an a11y gate job (Playwright + axe + `@lhci/cli`) before `deploy` so a WCAG regression blocks the release.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@sveltejs/adapter-static` | `@sveltejs/adapter-auto` | Never for this project — adapter-auto targets serverless hosts (Vercel/Netlify) and will not produce a plain static bundle for GitHub Pages. Remove it after scaffolding. |
| Vanilla CSS + custom properties | Tailwind v4 | Team strongly prefers utility-first workflow and accepts driving themes from CSS variables to keep contrast auditable. |
| `motion` (or Svelte transitions) | `svelte-motion` (`0.12.2`), `@motionone/svelte` (`10.16.4`), `animejs` (`4.5.0`) | `svelte-motion`/`@motionone/svelte` are thinner Svelte wrappers but less actively maintained than `motion`'s core; `animejs` is fine for timeline-heavy sequences. All must still respect `prefers-reduced-motion`. |
| Official Pages actions (`upload-pages-artifact` + `deploy-pages`) | `peaceiris/actions-gh-pages` / `gh-pages` npm pushing to a `gh-pages` branch | Only if the org requires branch-based Pages. The official artifact flow is the current recommended path and avoids committing build output. |
| Threlte 8 | Raw `three` in an `onMount` | Use raw three only for a one-off tiny effect; Threlte's declarative components + managed loop are far more maintainable for a hero scene. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@sveltejs/adapter-auto` | Won't build a static site for GitHub Pages; picks a serverless target. | `@sveltejs/adapter-static@3.0.10` |
| Svelte 4 syntax (`export let`, `$:` reactive labels) | Svelte 5 runes are the current model; mixing invites confusion and misses fine-grained reactivity for the shared mode store. | Runes: `$state`, `$derived`, `$effect`, `$props` |
| Static `import` of `three`/`@threlte/*`/`motion` in shared or Accessible code paths | Pulls WebGL into the Accessible bundle, violating the "zero 3D in Accessible mode" requirement and bloating the light payload. | Dynamic `import('$lib/PremiumHero.svelte')` gated on Premium mode |
| SSR-only patterns (server `load` hitting a DB/API, form actions, `+server.js` endpoints) | GitHub Pages is a static host — no server runtime exists at request time. | `prerender = true`, static content, client-side interactivity only |
| Hardcoded absolute internal links (`/about`, `/img/x.png`) | 404 under the `/diversityincludesdisability_four/` base path. | `import { base } from '$app/paths'` → `{base}/about` |
| Forgetting `static/.nojekyll` | GitHub Pages runs Jekyll and drops `_app/`, breaking all JS/CSS silently. | Create empty `static/.nojekyll` |
| Mismatched `three` / `@types/three` minors | Three ships breaking changes on minor bumps; type drift causes false build errors. | Lock both to `0.185.x` |
| npm | Project convention is pnpm; npm has caused prior issues in this website family. | `pnpm@11.10.0` |

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@sveltejs/vite-plugin-svelte@7.1.2` | `vite@^8`, `svelte@^5.46.4` | Current pairing (Vite 8). Matches recommended versions. |
| `@sveltejs/vite-plugin-svelte@6.x` | `vite@7` | Fallback pairing if you stay on Vite 7. Whatever `sv create` installs is internally consistent — do not mix a Vite 7 install with vite-plugin-svelte 7. |
| `@sveltejs/kit@2.69.1` | `svelte@^5`, `vite@^5\|\|^6\|\|^7\|\|^8`, `typescript@^5.3.3\|\|^6` | Broad; `svelte@5.56.4` + `vite@8.1.3` are inside range. |
| `@sveltejs/adapter-static@3.0.10` | `@sveltejs/kit@^2.0.0` | Matches kit 2.69.1. |
| `@threlte/core@8.5.16` / `@threlte/extras@9.21.0` | `svelte>=5`, `three>=0.160` | `svelte@5.56.4` and `three@0.185.1` satisfy both. Threlte 8 is the Svelte-5 major — do NOT use Threlte 7 with Svelte 5. |
| `three@0.185.1` | `@types/three@0.185.0` | Keep minors locked together. |
| `axe-core@4.12.1` | `@axe-core/playwright@4.12.1` | Keep on the same 4.12.x line. |

---

## Sources

- npm registry (`registry.npmjs.org/<pkg>/latest` + peerDependencies manifests), queried 2026-07-04 — all version numbers and peer ranges. **HIGH confidence** (live registry, not training data).
- svelte.dev — `adapter-static` / GitHub Pages guide — base path, `fallback: '404.html'`, manual `static/.nojekyll`, `prerender = true`, `paths.base` dev/prod switch. **HIGH confidence** (official docs, verified 2026-07-04).
- Threlte 8 peer manifest (`svelte>=5`, `three>=0.160`) — confirms Svelte-5/runes compatibility. **HIGH confidence**.
- Dynamic-import code-splitting pattern — Vite/SvelteKit standard behavior; `import()` produces a separate chunk. **HIGH confidence** (documented framework behavior).
- Styling recommendation (vanilla CSS custom properties vs Tailwind) and animation-lib choice — **MEDIUM confidence** (opinionated, driven by the project's WCAG-AAA-contrast + light-Accessible-payload requirements rather than a single citable source).

---
*Stack research for: dual-mode SvelteKit static site on GitHub Pages*
*Researched: 2026-07-04*
