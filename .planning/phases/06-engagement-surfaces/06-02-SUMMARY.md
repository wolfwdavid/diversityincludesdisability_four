---
phase: 06-engagement-surfaces
plan: 02
subsystem: ui
tags: [contact-form, web3forms, accessibility, progressive-enhancement, svelte5-runes, honeypot, wcag-aaa]

# Dependency graph
requires:
  - phase: 06-01
    provides: "committed empty .env (PUBLIC_WEB3FORMS_KEY), --danger/--success/--field-border tokens, playwright.enabled.config.ts (dummy-key build), default config testIgnore of *.enabled.spec.ts"
provides:
  - "Accessible progressive-enhancement contact form gated on the inert Web3Forms key (ENGAGE-01/02)"
  - "contactForm + contactSuccess copy blocks in site.ts (single content source)"
  - "Prerendered, noindex /contact/success/ landing for no-JS submitters"
  - "Default-hidden + enabled-accessible e2e specs; /contact/success/ added to axe coverage"
affects: [06-03-media-section-and-about, 06-04-integration-drive-green, phase-07-content]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inert-until-configured feature gate: $env/static/public key + committed empty default; form renders only when key length > 0"
    - "Bound honeypot forwarded in JSON payload (not hardcoded false) so a JS bot that ticks it is caught"
    - "Progressive enhancement: native multipart POST + hidden redirect for no-JS, JSON fetch upgrade for JS"
    - "Single content source: every label/error/status string read from site.contactForm; no hardcoded copy"

key-files:
  created:
    - src/lib/components/ContactForm.svelte
    - src/routes/contact/success/+page.svelte
    - tests/contact-form.spec.ts
    - tests/contact-form.enabled.spec.ts
  modified:
    - src/lib/content/site.ts
    - src/routes/contact/+page.svelte
    - tests/a11y.spec.ts

key-decisions:
  - "Honeypot value is bound via `let botcheck = $state(false)` + bind:checked and forwarded in the JSON payload, proven by a payload assertion in the enabled spec"
  - "/contact/success/ is noindex and deliberately EXCLUDED from the 5-route SEO gate (check-seo-meta.mjs / seo.spec.ts) but INCLUDED in the axe ROUTES so it is still scanned in both modes"
  - "mailto stays first/primary; the form renders as a titled section between the mailto and the social heading, preserving ENGAGE-02"

patterns-established:
  - "Feature flag on a prerendered static site via $env/static/public + committed empty default (only prerender-safe, env-overridable mechanism)"
  - "a11y-safe honeypot: off-screen (not display:none), aria-hidden wrapper, tabindex=-1, autocomplete=off, never required"

requirements-completed: [ENGAGE-01, ENGAGE-02]

# Metrics
duration: 41min
completed: 2026-07-06
---

# Phase 6 Plan 02: Contact Form and Success Page Summary

**Accessible, progressively-enhanced Web3Forms contact form that ships hidden behind an inert key (mailto stays primary), with a bound-and-forwarded honeypot and a branded noindex no-JS success landing — all copy sourced from site.ts.**

## Performance

- **Duration:** 41 min
- **Started:** 2026-07-06T10:11:26Z
- **Completed:** 2026-07-06T10:52:18Z
- **Tasks:** 3 completed
- **Files created:** 4, modified: 3

## Accomplishments
- Built `ContactForm.svelte` (Svelte 5 runes): visible labels + autocomplete, on-blur validation linked via `aria-describedby`, focus-to-first-invalid on submit, `aria-live` status region (polite/assertive), Retry + mailto fallback on failure, ≥44px targets, token-only styling, and a bound honeypot forwarded in the JSON payload.
- Gated the form on `PUBLIC_WEB3FORMS_KEY.length > 0` so the default (no-key) build renders no form and keeps the labeled mailto primary (ENGAGE-02); the enabled dummy-key build renders the full accessible form (ENGAGE-01).
- Added `contactForm` + `contactSuccess` copy blocks to `site.ts` as the single content source (only the two disjoint keys touched — media/podcasts left for 06-03).
- Added a prerendered, noindex `/contact/success/` landing for no-JS submitters (Web3Forms redirect target), with the mailto present and a base-path-safe `resolve()` back-link.
- Authored both e2e specs (RED-first) and wired `/contact/success/` into the axe suite.

