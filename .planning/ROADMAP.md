# Roadmap: Diversity Includes Disability — Dual-Mode Site

## Overview

This roadmap builds one accessible SvelteKit site with two persistent, togglable
experiences (Premium 3D ⇄ Accessible) for Eman Rimawi's Diversity Includes Disability.
It follows the research's hard sequencing rules: prove a real GitHub Pages deploy under the
base path first (base-path/`.nojekyll`/`404.html` is the #1 launch-killer), stand up the
mode-state plumbing and token contract next, make the Accessible experience fully shippable
as a first-class render **before any 3D exists**, then layer Premium 3D behind a dynamic
`import()` boundary as an isolatable enhancement, and finish with SEO, a CI accessibility
gate, and live-URL verification at launch. Accessible mode is the reference render and always
wins; 3D is opt-in and ships zero WebGL to Accessible mode.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Deploy Proof** - Scaffold the static SvelteKit app and prove a hello-world live on the real Pages URL under the base path
- [ ] **Phase 2: Mode System & Design Tokens** - Persistent, accessible mode toggle with no-flash pre-paint theming and a WCAG-verified two-mode token contract
- [ ] **Phase 3: Accessible Experience** - All four pages of faithful DID content as one semantic DOM, gold-standard accessible, shipping zero WebGL
- [ ] **Phase 4: Premium 3D** - A tasteful Threlte hero loaded only on demand behind a dynamic import boundary, with graceful WebGL failure handling
- [ ] **Phase 5: Launch Hardening** - SEO/social meta, a blocking CI accessibility gate, and live verification of the finished site on GitHub Pages

## Phase Details

### Phase 1: Foundation & Deploy Proof
**Goal**: A scaffolded SvelteKit + `adapter-static` app is proven live on the real
`github.io/diversityincludesdisability_four/` URL, so all later work builds on validated,
base-path-correct hosting before any content or features exist.
**Depends on**: Nothing (first phase)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):
  1. A visitor can load a placeholder page at `https://<user>.github.io/diversityincludesdisability_four/` and every `_app/immutable` asset resolves with no 404s.
  2. A hard-refresh on a deep route on the deployed site resolves via the `404.html` SPA fallback instead of GitHub's generic 404, and `.nojekyll` keeps `_app/` from being dropped.
  3. Pushing to the repo triggers a GitHub Actions workflow that builds with pnpm (pinned Node 24) and auto-deploys to Pages, injecting `BASE_PATH` from the repo name.
  4. The build completes fully static via `adapter-static` with the correct `paths.base` and an explicit `trailingSlash` policy — no hardcoded leading-slash paths.
**Plans**: 2 plans

Plans:
- [x] 01-01-scaffold-static-config-ci-PLAN.md — Scaffold minimal static SvelteKit app, wire base-path/.nojekyll/404 config, author pnpm Pages deploy workflow, prove build locally (wave 1)
- [x] 01-02-remote-deploy-live-proof-PLAN.md — Rename to main, create public wolfwdavid remote, enable Pages, verify hello-world live under base path (wave 2)

### Phase 2: Mode System & Design Tokens
**Goal**: The dual-mode engine works end to end — a persistent, screen-reader-friendly toggle
flips between Premium and Accessible themes before first paint, driven by a single CSS
custom-property token contract with auditable contrast pairs.
**Depends on**: Phase 1
**Requirements**: MODE-01, MODE-02, MODE-03, MODE-04, MODE-05, DS-01, DS-02
**Success Criteria** (what must be TRUE):
  1. A keyboard-only user can reach and operate the header mode toggle (`<button aria-pressed>`) on every page, and the change is announced by a screen reader via a polite live region.
  2. The chosen mode persists across page loads and return visits (localStorage → `data-mode` on `<html>`), and switching preserves scroll position and focus (attribute flip, not navigation).
  3. On a first visit with no stored choice, a visitor whose OS requests `prefers-reduced-motion: reduce` or `prefers-contrast: more` lands in Accessible mode automatically.
  4. The correct mode is applied before first paint via the inline head script — no flash of the wrong mode for photosensitive/vestibular users.
  5. Both modes render from one token contract (`:root[data-mode]`) with WCAG-verified contrast pairs for the DID blue/orange palette (AAA in Accessible), with modes differing through tokens, not duplicated markup.
