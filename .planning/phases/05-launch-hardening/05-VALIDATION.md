---
phase: 5
slug: launch-hardening
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-05
---

# Phase 5 — Validation Strategy

> SEO meta proven by built-HTML assertions; CI gate proven by workflow content + local lhci run;
> DEPLOY-04 by a live-URL smoke job; plus the two follow-up fixes + full regression.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright + @axe-core/playwright (a11y), @lhci/cli@0.15.1 (budget), Node built-HTML grep (SEO), Node live-fetch (smoke) |
| **Quick run** | `pnpm check` |
| **SEO gate** | `node scripts/check-seo.mjs` (after build) or Playwright head assertions |
| **Full suite** | `pnpm build && pnpm test:e2e && pnpm exec lhci autorun` |
| **Live smoke** | `node scripts/live-smoke.mjs <url>` (post-deploy) |

## Sampling Rate
- After each task: `pnpm check` + task grep
- SEO task: `pnpm build && node scripts/check-seo.mjs`
- Phase gate: full e2e + lhci + built-HTML SEO gate; live-smoke runs in CI post-deploy

## Per-Requirement Verification Map

| Req | Assertion (automated) |
|-----|----------------------|
| SEO-01 | After build, each of 5 routes' `index.html` contains `<title>`, `<meta name="description">`, `<link rel="canonical" href="https://wolfwdavid.github.io/diversityincludesdisability_four/...">`, `og:title/description/url/image/type/site_name`, `twitter:card/title/description/image` — all og:url/canonical/og:image are ABSOLUTE under base path (grep for `https://wolfwdavid.github.io/diversityincludesdisability_four`) |
| SEO-01 | OG image `static/og-image.png` exists (1200×630) and is referenced absolutely; resolves in build/ |
| QA-01 | `.github/workflows/deploy.yml` has a `verify` job that runs `pnpm build` + `pnpm test:e2e` (axe both modes) + `lhci autorun`, and gates deploy on it (deploy `needs: verify`) — grep workflow |
| QA-01 | `lighthouserc.json` asserts `categories:accessibility >= 0.95` (error), perf floor warn; `lhci autorun` exits 0 locally against build/ |
| QA-01 | axe gate FAILS the job on a violation (the a11y.spec is in test:e2e which the verify job runs) |
| DEPLOY-04 | `scripts/live-smoke.mjs`: all 5 live routes → 200; an `_app/immutable` asset → 200; deep-link `/nope/` → 404 with SPA shell; no `fonts.googleapis.com`. Retries for propagation. Wired as a post-deploy CI job. |
| Follow-up 1 | Workflow has guarded deploy retry (deploy1 continue-on-error + deploy2 if failure) — grep |
| Follow-up 2 | `tests/no-flash.spec.ts` MODE-03 uses `expect.poll`/attribute wait; passes at default worker count (run full suite, no flake) |
| Follow-up 3 | No `HeroScene*.css` `<link>` in build/index.html (moved to tokens.css); `check-3d-boundary.mjs` still GREEN (JS boundary intact) |
| Regression | All prior e2e (64) still green; check/token/content/review/boundary gates all pass |

## Wave 0 Requirements
- [ ] `scripts/check-seo.mjs` (built-HTML meta gate) + `scripts/live-smoke.mjs` + wire into package.json
- [ ] `lighthouserc.json`
- [ ] `tests/seo.spec.ts` (or head assertions) authored
- [ ] `static/og-image.png` (1200×630 branded card)

## Manual-Only Verifications
| Behavior | Req | Why | Instructions |
|----------|-----|-----|--------------|
| OG card renders in a real social preview | SEO-01 | Third-party renderers human-judged | Optional: paste live URL into a social debugger; automated tags + image existence cover the gate |

## Validation Sign-Off
- [x] SEO meta built-HTML assertion (absolute base-path URLs)
- [x] CI gate (axe + lighthouse) wired + deploy gated on it
- [x] Live smoke job (DEPLOY-04)
- [x] Both follow-up fixes have automated proof; full regression kept green
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-07-05
