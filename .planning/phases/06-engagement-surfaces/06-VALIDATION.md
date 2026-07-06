---
phase: 6
slug: engagement-surfaces
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-06
---

# Phase 6 — Validation Strategy

> Two build variants: the DEFAULT build (no key → form hidden, media empty → section omitted) and
> an ENABLED test build (dummy key → form visible, network stubbed). Component-level vitest covers
> the populated-media branch. All v1.0 gates must stay green.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright + @axe-core/playwright (default + enabled configs); vitest + @testing-library/svelte (data-branch component tests); existing grep gates |
| **Quick run** | `pnpm check` |
| **Default-build suite** | `pnpm test:e2e` (existing config — asserts hidden form / omitted media / full v1.0 regression) |
| **Enabled-build suite** | `pnpm test:e2e:enabled` (playwright.enabled.config.ts — dummy key, network stubbed) |
| **Component tests** | `pnpm test:unit` (vitest) |

## Sampling Rate
- After each task: `pnpm check` + task grep
- After the form wave: enabled suite
- Phase gate: default e2e + enabled e2e + vitest + all grep gates + `pnpm build` (BASE_PATH)

## Per-Requirement Verification Map

| Req | Assertion (automated) |
|-----|----------------------|
| ENGAGE-02 | DEFAULT build: /contact has NO `<form>`; mailto link still present and primary (Playwright) |
| ENGAGE-02 | Committed `.env` has `PUBLIC_WEB3FORMS_KEY=""`; build succeeds with env unset (CI parity) |
| ENGAGE-01 | ENABLED build: form visible with name/email/message + visible labels + autocomplete attrs; honeypot present but `aria-hidden` + `tabindex=-1` (invisible to AT) |
| ENGAGE-01 | On-blur validation: error text linked via `aria-describedby`; submit with invalid fields → focus moves to first invalid field |
| ENGAGE-01 | Submit (network stubbed): `aria-live` status announces progress + success; failure path announces error with retry + mailto fallback visible |
| ENGAGE-01 | Form targets ≥44px; axe zero-violations (incl wcag2aaa) on /contact in BOTH modes with the form rendered (enabled build) |
| ENGAGE-03 | DEFAULT build (empty list): About page has NO media section heading/landmark (omitted entirely) |
| ENGAGE-03 | vitest: MediaSection with populated fixture renders items with accessible names + links; with empty list renders nothing |
| Regression | Default `pnpm test:e2e` all green (≈70 tests: a11y both modes, mode engine, 3D boundary, SEO, no-flash); `test:split`, `test:tokens`, `test:content`, `test:review` gates green |
| Regression | New tokens (`--danger`/`--success`/`--field-border`) defined in BOTH mode themes with AAA-safe contrast (computed check or axe wcag2aaa on the enabled form) |

## Wave 0 Requirements
- [ ] `playwright.enabled.config.ts` + `tests/contact-form.spec.ts` (enabled suite) + default-build hidden/omitted specs
- [ ] vitest + @testing-library/svelte installed + `tests/unit/media-section.spec.ts`
- [ ] Committed `.env` with empty `PUBLIC_WEB3FORMS_KEY`

## Manual-Only Verifications
| Behavior | Req | Why | Instructions |
|----------|-----|-----|--------------|
| Real submission end-to-end | ENGAGE-01/02 | Needs the real Web3Forms key (issued to Eman's email later) | When the key arrives: set `PUBLIC_WEB3FORMS_KEY`, rebuild, send a test message, confirm receipt at emanrimawi@gmail.com |

## Validation Sign-Off
- [x] Both build variants covered; every ENGAGE requirement has a named automated assertion
- [x] Full v1.0 regression kept green
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-07-06
