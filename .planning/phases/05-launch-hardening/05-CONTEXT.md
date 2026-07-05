# Phase 5: Launch Hardening — Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Source:** Roadmap Phase 5 + accumulated follow-ups from Phases 1–4

<domain>
## Phase Boundary
Final hardening of the finished dual-mode site before launch: SEO/social metadata, a blocking
CI accessibility + Lighthouse gate, and live-URL verification of the deployed site under the base
path. Plus three carried-over follow-ups discovered during Phases 1–4.
</domain>

<decisions>
## Requirements (locked)
- **SEO-01:** Each of the 5 routes has correct `<title>` + meta description + Open Graph + Twitter
  card tags with ABSOLUTE URLs under the base path (https://wolfwdavid.github.io/diversityincludesdisability_four/...).
  Include an OG image (can be a generated/static token-styled card). Per-page titles/descriptions
  from the content source (site.ts). Add canonical URLs. Site name "Diversity Includes Disability".
- **QA-01:** CI runs the automated accessibility gate (axe via Playwright in BOTH modes across all
  routes) AND a Lighthouse budget (@lhci/cli) — the build FAILS on a11y violations. Wire into the
  GitHub Actions workflow so every push is gated. (@lhci/cli@0.15.1 already installed.)
- **DEPLOY-04:** The deployed site is verified live under the base path — links, images, `_app/immutable`
  chunks all resolve — as an explicit automated post-deploy smoke check (curl/Playwright against the
  live URL), not just local preview.

## Carried-over follow-ups (fold into this phase)
1. **Deploy retry:** `actions/deploy-pages@v4` gave a transient "Deployment failed, try again later"
   in Phase 3 (build was fine). Add a retry to the deploy job (retry the deploy step, or a re-run
   guard) so transient Pages API failures self-heal.
2. **no-flash flake:** `tests/no-flash.spec.ts` MODE-03 flakes under 8-worker parallelism (passes in
   isolation / `--workers=1`) — `document.documentElement` transiently null right after
   `waitUntil:'commit'`. Harden the assertion (wait for the html element / dataset.mode) so it's
   deterministic under CI contention. Do NOT weaken what it verifies (data-mode present pre-paint).
3. **HeroScene.css eager load:** the premium `HeroScene` component's scoped CSS is emitted as a
   stylesheet `<link>` on the accessible home page (tiny, not WebGL — PREM-02 JS boundary is intact).
   Minor perf nit: prevent the premium scene's CSS from loading in the accessible critical path if
   cleanly possible (e.g. move canvas-wrapper styles so they only load with the scene), OR explicitly
   accept + document it as negligible if the fix risks the code-split. Do NOT break the JS boundary.

## Claude's Discretion
- OG image approach (static SVG→PNG card vs simple branded image), exact Lighthouse budget thresholds
  (set realistic ones: a11y ≥ 0.95, performance reasonable for a static site), CI job structure.
</decisions>

<canonical_refs>
## Canonical References
- `.github/workflows/deploy.yml` — the deploy workflow to extend with the CI gate + retry.
- `src/lib/content/site.ts` — per-page titles/descriptions source.
- `src/routes/+layout.svelte` / per-route `+page.svelte` — where `<svelte:head>` meta goes.
- `playwright.config.ts`, `tests/a11y.spec.ts` — the a11y suite to run in CI.
- `svelte.config.js` — base path for absolute OG URLs.
- `.planning/phases/0*/0*-VERIFICATION.md` — prior-phase gates that must keep passing (regression).
</canonical_refs>

---
*Phase: 05-launch-hardening*
*Context authored: 2026-07-05*
