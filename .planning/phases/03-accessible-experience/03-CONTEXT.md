# Phase 3: Accessible Experience — Context (Content + A11y Contract)

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Source:** User decisions (content approach + design) + diversityincludesdisability.org structure

<domain>
## Phase Boundary

Build the complete four-page site with faithful DID content as ONE semantic, gold-standard
accessible DOM (zero WebGL). Consumes the Phase 2 mode engine + tokens. The Premium theme still
applies (dark/glass via tokens) but NO Threlte/3D yet — the hero uses the static poster fallback
(PREM-03). Accessible mode must be a flawless scope.org.uk-caliber experience.

Pages: Home (`/`), About (`/about`), Services (`/services`), Contact (`/contact`).
</domain>

<content_rules>
## Content authenticity rules (LOCKED)

- This is a REAL activist's professional site. Do NOT invent specific credentials, quotes,
  statistics, dates, client names, or biographical claims.
- Write professional draft copy in DID's voice from the public facts below. Anything requiring
  Eman's real words carries a visible-in-source `[REVIEW: …]` marker (in a code comment in the
  content module, NOT rendered to users) so Eman/Stefanie can confirm or replace it.
- Single content source (CONT-06): all copy lives in `src/lib/content/site.ts` (typed), imported
  by every page. No copy hardcoded in page markup; no forked strings between modes.
</content_rules>

<content>
## Verified public facts (from diversityincludesdisability.org)

- **Org name:** Diversity Includes Disability (DID)
- **Founder:** Eman Rimawi (also Eman Rimawi-Doster)
- **Tagline:** "Diversity Includes Disability" — intersectional disability equity & representation
- **Four services:**
  1. Intersectional Disability Equity & Inclusion — trainings & facilitation
  2. Disability Consulting
  3. Modeling for Representation
  4. Speaker & Panelist engagements
- **Primary contact:** emanrimawi@gmail.com — CTA phrase "Let's Connect"
- **Social:** Facebook, Twitter/X, LinkedIn, Instagram (URLs `[REVIEW: confirm handles]`)
- **Copyright:** © Diversity Includes Disability (current year)

## Draft copy (professional, no invented specifics)

### Home
- **Hero headline:** "Diversity Includes Disability"
- **Hero subhead:** "Intersectional disability equity, inclusion, and representation — training,
  consulting, and speaking that move organizations from awareness to action."
- **Mission (short):** "Disability belongs in every conversation about diversity. Diversity Includes
  Disability partners with organizations, institutions, and audiences to build accessibility and
  belonging into the way they work — not as an afterthought, but as a foundation."
- **Services overview:** 4 cards (title + one-line each), link to /services.
- **Founder strip:** name + role ("Founder & Lead Consultant `[REVIEW: confirm title]`") + short
  positioning line + link to /about. `[REVIEW: bio specifics]`
- **CTA band:** "Let's Connect" → /contact.

### About (`/about`)
- **Heading:** "About Eman Rimawi"
- **Body scaffold** (2–3 short paragraphs, role-based, NO invented biography):
  - Para 1 — who DID is and what it does (mission, expanded).
  - Para 2 — `[REVIEW: Eman's personal story / lived experience / credentials — to be provided]`
    placeholder paragraph with generic-but-true framing of intersectional disability advocacy.
  - Para 3 — approach: intersectional, lived-experience-informed, action-oriented.
- Pull-quote block: `[REVIEW: real quote from Eman]` — render only if provided; otherwise omit.

### Services (`/services`)
- **Intro line:** how DID works with partners.
- **Four sections** (h2 each), accurate generic descriptions:
  1. **Trainings & Facilitation** — interactive sessions on intersectional disability equity &
     inclusion for teams, leadership, and institutions; from foundational awareness to applied practice.
  2. **Disability Consulting** — advisory partnership to embed accessibility and disability
     inclusion into policy, programs, events, and culture.
  3. **Modeling for Representation** — authentic disability representation in campaigns and media
     that reflects real people, not stereotypes.
  4. **Speaking & Panels** — keynotes, panels, and moderated conversations on disability, equity,
     and belonging for conferences and organizations.
- Each: short description + "Let's Connect" link. `[REVIEW: rates/formats if DID wants them]`

### Contact (`/contact`)
- **Heading:** "Let's Connect"
- **Primary:** labeled `mailto:emanrimawi@gmail.com` (visible, accessible-named link — no backend).
- **Social links:** named list (icon + visible text label), `[REVIEW: URLs]`.
- Short line inviting trainings/consulting/speaking inquiries.
</content>

<a11y_contract>
## Accessibility contract (scope.org.uk caliber) — the requirements

- **A11Y-01 skip links:** visible-on-focus "Skip to main content" + "Skip to navigation" first in DOM.
- **A11Y-02 semantic DOM:** one `<header><nav><main><footer>` per page; correct heading order
  (single h1/page); accessible names on all controls/links; landmarks labeled where repeated.
- **A11Y-03 AAA:** Accessible mode ≥7:1 body contrast, larger base type; axe zero-violations incl
  `wcag2aaa` in both modes.
- **A11Y-04 focus + targets:** global `:focus-visible` ring; all interactive targets ≥24×24px
  (nav/buttons ≥44px comfortable).
- **A11Y-05 keyboard-complete:** full keyboard operation, logical tab order, no traps; nav usable
  by keyboard; mobile nav disclosure is a real button with `aria-expanded`.
- **A11Y-06 text alternatives:** all images have alt (decorative → `alt=""`/`aria-hidden`); no
  meaning by color alone (icons/text accompany color).
- **A11Y-07 Accessibility Statement:** a dedicated page/section documenting conformance target
  (WCAG 2.2 AA, AAA where feasible), known issues, feedback path (email), review cadence.
- **A11Y-08 reduced motion:** no motion when `prefers-reduced-motion`; any Premium motion pausable.
- **PREM-03 hero fallback:** hero shows a static poster/illustration (token-styled, `alt` set) in
  place of 3D — no content lost; this is the permanent Accessible-mode hero and the Phase-4 fallback.

## Navigation
- Persistent header nav (Home / About / Services / Contact) + the mode toggle (from Phase 2).
- `aria-current="page"` on the active link. Mobile: disclosure button with `aria-expanded`,
  keyboard-operable, closes on Escape.
- Footer: contact email, social links, accessibility-statement link, copyright.
</a11y_contract>

<decisions>
## Implementation Decisions
- Content module `src/lib/content/site.ts` (typed) = single source (CONT-06).
- Reusable components: `SiteHeader` (nav + toggle), `SiteFooter`, `Hero` (poster), `ServiceCard`,
  `SkipLinks`, `SocialLinks`, `PageShell`. All token-styled; one DOM for both modes.
- Accessibility Statement as `/accessibility` route (A11Y-07).
- Extend the Playwright/axe suite to scan all 4 routes in both modes; add keyboard-nav + skip-link
  + heading-order assertions.

### Claude's Discretion
- Exact component file layout, poster art (a tasteful token-driven CSS/SVG motif is fine — no raster
  dependency), microcopy wording within the rules above.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md` — tokens, toggle, type scale (reuse).
- `.planning/research/FEATURES.md` — scope.org.uk copy-list, WCAG 2.2 SC mapping.
- `.planning/research/PITFALLS.md` — a11y failure modes, div-soup, focus, color-only.
- `src/lib/styles/tokens.css`, `src/lib/stores/mode.svelte.ts`, `src/routes/+layout.svelte` — existing.
</canonical_refs>

---
*Phase: 03-accessible-experience*
*Context authored: 2026-07-04*
