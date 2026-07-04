# Project Research Summary

**Project:** Diversity Includes Disability — Dual-Mode Site (diversityincludesdisability_four)
**Domain:** Disability-equity advocacy / personal-brand site; static SvelteKit, dual-mode (Premium 3D ⇄ Accessible), GitHub Pages under a base path
**Researched:** 2026-07-04
**Confidence:** HIGH

## Executive Summary

This is a faithful rebuild of a real disability-equity organization's site (Eman Rimawi's Diversity Includes Disability) whose defining feature is **one site, two persistent, togglable experiences**: an immersive Premium 3D mode (Threlte/Three.js) and a gold-standard Accessible mode modeled on scope.org.uk. The four research streams converge on a single, opinionated architecture: **build ONE accessible semantic DOM and express the two modes as a CSS-theming problem driven by a `data-mode` attribute on `<html>`, reading from a single mode-agnostic content source.** This is not two component trees — duplicating trees is explicitly the #1 architectural risk because the modes inevitably drift and the Accessible render degrades into a stale second-class citizen, which would be a mission failure for this specific org. Accessibility here is not compliance; it is the product demo, and the Accessible mode is the reference render that always wins when the two conflict.

The recommended stack is verified and pinned (Svelte 5 runes, SvelteKit 2 + `adapter-static`, Vite 8, Threlte 8, pnpm, Node 24; full a11y CI toolchain of axe + Playwright + Lighthouse CI). Five cross-cutting agreements bind the build together: (1) **one accessible DOM + two CSS token sets** keyed on `data-mode`, single content source; (2) a **render-blocking inline no-flash script in `app.html`** is mandatory — on static hosting there is no server to read the user's preference, so this is the only way to set the correct mode before first paint; (3) **all 3D lives behind a dynamic `import()` boundary** — this is the ONLY thing that keeps Accessible mode at literal zero WebGL, and a single stray top-level `three`/`@threlte` import anywhere in the shared graph defeats it; (4) **base-path + `.nojekyll` + `404.html`** is the #1 launch-killer and must be proven with a real GitHub Pages deploy in Phase 1, not `vite preview`; (5) **the mode toggle is the highest-stakes a11y control** — a native `<button aria-pressed>`, `aria-live` announcement on switch, focus preserved, verified with a real screen reader.

The key risks are all preventable if addressed at the right phase. Content drift, mode flash, 3D bundle leakage, an inaccessible toggle, and base-path 404s each have a known, cheap prevention when built correctly up front, but a high, cascading recovery cost if retrofitted late (contrast/token rework and base-path sweeps are the most expensive). The research therefore recommends a **4-phase build order — Foundation → Content & Accessibility → Premium & 3D → Build & Deploy** — whose central rationale is that **Accessible mode is fully shippable before any 3D work exists**, guaranteeing the mission-critical baseline is proven independent of WebGL.

## Key Findings

### Recommended Stack

Verified live against the npm registry and official svelte.dev docs on 2026-07-04 (HIGH confidence — real version numbers, not training data). The stack is a standard modern SvelteKit static site plus a strictly-isolated 3D layer and a heavy accessibility/quality CI toolchain. Styling is deliberately **vanilla CSS + custom properties (no Tailwind)** because the two modes are fundamentally a theming problem and the defining requirement is precise, auditable WCAG contrast tokens.

**Core technologies:**
- **svelte 5.56.4 (runes)** — UI framework; `$state`/`$derived`/`$effect` give the fine-grained reactivity ideal for a shared persistent mode store. Do NOT use Svelte 4 syntax.
- **@sveltejs/kit 2.69.1 + @sveltejs/adapter-static 3.0.10** — static prerender to plain HTML/CSS/JS for GitHub Pages; `paths.base`, `fallback: '404.html'`, base-aware `$app/paths`.
- **vite 8.1.3** — bundler; native dynamic-`import()` code-splitting is the mechanism that keeps Three.js out of the Accessible bundle.
- **three 0.185.1 + @threlte/core 8.5.16 + @threlte/extras 9.21.0** — declarative Svelte-5-native 3D, confined to a lazy-loaded island. Keep `three` ↔ `@types/three` minors locked.
- **pnpm 11.10.0 / Node 24** — project convention (npm has caused issues in this website family); pin via `packageManager` + `.nvmrc`.
- **a11y CI toolchain:** `@axe-core/playwright` + `playwright` + `@lhci/cli` + `eslint-plugin-svelte` + `svelte-check` — the automated WCAG gate (assert zero axe violations and accessibility score = 1.0 in BOTH modes).

