# Requirements: Diversity Includes Disability — Dual-Mode Site

**Defined:** 2026-07-04
**Core Value:** A visitor can experience DID's mission and services in the mode that works for their body and brain — and switch instantly, with the choice remembered. Accessible mode is first-class, not a fallback.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Mode System

- [ ] **MODE-01**: Visitor can toggle between "Premium 3D" and "Accessible" modes via a native, keyboard-operable control (`<button aria-pressed>`) present in the header on every page
- [ ] **MODE-02**: The chosen mode persists across pages and return visits (localStorage), applied via a `data-mode` attribute on `<html>`
- [ ] **MODE-03**: Mode is applied before first paint with no flash of the wrong mode (render-blocking inline head script reads stored choice / OS signal)
- [ ] **MODE-04**: When no explicit choice is stored, Accessible mode is auto-selected if the OS signals `prefers-reduced-motion: reduce` or `prefers-contrast: more`
- [ ] **MODE-05**: Switching mode announces the change to assistive tech via a polite live region and preserves scroll position and focus (attribute flip, not navigation)

### Accessibility

- [ ] **A11Y-01**: Every page exposes visible-on-focus skip links (skip to main content, skip to navigation)
- [ ] **A11Y-02**: All content is delivered in one semantic DOM with correct landmarks (header/nav/main/footer), heading hierarchy, and accessible names — identical structure in both modes
- [ ] **A11Y-03**: Accessible mode meets WCAG 2.2 AA, targeting AAA contrast (≥7:1 body text) and larger base type; verified by automated axe scans with zero violations
- [ ] **A11Y-04**: All interactive elements have a clearly visible `:focus-visible` indicator meeting WCAG 2.2 focus-appearance, and interactive targets are ≥24×24px (SC 2.5.8)
- [ ] **A11Y-05**: The entire site is operable by keyboard alone with a logical tab order and no keyboard traps (including any decorative 3D, which is removed from tab order and hidden from screen readers)
- [ ] **A11Y-06**: All non-text content has appropriate text alternatives (alt text / `aria-hidden` for decorative), and no information is conveyed by color alone
- [ ] **A11Y-07**: A public Accessibility Statement page documents conformance target, known issues, feedback path, and review cadence (scope.org.uk pattern)
- [ ] **A11Y-08**: No motion plays when `prefers-reduced-motion: reduce` is set, in either mode; Premium motion is opt-in and pausable

### Content & Pages

- [ ] **CONT-01**: Home page presents hero, mission statement, the 4 services overview, founder credibility, and a "Let's Connect" CTA
- [ ] **CONT-02**: About page tells Eman Rimawi's story and intersectional disability-equity work
- [ ] **CONT-03**: Services are presented (Trainings & Facilitation, Disability Consulting, Modeling for Representation, Speaking/Panels), each with a clear description
- [ ] **CONT-04**: A "Let's Connect" contact section provides a labeled `mailto:` to emanrimawi@gmail.com as the primary contact method (no backend)
- [ ] **CONT-05**: Social links (Facebook, Twitter/X, LinkedIn, Instagram) are present with accessible names, as static links (no live-feed widgets)
- [ ] **CONT-06**: All site copy comes from a single content source module consumed by both modes (no forked/duplicated content)
- [ ] **CONT-07**: Layout is responsive and mobile-first across common breakpoints

### Design System

- [ ] **DS-01**: A CSS custom-property token contract defines both modes' color/type/spacing, with WCAG-AAA-verified contrast pairs for the DID blue/orange palette
- [ ] **DS-02**: Modes differ almost entirely through tokens/CSS driven by `data-mode` (not duplicated markup), keeping one auditable accessible DOM

### Premium 3D

- [ ] **PREM-01**: Premium mode renders a tasteful Threlte/Three.js hero experience with restrained motion
- [ ] **PREM-02**: All `three`/`@threlte` code is loaded only via dynamic `import()` gated on Premium mode, verified absent from the Accessible entry bundle (zero WebGL shipped to Accessible mode)
- [ ] **PREM-03**: Accessible mode (and any WebGL failure / reduced-motion) shows a static poster image in place of the 3D hero, with no loss of content
- [ ] **PREM-04**: The 3D scene disposes its WebGL resources on navigation/unmount and handles context loss gracefully (no leaks, no crash)

### Build & Deploy

- [ ] **DEPLOY-01**: The site builds fully static via `adapter-static` with all routes prerendered and correct `paths.base` for the `/diversityincludesdisability_four` subpath
- [ ] **DEPLOY-02**: Deploy artifacts include `static/.nojekyll` and a `404.html` SPA fallback so `_app/` assets and deep links resolve on GitHub Pages
- [ ] **DEPLOY-03**: A GitHub Actions workflow builds with pnpm and deploys to GitHub Pages (`upload-pages-artifact` + `deploy-pages`), injecting `BASE_PATH` from the repo name
- [ ] **DEPLOY-04**: The deployed site is verified live under the base path (links, images, `_app/immutable` chunks all resolve) — proven with a real Pages deploy, not just local preview

### Quality Gates (SEO & CI)

- [ ] **SEO-01**: Each page has correct title/description meta and Open Graph/Twitter card tags with absolute URLs under the base path
- [ ] **QA-01**: CI runs an automated accessibility gate (axe via Playwright in both modes) and a Lighthouse budget; the build fails on a11y violations

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Contact & Engagement

- **CONT2-01**: Progressive-enhancement contact form via a static-friendly backend (Formspree/Web3Forms), no CAPTCHA
- **CONT2-02**: Donation mechanism (PayPal/Zeffy QR) — from the paused Rimawi RESUME.md
- **CONT2-03**: Podcast links / media section

### Content Authoring

- **AUTH2-01**: Long-form content via mdsvex if content volume grows

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| CMS / backend / database | Static content site; matches org needs + gh-pages hosting |
| User accounts / login | Current Wix "Log In" not carried over; no auth surface on a static site |
| E-commerce | Not part of the org's offering for this site |
| Accessibility-overlay widget | scope.org.uk deliberately omits these; a11y is built into base markup, not bolted on |
| In-page text-resize/contrast toolbar | Deferred (P3 judgment call); rely on native modes + OS tools per scope's approach |
| Live social-feed embeds | Performance + a11y cost; static links instead |
| Grant tracker | Lives separately in `Websites/Rimawi/`; not part of the public site |
| Any PII from the private Notion source | Security — never committed to this repo |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (filled by roadmapper) | | |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: (pending roadmap)
- Unmapped: (pending roadmap)

---
*Requirements defined: 2026-07-04*
*Last updated: 2026-07-04 after initial definition*
