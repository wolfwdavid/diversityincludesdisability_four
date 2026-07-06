# Diversity Includes Disability — Dual-Mode Site (diversityincludesdisability_four)

## What This Is

A modern, premium **SvelteKit** website for **Diversity Includes Disability (DID)**, the
intersectional disability-equity venture of **Eman Rimawi (Eman Rimawi-Doster)** — a faithful
rebuild of diversityincludesdisability.org. Its defining feature is **one site with two
togglable, persistent experiences**: a **Premium 3D** immersive mode (Threlte / Three.js,
parallax, motion) and an **Accessible** mode modeled on scope.org.uk (flat, high-contrast,
WCAG AAA-minded, reduced-motion, larger text, zero 3D shipped). The visitor chooses how they
experience the site — which is the point, for a disability-equity organization.

## Core Value

**A visitor can experience DID's mission and services in the mode that works for their body and
brain — and switch instantly, with the choice remembered.** The Accessible mode is not a
degraded fallback; it is a first-class, gold-standard experience. If everything else fails, the
site must remain fully usable, perceivable, and operable in Accessible mode.

## Current Milestone: v1.1 Real Content & Reach

**Goal:** Replace placeholder content with Eman's real words, add engagement surfaces, and cut
over to the real domain — human-gated items cleanly separated from work that can proceed now.

**Target features:**
- Contact form (progressive enhancement over mailto; Formspree/Web3Forms, no CAPTCHA; endpoint config-driven so it ships inert until a key exists)
- Podcast/media section (data-driven from site.ts; renders only when entries exist)
- Real content swap (Eman-gated): bio, pull-quote, social URLs, founder title — remove the matching Accessibility-Statement known-issues entries
- Custom-domain cutover to www.diversityincludesdisability.org (Eman-gated: registrar access + leave-Wix decision): CNAME, DNS runbook, `site.url` update, SEO gate re-run
- Donation mechanism (PayPal/Zeffy QR) stays deferred — still gated on 501(c)(3)/fiscal-sponsor status

## Requirements

### Validated

- ✓ Deploys to GitHub Pages under base path `/diversityincludesdisability_four` — Phase 1 (live, `.nojekyll` + 404 SPA fallback + CI deploy proven)
- ✓ Persistent, prominent mode toggle (Premium 3D ⇄ Accessible) that remembers the choice — Phase 2 (native `<button aria-pressed>`, localStorage, `aria-live` announce)
- ✓ No-flash pre-paint theming + `prefers-reduced-motion`/`prefers-contrast` auto-select Accessible — Phase 2
- ✓ AAA-verified two-mode CSS token contract, one accessible CSS-driven DOM, self-hosted fonts (Lexend + Source Sans 3) — Phase 2 (10/10 e2e, axe wcag2aaa clean both modes)
- ✓ Complete 5-page site (Home, About, Services, Contact, Accessibility Statement) with faithful DID content from a single content source — Phase 3
- ✓ Accessible mode content: WCAG 2.2 AA+ / AAA contrast, keyboard-complete, skip links, APG nav disclosure, semantic DOM, responsive — Phase 3 (57/57 e2e, axe wcag2aaa clean all 5 routes both modes)
- ✓ Static poster hero (PREM-03), zero WebGL shipped in Accessible mode — Phase 3

### Active

- ✓ Premium mode: Threlte/Three.js procedural hero (luminous-depth particle field + echo rings), lazy-loaded so Accessible mode ships zero WebGL — Phase 4 (bundle boundary grep-proven, dispose leak-free, context-loss→poster, axe clean both modes, 64/64 e2e)
- ✓ SEO/social meta (absolute base-path OG/Twitter/canonical + 1200×630 OG card) on all routes — Phase 5 (SEO-01)
- ✓ CI accessibility+Lighthouse gate (axe both modes + a11y≥0.95) fail-closed before deploy, guarded deploy retry, post-deploy live smoke — Phase 5 (QA-01, DEPLOY-04); full pipeline verify→build→deploy→smoke green
- [ ] Home page: hero, mission, the 4 services, founder credibility, "Let's Connect" CTA
- [ ] About Me page: Eman's story and disability-equity work
- [ ] Services detail: Trainings & Facilitation, Consulting, Modeling for Representation, Speaking/Panels
- [ ] "Let's Connect" contact CTA (email emanrimawi@gmail.com) + social links (Facebook, Twitter/X, LinkedIn, Instagram)
- [ ] Responsive (mobile-first) and fast; static build