**Plans**: 3 plans

Plans:
- [x] 02-01-test-toolchain-and-validation-harness-PLAN.md — Install fonts + Playwright/axe/eslint toolchain, author playwright.config + eslint config + raw-hex gate + the 4 VALIDATION specs (wave 1)
- [x] 02-02-engine-core-tokens-app-html-store-PLAN.md — Verbatim AAA token contract, pre-paint no-flash script + JS-disabled fallback, Svelte 5 rune mode store (wave 2)
- [x] 02-03-toggle-layout-and-integration-verify-PLAN.md — Native ModeToggle, layout header + self-hosted fonts + aria-live announcer + OS listener, restyle home, drive full suite green (wave 3)

### Phase 3: Accessible Experience
**Goal**: The complete site — all four pages with faithful DID content — is fully usable,
perceivable, and operable in Accessible mode as a first-class, gold-standard render (scope.org.uk
pattern), shipping zero WebGL. This is the mission-critical baseline, proven independent of 3D.
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06, A11Y-07, A11Y-08, PREM-03
**Success Criteria** (what must be TRUE):
  1. A keyboard-only user can navigate all four pages (Home, About, Services, Connect) via visible-on-focus skip links and a logical tab order with no keyboard traps.
  2. Automated axe scans report zero violations, Accessible mode meets AAA body contrast (≥7:1) with larger base type, `:focus-visible` indicators, and ≥24×24px targets.
  3. A screen-reader user encounters correct landmarks (header/nav/main/footer), heading hierarchy, alt text (or `aria-hidden` for decorative), and accessible names — identical structure in both modes, with no info conveyed by color alone.
  4. A visitor can read Eman's story, the mission, and all four services, reach a labeled `mailto:emanrimawi@gmail.com` CTA, and use named social links — all from a single content source consumed by both modes, responsive and mobile-first.
  5. A public Accessibility Statement documents the conformance target, known issues, feedback path, and review cadence; no motion plays under reduced-motion; the Accessible hero shows a static poster with no loss of content.
**Plans**: 7 plans

Plans:
- [x] 03-01-content-source-and-gates-PLAN.md — Typed single content source site.ts + content/base-link + review-marker grep gates (wave 1)
- [x] 03-02-validation-specs-PLAN.md — Multi-route x multi-mode axe loop + skip-link/heading/target/alt/keyboard/content/responsive specs (wave 1)
- [x] 03-03-site-shell-PLAN.md — SkipLinks, SiteHeader (nav + disclosure + aria-current), SocialLinks, SiteFooter, extended layout (wave 2)
- [x] 03-04-content-components-PLAN.md — Static poster Hero (PREM-03) + heading-level-adaptive ServiceCard (wave 2)
- [x] 03-05-home-and-services-routes-PLAN.md — Home (CONT-01) + Services (CONT-03) routes (wave 3)
- [x] 03-06-about-contact-accessibility-routes-PLAN.md — About, Contact (mailto + social), Accessibility Statement (wave 3)
- [x] 03-07-integration-verify-PLAN.md — Drive full suite green + human keyboard/screen-reader a11y pass (wave 4)