## Task Commits

1. **Task 1: Author the RED specs (default hidden + enabled accessible)** - `c0700c2` (test)
2. **Task 2: Add form copy to site.ts, build ContactForm.svelte, gate it into the contact page** - `d22418a` (feat)
3. **Task 3: Branded no-JS success page + axe coverage** - `03a5d9b` (feat)

## Files Created/Modified
- `src/lib/components/ContactForm.svelte` - Svelte 5 runes progressive-enhancement form; all copy from `site.contactForm`; bound honeypot; no-JS multipart POST + JSON fetch upgrade.
- `src/routes/contact/success/+page.svelte` - Prerendered branded noindex no-JS success landing; prose from `site.contactSuccess`; mailto present; `resolve()` back-link.
- `src/lib/content/site.ts` - Added `contactForm` (labels/errors/status/honeypot/submit) and `contactSuccess` (title/heading/lead/mailtoPrefix/back) blocks.
- `src/routes/contact/+page.svelte` - Import key + component; `formEnabled` gate; render form section between mailto and social heading.
- `tests/contact-form.spec.ts` - Default build: form hidden, mailto primary (2 tests).
- `tests/contact-form.enabled.spec.ts` - Enabled build: labels/autocomplete, validation, honeypot(bound+forwarded), aria-live, ≥44px, axe both modes (10 tests).
- `tests/a11y.spec.ts` - Added `/contact/success/` to ROUTES (SEO 5-route gate untouched).

## Verification Results

- **Default e2e (`tests/contact-form.spec.ts`):** 2/2 passed — form hidden, mailto primary.
- **Enabled e2e (`playwright.enabled.config.ts`):** 10/10 passed — form renders, labels/autocomplete, on-blur validation + `aria-describedby`, focus-to-first-invalid, bound-honeypot payload (`botcheck: false`) forwarded, aria-live success + error(retry+mailto), ≥44px targets, axe zero-violations (incl. wcag2aaa) in accessible AND premium modes.
- **a11y suite (`tests/a11y.spec.ts`):** 12/12 passed — all 6 routes incl. `/contact/success/` in both modes.
- **Gates:** `pnpm check` clean (0 errors), `test:tokens` OK, `test:content` OK, `test:review` OK, `test:contrast` OK, base build + `check-seo-meta.mjs` OK (5 routes unchanged).

## Deviations from Plan

Plan executed as written. One out-of-scope discovery logged, not fixed (scope boundary):

### Deferred (not fixed — out of scope)

**1. `scripts/check-token-contrast.mjs` fails `prettier --check`**
- **Found during:** Task 2 (`pnpm lint`).
- **Issue:** Formatting-only (whitespace) violation introduced by 06-01 (commit b5ec05c), blocks the `pnpm lint` gate.
- **Action:** Logged to `.planning/phases/06-engagement-surfaces/deferred-items.md`; not caused by 06-02's changes. To be fixed in 06-04 (integration drive-green) via `pnpm exec prettier --write scripts/check-token-contrast.mjs`.

## Known Stubs

None. `contactSuccess`/`contactForm` copy is real, wired, and rendered. The empty `PUBLIC_WEB3FORMS_KEY` default is the intended inert-until-configured state (ENGAGE-02), not a stub — the form is fully built and proven under the enabled build; going live is a documented 2-minute human key-provisioning task (see 06-02-PLAN `user_setup`).

## Self-Check: PASSED

All created files present; all task commits (c0700c2, d22418a, 03a5d9b) exist in history.