### Out of Scope

- CMS / backend — static content site; no auth, no database (matches the org's needs and gh-pages hosting)
- Donation/podcast integrations — deferred; the paused Rimawi RESUME.md tracks these for a later milestone
- Grant tracker — lives separately in `Websites/Rimawi/`, not part of this public site
- E-commerce / login — the current Wix site's "Log In" is not carried over
- Any plaintext credentials/EINs/addresses from the private Notion source — never committed here

## Context

- **Reference (content):** https://www.diversityincludesdisability.org (current Wix site). Org name,
  founder Eman Rimawi, 4 services, "Let's Connect" CTA (emanrimawi@gmail.com), social links, © 2024.
- **Reference (accessibility gold standard):** https://www.scope.org.uk — skip links (main/search/nav),
  clear IA, dedicated accessibility page, multiple contact methods, strong focus states, hierarchical nav.
- **Sibling variants:** `diversityincludesdisability_one` and `_three` exist as empty `.planning` scaffolds;
  `_four` is the real build. Related consulting context lives in `Websites/Rimawi/` (grant tracker, paused).
- **Design intelligence:** use the `ui-ux-pro-max` skill for the design system (palette, type, layout).
  DID brand leans blue/orange, low-vision-friendly (per prior grant-tracker work).
- **Security:** the private Notion source has plaintext creds/EIN/home address — deliberately excluded.
  This folder sits inside a git tree with some public remotes; commit only site code + public content.

## Constraints

- **Tech stack**: SvelteKit + `adapter-static` — required for GitHub Pages static hosting
- **3D**: Threlte (declarative Three.js for Svelte), lazy-loaded/code-split — Accessible mode must ship zero WebGL/Three.js
- **Package manager**: pnpm (this website family's convention; npm has caused issues before)
- **Hosting**: GitHub Pages, base path `/diversityincludesdisability_four`; needs SPA fallback (404.html) + `.nojekyll`
- **Accessibility**: WCAG 2.2 AA is the floor; Accessible mode targets AAA contrast + reduced motion + keyboard-complete
- **Node**: v24 available locally; pin engines/`.nvmrc` for reproducible CI builds
- **Performance**: Accessible-first payload must be light; 3D assets load only on demand in Premium mode

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One site, two persistent modes (not two sites) | Same content, no drift; on-theme "choose your experience"; simpler maintenance | — Pending |
| Threlte + Three.js for Premium 3D | Modern declarative 3D for Svelte, tree-shakeable, works with static export | — Pending |
| Real DID content (faithful rebuild) | This is a real org rebuild, not a demo | — Pending |
| adapter-static + base path for gh-pages | Only viable path for GitHub Pages hosting of SvelteKit | — Pending |
| Accessible mode ships zero 3D (lazy-load Premium) | Accessibility + performance; WebGL is opt-in | — Pending |
| Auto-select Accessible on `prefers-reduced-motion`/`prefers-contrast` | Respect OS-level accessibility signals by default | — Pending |
| Premium aesthetic = "Luminous depth" (dark #0a0e14, blue/orange glow, ambient 3D, glass cards) | Modern/premium without being loud; reduced-motion strips animation | — Pending |
| Accessible aesthetic = flat white/#111, AAA contrast, no motion (scope.org.uk-like) | Gold-standard, first-class baseline | — Pending |
| Brand palette = DID blue + orange, AAA-safe pairs derived per mode | Preserve org identity (matches grant-tracker work) | — Pending |
| Deploy foundation shipped: base-path/.nojekyll/404/CI proven live | De-risk the #1 launch-killer before content | ✓ Good (Phase 1) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-06 — v1.1 "Real Content & Reach" milestone started (v1.0 archived to MILESTONES.md). Handoff to Eman drafted at Websites/Rimawi/HANDOFF-EMAN-website.md.*