### Phase 4: Premium 3D (NEEDS RESEARCH)
**Goal**: Premium mode adds one tasteful, restrained Threlte/Three.js hero loaded only on
demand behind a dynamic `import()` boundary, with zero WebGL leaking into the Accessible
bundle and graceful handling of WebGL failure and context loss.
**Depends on**: Phase 3
**Requirements**: PREM-01, PREM-02, PREM-04
**Research needed**: MEDIUM-confidence per research SUMMARY — Threlte single-persistent-canvas
structure, WebGL context-loss handling, disposal patterns, reduced-motion-inside-Premium, and
the actual hero scene design. Research complete → `04-RESEARCH.md` (HIGH-confidence boundary + scene design).
**Success Criteria** (what must be TRUE):
  1. In Premium mode on a capable device, a visitor sees a restrained, purposeful 3D hero with motion tied to the `--motion-duration` tokens (and no motion under reduced-motion, even in Premium).
  2. All `three`/`@threlte` code loads only via dynamic `import()` gated on Premium mode and is verifiably absent from the Accessible entry bundle (zero WebGL shipped to Accessible mode).
  3. When WebGL is unavailable or its context is lost, the site falls back to the static poster with no crash and no loss of content.
  4. Navigating away disposes the WebGL resources with no memory leak, and the 3D canvas is `aria-hidden` and removed from the tab order (no focus trap, no SR exposure).
**Plans**: 3 plans

Plans:
- [x] 04-01-boundary-harness-and-red-specs-PLAN.md — Install pinned three/@threlte, bundle-boundary gate + reduced-motion/WebGL helpers + RED premium e2e spec (wave 1)
- [x] 04-02-threlte-scene-island-PLAN.md — Three-free import boundary + Threlte scene (instanced particles/echo rings/blue-orange lights) + disposal/context-loss + Hero overlay (wave 2)
- [x] 04-03-drive-green-and-gates-PLAN.md — Drive bundle gate + premium runtime suite + axe regression green; human taste/comfort check (wave 3)

### Phase 5: Launch Hardening
**Goal**: The finished site passes an automated accessibility gate, carries correct SEO and
social-card metadata with absolute base-path URLs, and is verified live on GitHub Pages once
all base-path-sensitive links and assets exist.
**Depends on**: Phase 4
**Requirements**: SEO-01, QA-01, DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. Every page carries correct title/description meta and Open Graph/Twitter card tags with absolute URLs under the base path, passing social-card validators (prerendered `<svelte:head>`, static OG image).
  2. CI runs an accessibility gate (axe via Playwright in both modes) plus a Lighthouse budget, and the build fails on any a11y violation.
  3. The complete site is verified live under `/diversityincludesdisability_four/` — links, images, and `_app/immutable` chunks all resolve, including a deep-link hard refresh — proven with a real Pages deploy, not just local preview.
**Plans**: 5 plans

Plans:
- [x] 05-01-seo-meta-component-and-routes-PLAN.md — Seo.svelte + site.ts url/seo map + per-route <Seo> + head e2e + BASE_PATH build-grep (SEO-01) (wave 1)
- [ ] 05-02-og-image-and-local-fixes-PLAN.md — 1200x630 OG card + deterministic no-flash fix + HeroScene CSS hoist + CI worker cap (SEO-01, follow-ups 2&3) (wave 1)
- [ ] 05-03-lighthouse-budget-and-live-smoke-PLAN.md — lighthouserc.json (a11y>=0.95) + live-smoke.mjs, both proven locally (QA-01, DEPLOY-04) (wave 2)
- [ ] 05-04-ci-workflow-gate-and-retry-PLAN.md — deploy.yml verify(axe+lhci)->build->deploy(guarded retry)->smoke + check-ci-gate (QA-01, DEPLOY-04, follow-up 1) (wave 3)
- [ ] 05-05-regression-and-launch-verify-PLAN.md — aggregate test:launch green + push + live CI verify + human launch check (SEO-01, QA-01, DEPLOY-04) (wave 4)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Deploy Proof | 0/TBD | Not started | - |
| 2. Mode System & Design Tokens | 0/TBD | Not started | - |
| 3. Accessible Experience | 7/7 | Complete | 2026-07-05 |
| 4. Premium 3D | 0/3 | Planned | - |
| 5. Launch Hardening | 0/5 | Planned | - |