Full GitHub Pages config (svelte.config.js base-path switch, `.nojekyll`, official Pages Actions workflow with `BASE_PATH` from repo name) is verified in STACK.md.

### Expected Features

Framing from FEATURES.md: for a disability-equity org, accessibility features are simultaneously table-stakes obligations AND the credibility signal — the Accessible mode IS the demo. scope.org.uk (the stated gold standard) deliberately ships NO accessibility-overlay widget; our dual-mode toggle is defensible only because it is a genuine alternate render, not a bolt-on.

**Must have (table stakes):**
- Clear IA + 4 routes (Home, About Me, Services, Connect) with faithful DID content (mission, 4 services, founder bio) — users expect this
- Flawless Accessible base render: skip links (scope's pattern), semantic landmarks, `:focus-visible`, AA/AAA contrast, keyboard-complete/no-traps, reduced-motion, target size ≥24px — this must be flawless; it is the demo
- Labeled `mailto:` "Let's Connect" CTA + social links with real accessible names (no icon-only)
- Accessibility statement page (conformance target, known-issues log, feedback path) — doubly expected for this org
- Static build → GitHub Pages (base path, 404 fallback, `.nojekyll`)

**Should have (competitive differentiators):**
- Persistent Premium 3D ⇄ Accessible mode toggle (`aria-pressed`, not an overlay) with `aria-live` announcement on switch — the signature idea
- OS-signal auto-select: `prefers-reduced-motion`/`prefers-contrast` → Accessible by default (logical-OR with stored choice; explicit choice can override upward)
- Accessible mode as a first-class polished render, not a degraded fallback
- Tasteful, guarded Premium 3D hero (lazy, pausable, poster fallback, reduced-motion-aware, keyboard-safe)

**Defer (v1.x / v2+):**
- Optional third-party contact form (Formspree/Web3Forms) — only if mailto friction is reported
- In-page text-size/contrast controls — scope deliberately delegates these to OS tools; lower priority than nailing base a11y
- WebGPU renderer path; richer 3D on service pages; donation/podcast integrations (deferred per PROJECT.md); search; blog

**Anti-features (reputationally disqualifying here):** accessibility-overlay widgets, autoplay motion/audio, parallax/scroll-jacking, focus-trapping 3D, low-contrast "trendy" design, content that only exists in the 3D layer, CAPTCHA, and committing any PII/EIN/creds from the private Notion source.

### Architecture Approach

Build one accessible DOM themed by a single `data-mode` attribute on `<html>`; treat Premium vs Accessible as a presentation-layer difference (CSS tokens + a couple of swapped hero components), NOT two parallel trees. The only hard code-split boundary in the whole app is the 3D. `lib/content/*` is a single typed source of truth consumed by mode-agnostic semantic components, so the modes can never drift. `lib/components/premium/` is the only folder allowed to import `three`/`@threlte`, making the split boundary greppable and review-enforceable.

**Major components:**
1. **Inline `app.html` no-flash script** — synchronous IIFE reads localStorage + `matchMedia`, sets `data-mode` pre-paint; wraps in try/catch defaulting to `accessible`. Mandatory on static hosting.
2. **`mode.svelte.ts` rune store** — runtime source of truth; initializes FROM the attribute the inline script set (script owns priority logic, store owns writes: `$state`, localStorage, mirror `data-mode`).
3. **CSS token layer (`app.css`)** — `:root[data-mode="premium|accessible"] { --* }` does ~90% of the visual work; one file an auditor can diff in isolation; hard motion kill-switch.
4. **Shell (SkipLinks, Nav, ModeToggle, Announcer)** — mode-agnostic chrome; toggle flips attribute in place (no navigation, so scroll/focus preserved) and announces via `aria-live` polite region.
5. **`PremiumHero` boundary + `HeroScene` island** — `{#if premium}{#await import('./HeroScene')}` → poster in Accessible, lazy Threlte chunk in Premium; canvas is `aria-hidden`, real hero content lives in semantic DOM outside it.

### Critical Pitfalls

Reputational-stakes note from PITFALLS.md: an a11y defect on THIS site is a mission failure, not a bug — treat every a11y pitfall as release-blocking. Top items:

1. **Base-path breakage (#1 launch-killer)** — hardcoded `/` links, `<img src>`, and `_app/immutable/*` chunks 404 on Pages while working perfectly on localhost. Prevent: `paths.base` from `BASE_PATH` env, never hardcode leading-slash paths, use `{base}`/`%sveltekit.assets%`, `paths: { relative: true }`, and deploy a hello-world to the REAL Pages URL in Phase 1. Recovery is a frantic MEDIUM-cost link sweep if found at launch.
2. **Missing `.nojekyll` + SPA `404.html`** — Jekyll silently drops `_app/` (leading underscore) and deep links hit GitHub's generic 404. Prevent: empty `static/.nojekyll` + `fallback: '404.html'`; verify with a hard refresh on a deep route on the real host.
3. **Mode flash (FOUC-of-mode)** — reading persisted preference in `onMount` runs after first paint, flashing the wrong mode; for photosensitive/vestibular users a flash is actual harm. Prevent: the blocking inline head script sets `data-mode` before paint; store initializes from that attribute so hydration doesn't re-flip.
4. **Three.js bundle leak into Accessible build** — a single top-level `import` of `three`/`@threlte` in shared code pulls ~150KB+ WebGL into the Accessible bundle, violating the core promise and slowing exactly the low-end/AT users the mode targets. Prevent: confine all 3D imports to `lib/components/premium/` reached only via `import()`; assert with a bundle visualizer that `three` is absent from the entry chunk.
5. **Inaccessible mode toggle** — building the flagship control as a `<div on:click>` with no role, keyboard support, or `aria-live` announcement fails the exact audience the site is for. Prevent: native `<button aria-pressed>`, accessible name, `aria-live` polite announce, visible focus in both modes; test with NVDA/VoiceOver as an acceptance gate.

Also critical and phase-mapped: prerender/trailingSlash failures (Phase 1); reduced-motion/contrast auto-select wiring (a stated requirement, not polish); dark-Premium contrast/`:focus-visible`/semantics (token-level, decide up front — HIGH recovery cost); 3D canvas focus-trap/SR exposure, WebGL memory leaks + context-loss/no-WebGL fallback (3D phase); Svelte 5 runes reactivity traps (Foundation store pattern); SEO/social-card meta needing prerendered absolute URLs (launch phase); and image-alt/label/link-name baseline WCAG (every content phase, axe in CI).

## Implications for Roadmap

Research converges on a **4-phase build order**. The central rationale: theme/state plumbing must exist before content so pages are mode-aware from day one; **Accessible mode ships fully before any 3D work** so the guaranteed-usable baseline is proven independent of WebGL; deploy is validated last once base-path-sensitive links are stable (but base-path config and a real-URL smoke test happen in Phase 1).

### Phase 1: Foundation (scaffold, mode system, deploy proof)
**Rationale:** Base-path, no-flash, the rune store pattern, and the code-split architecture must all be decided up front — each is cheap now and painful/cascading to retrofit. A real Pages deploy must happen day 1, before features.
**Delivers:** SvelteKit + adapter-static + pnpm/Node pin; `svelte.config.js` base-path switch; inline `app.html` no-flash script; `mode.svelte.ts` rune store; `app.css` two-mode token contract; layout shell with SkipLinks + ModeToggle + Announcer; `.nojekyll` + `404.html`; a "hello world" proven on the real `github.io/diversityincludesdisability_four/` URL. Mode toggle flips themes with zero flash and no 3D yet.
**Addresses:** Persistent mode toggle, OS-signal auto-select, static GH-Pages deploy config.
**Avoids:** Base-path 404 (#1), `.nojekyll`/SPA-fallback, mode flash, inaccessible toggle, Svelte 5 runes traps, prerender/trailingSlash — all the day-1-or-never pitfalls.

### Phase 2: Content & Accessibility (Accessible mode as gold standard)
**Rationale:** Accessible mode is the reference render and the demo; it must be fully shippable before 3D exists, so build it as first-class, not a stripped Premium.
**Delivers:** `lib/content/*` single source; all 4 routes (Home/About/Services/Connect) as one semantic DOM; static `<picture>` poster hero; labeled mailto CTA + accessible social links; accessibility statement page; WCAG 2.2 AA+ (AAA contrast in Accessible mode) pass; keyboard + screen-reader audit; reduced-motion/contrast defaults verified.
**Addresses:** IA + content rebuild, flawless Accessible base render, contact/social, accessibility statement.
**Uses:** vanilla CSS token layer; mode-agnostic `content/` components. **Implements:** the shell content sections + single content source (no-drift decision).

### Phase 3: Premium & 3D (the opt-in enhancement)
**Rationale:** With the guaranteed-usable baseline shipped, layer 3D behind the isolated boundary; the architecture (lazy `import()`) was already fixed in Phase 1 so it isn't retrofitted.
**Delivers:** `PremiumHero` boundary + `HeroScene` Threlte island via `import()`; tasteful motion tied to `--motion-duration` tokens; poster/`{#await}` pending state; reduced-motion branch even inside Premium; single persistent canvas + dispose; WebGL context-loss / no-WebGL graceful fallback.
**Uses:** three/@threlte/extras/motion. **Implements:** the only code-split island; canvas `aria-hidden`, out of tab order.
**Avoids:** Three.js bundle leak (verify no `three` in entry chunk), canvas focus-trap/SR exposure, WebGL memory leaks + context exhaustion, motion ignoring reduced-motion.

### Phase 4: Build & Deploy (launch polish)
**Rationale:** Base-path-sensitive links and meta are only fully verifiable once all pages/assets exist; validate on the real host last.
**Delivers:** prerender all routes clean; base-path link/asset audit (grep output for stray `/`); prerendered `<svelte:head>` SEO + OG/Twitter meta with ABSOLUTE URLs; static OG image; sitemap/robots; a11y CI gate (axe + Playwright + Lighthouse CI, zero violations both modes) blocking deploy; GH Pages publish + smoke-test the DEPLOYED URL including deep-link refresh; social-card validators.
**Addresses:** SEO/social cards, final launch. **Avoids:** SEO/social-card failures, base-path regressions, secrets-in-repo (diff discipline throughout).

### Phase Ordering Rationale
- **Dependencies:** the mode store + `data-mode` + token contract are prerequisites for every mode-aware component, so Foundation is first. Content depends on the shell but not on 3D. 3D depends on the lazy boundary being in place. Deploy validation depends on all links/assets existing.
- **Architecture grouping:** the one-DOM/two-themes decision means Accessible and Premium share components, so content is built once (Phase 2) and only the hero is component-swapped (Phase 3) — no duplication.
- **Pitfall avoidance:** the most expensive-to-recover pitfalls (contrast/token rework HIGH; base-path sweep MEDIUM; 3D-bundle-split MEDIUM) are all forced to the front (token contract + base path + lazy boundary in Phase 1–2), so nothing costly is retrofitted late.

### Research Flags

Phases likely needing deeper research (`/gsd:research-phase`) during planning:
- **Phase 3 (Premium & 3D):** the highest-uncertainty area. Threlte single-persistent-canvas structure, WebGL context-loss handling, disposal patterns, reduced-motion-inside-Premium, and the specific hero scene design carry MEDIUM-confidence runtime details and benefit from a focused pass (plus the `ui-ux-pro-max` skill for the actual scene design).

Phases with standard, well-documented patterns (can likely skip research-phase):
- **Phase 1 (Foundation):** base-path/`.nojekyll`/`404.html`/no-flash-script/runes-store are all HIGH-confidence, verified against official docs with working code samples in STACK/ARCHITECTURE/PITFALLS.
- **Phase 2 (Content & Accessibility):** WCAG 2.2 + scope.org.uk patterns are canonical and well-specified.
- **Phase 4 (Build & Deploy):** the official Pages Actions flow and prerendered-meta pattern are documented; mostly execution + verification.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions pulled live from npm registry + peer manifests on 2026-07-04; gh-pages config verified against official svelte.dev docs. Styling/animation-lib choice is MEDIUM (opinionated but well-reasoned). |
| Features | HIGH | A11y patterns verified against WCAG 2.2 + scope.org.uk live statement; 3D/static-form patterns MEDIUM (multi-source WebSearch). |
| Architecture | HIGH | Patterns verified against SvelteKit official docs + Threlte/Svelte-5 idioms; a few runtime-behavior details MEDIUM. |
| Pitfalls | HIGH | Base-path, theme-flash, runes, and Threlte-disposal facts verified against official docs + open sveltejs/kit issues; a11y guidance is canonical WCAG 2.2 / APG. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact Premium 3D hero design/content** — research establishes the isolation architecture and safety rules but not the actual scene (geometry, motion language, brand expression). Handle during Phase 3 planning using the `ui-ux-pro-max` skill; keep it restrained (one purposeful hero moment, <100 draw calls / 60fps target).
- **Contrast token values** — AA-in-Premium / AAA-in-Accessible is required, but the specific blue/orange DID palette pairs must be run through a contrast checker and fixed in the Phase 1/2 token contract (HIGH recovery cost if deferred). DID brand leans blue/orange, low-vision-friendly per prior grant-tracker work.
- **Contact form decision** — mailto is the confirmed primary; whether to add a third-party form backend depends on real-world mailto-friction feedback post-launch (v1.x trigger).
- **In-page text/contrast controls** — judgment call; scope delegates to OS tools. Defer unless feedback shows demand.
- **`trailingSlash` policy** — pick explicitly in Phase 1 (`'always'` is often most predictable for Pages subfolder hosting) and keep consistent.
- **Content fidelity** — faithful rebuild of diversityincludesdisability.org (Wix); confirm the 4 services and bio copy against the live source, and NEVER pull PII/EIN/creds from the private Notion source.

## Sources

### Primary (HIGH confidence)
- npm registry (`registry.npmjs.org/<pkg>/latest` + peer manifests), queried 2026-07-04 — all stack version numbers and compatibility ranges.
- svelte.dev — `adapter-static` / GitHub Pages guide (base path, `fallback: '404.html'`, `.nojekyll`, `prerender = true`, `paths.base` dev/prod switch); SvelteKit configuration; Svelte 5 migration guide (runes export restrictions); `$derived`.
- WCAG 2.2 (W3C) — new SCs 2.4.11, 2.4.13, 2.5.8 Target Size, 3.2.6 Consistent Help, 3.3.7/3.3.8; plus canonical 1.1.1, 1.4.3, 1.4.11, 2.1.2, 2.3.3, 2.4.1, 2.4.7, 3.3.2, 4.1.2/4.1.3.
- scope.org.uk accessibility statement (live, Nov 2025) — skip links, WCAG 2.2 AAA aim, 6-month testing, known-issues + feedback, delegated personalization (no overlay).
- GOV.UK Design System — skip-link + focus-state reference patterns.
- Threlte docs — single persistent canvas / portal via snippets; Svelte-5-native Threlte 8.
- Open sveltejs/kit issues (#4528, #6767, #10358, #13954) — base-path / `_app` chunk 404 failure modes.

### Secondary (MEDIUM confidence)
- No-flash SSR theme-switching writeups (JovianMoon, swyx, Captain Codeman, David W Parker) — blocking inline head-script pattern.
- Svelte 5 runes lazy-loading via `import()` + `{#await}` (richardfu.net); prefers-reduced-motion store in Svelte (geoffrich.net).
- Three.js best-practices + SvelteKit integration (draw calls, Draco, dispose in onDestroy, context limits); three.js #18759 memory leak.
- Static-site contact-form landscape (Formspree/Web3Forms/Static Forms; GH Pages needs external backend); ARIA live-region + accessible-toggle guidance.

### Tertiary (LOW confidence)
- Styling recommendation (vanilla CSS custom properties over Tailwind) and animation-library choice — opinionated, driven by the WCAG-AAA-contrast + light-Accessible-payload requirements rather than a single citable source; validate in the Phase 1 token contract.

---
*Research completed: 2026-07-04*
*Ready for roadmap: yes*
