---
phase: 2
slug: mode-system-design-tokens
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-04
---

# Phase 2 — Validation Strategy

> Automated validation for the dual-mode engine. Playwright + @axe-core/playwright are the
> authoritative gates; grep assertions cover the token/CSS-var contract.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.x + @axe-core/playwright (E2E + a11y); svelte-check + eslint-plugin-svelte (static) |
| **Config file** | `playwright.config.ts` (installed in Wave 0 of this phase) |
| **Quick run command** | `pnpm check` (svelte-check + eslint) — fast static gate |
| **Full suite command** | `pnpm build && pnpm test:e2e` (Playwright against the built/preview site) |
| **Estimated runtime** | ~10s static; ~40–60s E2E incl. build |

---

## Sampling Rate

- **After every task commit:** `pnpm check` (types + a11y lint)
- **After the store/toggle tasks:** relevant Playwright spec
- **After every plan wave:** full `pnpm test:e2e` (both modes)
- **Before verify-work:** full suite green, axe zero-violations both modes
- **Max feedback latency:** ~10s static / ~60s E2E

---

## Per-Task / Per-Requirement Verification Map

| Req | Behavior | Test Type | Automated Command / Assertion |
|-----|----------|-----------|-------------------------------|
| DS-01 | AAA token contract exists | grep | `grep -q 'data-mode="accessible"' src/lib/styles/tokens.css && grep -q '#111111' src/lib/styles/tokens.css` |
| DS-02 | Components use CSS vars, no raw hex | grep | `! grep -rEn '#[0-9a-fA-F]{6}' src/routes src/lib/components` (hex only allowed in tokens.css) |
| DS-01 | Both modes pass axe (AAA-minded) | axe | Playwright: `AxeBuilder` scan in accessible + premium → 0 violations |
| MODE-01 | Native toggle, aria-pressed, ≥44px, label | e2e | `toggle` is `<button>`, has `aria-pressed`, boundingBox ≥44, visible text |
| MODE-02 | Choice persists across reload | e2e | click toggle → reload → `html[data-mode]` unchanged; localStorage `did-mode` set |
| MODE-03 | No flash on load | e2e | `goto(url,{waitUntil:'commit'})` → `html` already has `data-mode` attribute |
| MODE-04 | OS signal auto-selects Accessible | e2e | `emulateMedia({reducedMotion:'reduce'})` + fresh context → mode=accessible; same for `contrast:'more'` |
| MODE-05 | Switch announced + focus/scroll kept | e2e | after toggle, `#mode-announcer` textContent non-empty; `document.activeElement` unchanged; scrollY preserved |
| DS-01 | No google-fonts request (self-hosted) | e2e | network: assert no request URL contains `fonts.googleapis.com` / `fonts.gstatic.com` |
| MODE-03 | JS-disabled fallback themed | e2e/grep | `app.html` `<html>` has static `data-mode="accessible"` fallback attribute |

*Status tracked in plan task acceptance_criteria; all rows are automatable (no manual-only items).*

---

## Wave 0 Requirements

- [ ] Install toolchain: `@playwright/test`, `@axe-core/playwright`, `eslint-plugin-svelte`, `@fontsource/lexend`, `@fontsource-variable/source-sans-3` (or fixed weights)
- [ ] `playwright.config.ts` — build+preview webServer, base path aware
- [ ] `tests/a11y.spec.ts`, `tests/mode.spec.ts` — stubs for the map above
- [ ] `package.json` scripts: `check`, `test:e2e`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real screen-reader announcement quality | MODE-05 | SR output nuance is human-judged | Optional: NVDA/VoiceOver toggles mode → hears "Premium visual mode on". (axe + aria-live presence covers the automatable part.) |

*All requirement gates have automated coverage; the SR listen-through is an optional quality pass, not a blocker.*

---

## Validation Sign-Off

- [x] Every requirement (MODE-01..05, DS-01, DS-02) maps to an automated assertion
- [x] Sampling continuity: static check after each task, E2E after waves
- [x] Wave 0 installs the missing toolchain
- [x] No watch-mode flags
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-07-04
