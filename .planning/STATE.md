---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: — Dual-Mode Site
status: unknown
stopped_at: Completed 06-01-PLAN.md (harness + inert env + engagement tokens)
last_updated: "2026-07-06T10:05:57.400Z"
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 24
  completed_plans: 21
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core value:** A visitor can experience DID's mission and services in the mode that works for their body and brain — and switch instantly, with the choice remembered. Accessible mode is first-class, not a fallback.
**Current focus:** Phase 06 — engagement-surfaces

## Current Position

Phase: 06 (engagement-surfaces) — EXECUTING
Plan: 2 of 4

## Performance Metrics

**Velocity:**

- Total plans completed (v1.0): 20
- Average duration: — min
- Total execution time: — hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation-deploy-proof P01 | 12 | 3 tasks | 20 files |
| Phase 01-foundation-deploy-proof P02 | 3 | 2 tasks | 0 files |
| Phase 02 P01 | 8 | 3 tasks | 10 files |
| Phase 02 P02 | 4 | 3 tasks | 3 files |
| Phase 02 P03 | 68 | 3 tasks | 10 files |
| Phase 03 P02 | 4.5 | 2 tasks | 8 files |
| Phase 03 P01 | 7min | 3 tasks | 9 files |
| Phase 03 P04 | 3 | 2 tasks | 2 files |
| Phase 03 P03 | 29min | 3 tasks | 5 files |
| Phase 03 P06 | 7min | 3 tasks | 4 files |
| Phase 03 P05 | 20 | 2 tasks | 3 files |
| Phase 03 P07 | 95 | 2 tasks | 6 files |
| Phase 04 P01 | 8 | 3 tasks | 5 files |
| Phase 04 P02 | 12 | 3 tasks | 7 files |
| Phase 04 P03 | 40 | 3 tasks | 1 files |
| Phase 05 P01 | 22 | 3 tasks | 11 files |
| Phase 05-launch-hardening P02 | 61 | 3 tasks | 9 files |
| Phase 05-launch-hardening P03 | 31 | 2 tasks | 3 files |
| Phase 05-launch-hardening P04 | 12min | 2 tasks | 3 files |
| Phase 05 P05 | 44 | 3 tasks | 7 files |
| Phase 06 P01 | 18 | 3 tasks | 13 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.1 organizing principle: separate buildable-now work (Phase 6) from human-gated work (Phases 7–8) so build progress never blocks on external input.
- Contact form ships inert: endpoint is config-driven (Web3Forms/Formspree key); with no key the form is hidden and mailto stays primary — the site never shows a broken form (ENGAGE-02).
- Podcast/media section renders only when the typed site.ts list has entries — no empty shell (ENGAGE-03).
- Real content swap (Phase 7) is a single edit to src/lib/content/site.ts's `[REVIEW]` markers + trimming the Accessibility-Statement known-issues; do not invent content while awaiting Eman.
- Domain cutover (Phase 8) sequenced last so the custom domain launches with real content; blocked on registrar access + leave-Wix decision.
- Every v1.1 phase must keep v1.0 gates green: axe both modes, 3D bundle boundary (zero WebGL in Accessible), SEO meta, fail-closed CI a11y/Lighthouse gate.
- One site, two persistent modes (not two sites) — one accessible DOM themed by `data-mode`, single content source; no drift.
- adapter-static + base path for gh-pages — only viable path; real Pages deploy proven in Phase 1.
- Accessible mode ships zero 3D (lazy-load Premium via dynamic `import()`) — the only hard code-split boundary.
- Auto-select Accessible on `prefers-reduced-motion`/`prefers-contrast` — respect OS signals by default.
- [Phase 01]: paths.relative=false so every prerendered page uses absolute base-prefixed _app URLs; adapter-static + trailingSlash=always is the base-path-correct Pages recipe.
- [Phase 01]: Live deploy proven on real GitHub Pages under the base path (root 200 + _app chunk 200 + 404.html SPA fallback validated).
- [Phase 02]: Node raw-hex token gate replaces bash/rg for Windows/pnpm-shell robustness; axe suite includes wcag2aaa tag to machine-verify DS-01 AAA (>=7:1).
- [Phase 02]: Mode store initializes FROM html data-mode; inline script is the single owner of priority (stored → OS → default), so no hydration re-flip.
- [Phase 02]: e2e runs against the adapter-static preview build (build && preview), not the dev server — exercises the shipped artifact.
- [Phase 03]: CONT-06 single content source — all copy in src/lib/content/site.ts; [REVIEW] markers are TS comments enforced by check-review-markers build gate.
- [Phase 03]: Social hrefs are '#' placeholders and about.pullQuote is undefined until real values confirmed (no invented content) — these are the Phase-7 targets.
- [Phase 03]: Contact CTA is a labeled mailto button with the address shown as visible text; Accessibility Statement honestly lists pending [REVIEW] items as known issues — Phase 7 trims these.
- [Phase 04]: PREM-02 boundary gate matches chunk CONTENT (@threlte|WebGLRenderer|three.module over built .js), robust to hashed chunk names; premium/ is the sole path into the three graph.
- [Phase 05]: SEO absolute-URL composed from constants (site.url+base+path), never runtime page.url; split validation (e2e origin+path in preview, BASE_PATH build-grep). site.url is the Phase-8 cutover target.
- [Phase 05]: CI verify job (axe both modes + lhci) fail-closed gates build+deploy; guarded deploy retry self-heals transient Pages failures; post-deploy live-smoke. test:launch aggregates every gate.
- [Phase 06]: Contact endpoint ships inert via $env/static/public + a committed empty .env default (PUBLIC_WEB3FORMS_KEY=""); process.env/Actions Variable overrides to enable — build stays green with the key unset.
- [Phase 06]: Default vs enabled Playwright split: default config testIgnore array excludes tests/unit + *.enabled.spec.ts; enabled config builds with a dummy key on an isolated port for the visible-form specs.

### Pending Todos

- Phase 6: pick the form backend (Web3Forms vs Formspree) during planning; keep endpoint config-driven so it ships inert without a key.
- Phase 7: awaiting Eman's four answers (bio, pull-quote, social URLs, founder title) per Websites/Rimawi/HANDOFF-EMAN-website.md.
- Phase 8: awaiting registrar access + leave-Wix decision before cutover.

### Blockers/Concerns

- [Phase 7] BLOCKED: requires Eman's real content answers (Websites/Rimawi/HANDOFF-EMAN-website.md). Do not plan/execute until answers arrive; invent no content in the interim.
- [Phase 8] BLOCKED: requires registrar access to point DNS + the decision to leave Wix. Sequenced after Phase 7 so the domain launches with real content.
- Never commit PII/EIN/creds from the private Notion source; this folder sits in a git tree with public remotes.

## Session Continuity

Last session: 2026-07-06T10:05:57.393Z
Stopped at: Completed 06-01-PLAN.md (harness + inert env + engagement tokens)
Resume file: None
