<!-- GSD:project-start source:PROJECT.md -->

## Project

**Diversity Includes Disability — Dual-Mode Site (diversityincludesdisability_four)**

A modern, premium **SvelteKit** website for **Diversity Includes Disability (DID)**, the
intersectional disability-equity venture of **Eman Rimawi (Eman Rimawi-Doster)** — a faithful
rebuild of diversityincludesdisability.org. Its defining feature is **one site with two
togglable, persistent experiences**: a **Premium 3D** immersive mode (Threlte / Three.js,
parallax, motion) and an **Accessible** mode modeled on scope.org.uk (flat, high-contrast,
WCAG AAA-minded, reduced-motion, larger text, zero 3D shipped). The visitor chooses how they
experience the site — which is the point, for a disability-equity organization.

**Core Value:** **A visitor can experience DID's mission and services in the mode that works for their body and
brain — and switch instantly, with the choice remembered.** The Accessible mode is not a
degraded fallback; it is a first-class, gold-standard experience. If everything else fails, the
site must remain fully usable, perceivable, and operable in Accessible mode.

### Constraints

- **Tech stack**: SvelteKit + `adapter-static` — required for GitHub Pages static hosting
- **3D**: Threlte (declarative Three.js for Svelte), lazy-loaded/code-split — Accessible mode must ship zero WebGL/Three.js
- **Package manager**: pnpm (this website family's convention; npm has caused issues before)
- **Hosting**: GitHub Pages, base path `/diversityincludesdisability_four`; needs SPA fallback (404.html) + `.nojekyll`
- **Accessibility**: WCAG 2.2 AA is the floor; Accessible mode targets AAA contrast + reduced motion + keyboard-complete
- **Node**: v24 available locally; pin engines/`.nvmrc` for reproducible CI builds
- **Performance**: Accessible-first payload must be light; 3D assets load only on demand in Premium mode

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology                       | Version                                 | Purpose                 | Why Recommended                                                                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **svelte**                       | `5.56.4`                                | UI framework            | Svelte 5 with **runes** (`$state`, `$derived`, `$effect`, `$props`) is the current stable line. Runes give explicit, fine-grained reactivity that is ideal for a persistent mode toggle shared across the app. Do NOT target Svelte 4 syntax.              |
| **@sveltejs/kit**                | `2.69.1`                                | App framework / router  | Current stable SvelteKit 2. File-based routing, layouts, `$app/paths` (base-path aware), and first-class `adapter-static` support.                                                                                                                         |
| **@sveltejs/adapter-static**     | `3.0.10`                                | Static site generation  | **Required** for GitHub Pages. Prerenders every route to plain HTML/CSS/JS; supports an SPA `fallback` for client-routed 404 handling. Peer: `@sveltejs/kit@^2.0.0`.                                                                                       |
| **vite**                         | `8.1.3`                                 | Build tool / dev server | SvelteKit's underlying bundler. Native code-splitting via dynamic `import()` is the mechanism that keeps Three.js out of the Accessible bundle.                                                                                                            |
| **@sveltejs/vite-plugin-svelte** | `7.1.2`                                 | Svelte↔Vite integration | Installed transitively by `sv create`. v7 peers `vite@^8` and `svelte@^5.46.4` — matches the versions above. If you pin Vite 7 instead, SvelteKit will pull vite-plugin-svelte 6; either combo is valid, but keep them paired (see Version Compatibility). |
| **typescript**                   | `~5.x` (kit peers `^5.3.3 \|\| ^6.0.0`) | Type safety             | Use TS in `.svelte` (`<script lang="ts">`) and `.ts` modules. `svelte-check` provides editor/CI diagnostics.                                                                                                                                               |
| **pnpm**                         | `11.10.0`                               | Package manager         | Project constraint (npm has caused issues in this website family). Fast, strict, disk-efficient. Pin via `packageManager` field + `.npmrc`.                                                                                                                |

### 3D Layer (Premium mode only — code-split, never in the Accessible bundle)

| Technology          | Version   | Purpose                           | Why Recommended                                                                                                                                                                                                                   |
| ------------------- | --------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **three**           | `0.185.1` | WebGL 3D engine                   | The rendering engine under Threlte. Tree-shakeable ES modules; import only the classes you use.                                                                                                                                   |
| **@types/three**    | `0.185.0` | Three.js types                    | Match the `three` minor exactly (`0.185.x` ↔ `0.185.x`). Three ships breaking changes on minor bumps, so keep these locked together.                                                                                              |
| **@threlte/core**   | `8.5.16`  | Declarative Three.js for Svelte 5 | Threlte 8 is the Svelte-5/runes-native major. Peers: `svelte >=5`, `three >=0.160`. Declarative `<T.Mesh>` components + a managed render loop. Lives entirely inside a lazy-loaded island so it is excluded from Accessible mode. |
| **@threlte/extras** | `9.21.0`  | Threlte helpers                   | `<OrbitControls>`, `<Float>`, `useTexture`, `<Environment>`, etc. Peers same as core (`svelte >=5`, `three >=0.160`). Optional — add only if you need the helpers.                                                                |

### Supporting Libraries

| Library                    | Version   | Purpose                                                       | When to Use                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **motion**                 | `12.42.2` | Tasteful UI animation (formerly Framer Motion's vanilla core) | Premium-mode micro-interactions/parallax. Framework-agnostic, uses the Web Animations API, hardware-accelerated, tiny when tree-shaken. Gate every animation behind a `prefers-reduced-motion` check. **Alternative:** skip a lib entirely and use Svelte's built-in `transition:`/`animate:` + CSS `@media (prefers-reduced-motion)` — often enough and ships zero extra JS. |
| **@sveltejs/enhanced-img** | `0.11.0`  | Build-time responsive/optimized images                        | Optional. Generates `<picture>` with AVIF/WebP + width variants at build time. Good for founder photos/hero art; keeps the Accessible payload light. Pre-1.0 but stable and maintained by the Svelte team.                                                                                                                                                                    |

### Development Tools (Accessibility + Quality toolchain)

| Tool                                      | Version           | Purpose                        | Notes                                                                                                                                             |
| ----------------------------------------- | ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **eslint**                                | `10.6.0`          | Linting                        | Flat config (`eslint.config.js`).                                                                                                                 |
| **eslint-plugin-svelte**                  | `3.20.0`          | Svelte + a11y lint rules       | Ships the compiler's a11y warnings as lint rules (`svelte/a11y-*`). First static gate for accessibility. Pairs with `svelte-eslint-parser@1.8.0`. |
| **typescript-eslint**                     | `8.62.1`          | TS lint rules                  | Flat-config helper for TS.                                                                                                                        |
| **@playwright/test** + **playwright**     | `1.61.1`          | E2E / a11y automation          | Drives real browsers; runs axe scans against the built static site and asserts mode-toggle + keyboard flows.                                      |
| **@axe-core/playwright**                  | `4.12.1`          | axe engine bound to Playwright | `AxeBuilder(page).analyze()` → assert `violations` is empty on every page, in **both** modes. This is the core automated WCAG gate.               |
| **axe-core**                              | `4.12.1`          | Accessibility rules engine     | Transitive under `@axe-core/playwright`; can also be injected in dev. Keep both `axe-core` and `@axe-core/playwright` on the same `4.12.x`.       |
| **@lhci/cli**                             | `0.15.1`          | Lighthouse CI                  | Budgets + Accessibility/Performance/SEO scores in CI against the static build. Assert `categories.accessibility >= 1.0`.                          |
| **svelte-check**                          | `4.7.1`           | Type/a11y diagnostics          | Run in CI before build.                                                                                                                           |
| **prettier** + **prettier-plugin-svelte** | `3.9.4` / `4.1.1` | Formatting                     | With `eslint-config-prettier@10.1.8` to disable conflicting rules.                                                                                |

### Styling — recommended: **vanilla CSS + custom properties (no Tailwind)**

| Approach                                                                         | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vanilla CSS with CSS custom properties + a `data-mode` attribute on `<html>`** | **RECOMMENDED.** The two modes are fundamentally a **theming** problem, which CSS custom properties solve natively. Define both palettes as token sets (`--color-bg`, `--color-fg`, `--color-accent`, `--space-*`, `--font-size-*`) and swap them with `:root[data-mode="accessible"] { … }` / `:root[data-mode="premium"] { … }`. Component styles reference tokens only, so both modes stay in sync with zero JS re-render. Add `@media (prefers-contrast: more)` and `@media (prefers-reduced-motion: reduce)` blocks. Scoped `<style>` in Svelte components keeps CSS local and dead-code-eliminated. This is the lightest possible Accessible payload and gives you exact control over WCAG AAA contrast ratios (≥7:1 body text, ≥4.5:1 large text). |
| **Tailwind v4** (`tailwindcss@4.3.2` + `@tailwindcss/vite@4.3.2`)                | Considered and **not recommended here.** v4 supports CSS-variable theming and could express two modes via a `data-mode` variant, but it adds a build dependency and utility-class noise for a small content site whose defining requirement is _precise, auditable contrast tokens_. Choose Tailwind only if the team strongly prefers utility-first velocity over token precision. If you do, drive themes from CSS variables (not two full utility themes) so contrast stays auditable.                                                                                                                                                                                                                                                                 |

## Installation

# Scaffold (interactive): choose "SvelteKit minimal", TypeScript, ESLint, Prettier, Playwright

# Swap the default adapter for adapter-static

# 3D layer (Premium mode only — dynamically imported, see pattern below)

# Optional tasteful animation (or rely on Svelte transitions + CSS)

# Optional build-time image optimization

# Accessibility + quality toolchain

# Install the browser Playwright drives for a11y scans

# .nvmrc

## GitHub Pages configuration (base path + SPA 404 + .nojekyll) — VERIFIED

### `svelte.config.js`

### Root layout — force prerendering

### `.nojekyll` — MUST be created manually

# Create an EMPTY file so GitHub Pages does NOT run Jekyll.

# Without this, Pages ignores files/dirs beginning with `_`

# (SvelteKit emits `_app/`), breaking all JS/CSS.

### Always use base-aware links

## Threlte gated behind Premium mode (the code-split pattern)

- **Never** statically `import` anything from `three`, `@threlte/*`, or `motion` in a module that Accessible mode loads (layouts, shared stores, the Accessible hero). A single top-level import defeats the split.
- Guard prerender: Threlte's `<Canvas>` needs a browser. It only mounts client-side after the dynamic import, so SSR/prerender of the page succeeds without touching WebGL.
- Auto-select Accessible when `matchMedia('(prefers-reduced-motion: reduce)')` or `(prefers-contrast: more)` matches, unless the user has explicitly chosen Premium (persist the explicit choice).

## GitHub Actions — build + deploy to GitHub Pages with pnpm

# .github/workflows/deploy.yml

- Set repo **Settings → Pages → Source = "GitHub Actions"** (not "Deploy from a branch").
- `BASE_PATH` is injected from the repo name so `svelte.config.js` and the CI stay in sync — no hardcoded path.
- Add an a11y gate job (Playwright + axe + `@lhci/cli`) before `deploy` so a WCAG regression blocks the release.

## Alternatives Considered

| Recommended                                                       | Alternative                                                                      | When to Use Alternative                                                                                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sveltejs/adapter-static`                                        | `@sveltejs/adapter-auto`                                                         | Never for this project — adapter-auto targets serverless hosts (Vercel/Netlify) and will not produce a plain static bundle for GitHub Pages. Remove it after scaffolding.                                           |
| Vanilla CSS + custom properties                                   | Tailwind v4                                                                      | Team strongly prefers utility-first workflow and accepts driving themes from CSS variables to keep contrast auditable.                                                                                              |
| `motion` (or Svelte transitions)                                  | `svelte-motion` (`0.12.2`), `@motionone/svelte` (`10.16.4`), `animejs` (`4.5.0`) | `svelte-motion`/`@motionone/svelte` are thinner Svelte wrappers but less actively maintained than `motion`'s core; `animejs` is fine for timeline-heavy sequences. All must still respect `prefers-reduced-motion`. |
| Official Pages actions (`upload-pages-artifact` + `deploy-pages`) | `peaceiris/actions-gh-pages` / `gh-pages` npm pushing to a `gh-pages` branch     | Only if the org requires branch-based Pages. The official artifact flow is the current recommended path and avoids committing build output.                                                                         |
| Threlte 8                                                         | Raw `three` in an `onMount`                                                      | Use raw three only for a one-off tiny effect; Threlte's declarative components + managed loop are far more maintainable for a hero scene.                                                                           |

## What NOT to Use

| Avoid                                                                                    | Why                                                                                                                            | Use Instead                                                        |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `@sveltejs/adapter-auto`                                                                 | Won't build a static site for GitHub Pages; picks a serverless target.                                                         | `@sveltejs/adapter-static@3.0.10`                                  |
| Svelte 4 syntax (`export let`, `$:` reactive labels)                                     | Svelte 5 runes are the current model; mixing invites confusion and misses fine-grained reactivity for the shared mode store.   | Runes: `$state`, `$derived`, `$effect`, `$props`                   |
| Static `import` of `three`/`@threlte/*`/`motion` in shared or Accessible code paths      | Pulls WebGL into the Accessible bundle, violating the "zero 3D in Accessible mode" requirement and bloating the light payload. | Dynamic `import('$lib/PremiumHero.svelte')` gated on Premium mode  |
| SSR-only patterns (server `load` hitting a DB/API, form actions, `+server.js` endpoints) | GitHub Pages is a static host — no server runtime exists at request time.                                                      | `prerender = true`, static content, client-side interactivity only |
| Hardcoded absolute internal links (`/about`, `/img/x.png`)                               | 404 under the `/diversityincludesdisability_four/` base path.                                                                  | `import { base } from '$app/paths'` → `{base}/about`               |
| Forgetting `static/.nojekyll`                                                            | GitHub Pages runs Jekyll and drops `_app/`, breaking all JS/CSS silently.                                                      | Create empty `static/.nojekyll`                                    |
| Mismatched `three` / `@types/three` minors                                               | Three ships breaking changes on minor bumps; type drift causes false build errors.                                             | Lock both to `0.185.x`                                             |
| npm                                                                                      | Project convention is pnpm; npm has caused prior issues in this website family.                                                | `pnpm@11.10.0`                                                     |

## Version Compatibility

| Package A                                         | Compatible With                                                     | Notes                                                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sveltejs/vite-plugin-svelte@7.1.2`              | `vite@^8`, `svelte@^5.46.4`                                         | Current pairing (Vite 8). Matches recommended versions.                                                                                                 |
| `@sveltejs/vite-plugin-svelte@6.x`                | `vite@7`                                                            | Fallback pairing if you stay on Vite 7. Whatever `sv create` installs is internally consistent — do not mix a Vite 7 install with vite-plugin-svelte 7. |
| `@sveltejs/kit@2.69.1`                            | `svelte@^5`, `vite@^5\|\|^6\|\|^7\|\|^8`, `typescript@^5.3.3\|\|^6` | Broad; `svelte@5.56.4` + `vite@8.1.3` are inside range.                                                                                                 |
| `@sveltejs/adapter-static@3.0.10`                 | `@sveltejs/kit@^2.0.0`                                              | Matches kit 2.69.1.                                                                                                                                     |
| `@threlte/core@8.5.16` / `@threlte/extras@9.21.0` | `svelte>=5`, `three>=0.160`                                         | `svelte@5.56.4` and `three@0.185.1` satisfy both. Threlte 8 is the Svelte-5 major — do NOT use Threlte 7 with Svelte 5.                                 |
| `three@0.185.1`                                   | `@types/three@0.185.0`                                              | Keep minors locked together.                                                                                                                            |
| `axe-core@4.12.1`                                 | `@axe-core/playwright@4.12.1`                                       | Keep on the same 4.12.x line.                                                                                                                           |

## Sources

- npm registry (`registry.npmjs.org/<pkg>/latest` + peerDependencies manifests), queried 2026-07-04 — all version numbers and peer ranges. **HIGH confidence** (live registry, not training data).
- svelte.dev — `adapter-static` / GitHub Pages guide — base path, `fallback: '404.html'`, manual `static/.nojekyll`, `prerender = true`, `paths.base` dev/prod switch. **HIGH confidence** (official docs, verified 2026-07-04).
- Threlte 8 peer manifest (`svelte>=5`, `three>=0.160`) — confirms Svelte-5/runes compatibility. **HIGH confidence**.
- Dynamic-import code-splitting pattern — Vite/SvelteKit standard behavior; `import()` produces a separate chunk. **HIGH confidence** (documented framework behavior).
- Styling recommendation (vanilla CSS custom properties vs Tailwind) and animation-lib choice — **MEDIUM confidence** (opinionated, driven by the project's WCAG-AAA-contrast + light-Accessible-payload requirements rather than a single citable source).

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
