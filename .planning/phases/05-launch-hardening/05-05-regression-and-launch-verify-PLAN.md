---
phase: 05-launch-hardening
plan: 05
type: execute
wave: 4
depends_on: ["05-04"]
files_modified:
  - package.json
autonomous: false
requirements: [SEO-01, QA-01, DEPLOY-04]

must_haves:
  truths:
    - "The full local suite (check + lint + tokens + content + build + split + review + e2e) is GREEN"
    - "SEO build-grep, Lighthouse budget, and no-flash-under-parallel-workers all pass together"
    - "The pushed workflow runs verify -> build -> deploy(retry) -> smoke and the live site is verified green"
  artifacts:
    - path: "package.json"
      provides: "An aggregate `test:launch` script chaining every Phase-5 gate"
      contains: "test:launch"
  key_links:
    - from: "CI verify job"
      to: "the live site"
      via: "push to main -> Actions -> smoke against page_url"
      pattern: "smoke"
---

<objective>
Final phase gate: prove every Phase-5 requirement and every prior gate are green together, then push
and verify the real GitHub Pages deploy end to end (the CI pipeline runs the axe+Lighthouse gate,
deploys with retry, and smoke-checks the live URL). Closes SEO-01, QA-01, DEPLOY-04.

Purpose: the individual plans proved their pieces in isolation; this confirms no regression across
the 64 prior e2e + the new SEO/CI/smoke work, and that the launch actually works live (DEPLOY-04 is
specifically "proven with a real Pages deploy, not just local preview").

Output: an aggregate `test:launch` script, a full green local run, and a verified live deploy.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-launch-hardening/05-RESEARCH.md
@.planning/phases/05-launch-hardening/05-VALIDATION.md
@package.json

<facts>
- Prior gates that MUST stay green (regression): full e2e (64 tests: a11y, alt-text, content-routes, headings, keyboard-nav, mode-toggle, no-flash, os-signal, premium-3d, responsive, skip-links, targets) + `test:tokens`, `test:content`, `test:review`, `test:split`. New: `test:seo`, `test:seo:build`, `lhci`, `smoke`, `test:ci-gate`.
- The SEO build-grep (`test:seo:build`) needs a BASE_PATH build; the lhci budget needs a BASE-LESS build. Sequence them so each runs against the right artifact.
- DEPLOY-04 requires the LIVE deploy to be verified, so this plan pushes and watches the Actions run (`gh run watch`) and confirms the `smoke` job green.
- Project rule: commits contain NO AI/assistant mentions; use pnpm.
</facts>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add aggregate test:launch script and run the full local gate green</name>
  <files>package.json</files>
  <read_first>
    - package.json (existing `test` script + all Phase-5 scripts added in 05-01..05-04)
    - .planning/phases/05-launch-hardening/05-VALIDATION.md (per-requirement map)
  </read_first>
  <action>
    1. Add to `package.json` `scripts` an aggregate that chains the Phase-5 gates on top of the existing suite:
       ```json
       "test:launch": "pnpm test && node scripts/check-ci-gate.mjs && node scripts/check-seo-meta.mjs && pnpm exec lhci autorun"
       ```
       Note ordering: `pnpm test` already ends with `pnpm build` (BASE-LESS) + `pnpm test:e2e`; but `test:seo:build`
       needs a BASE_PATH build. So run the SEO build-grep explicitly against a BASE_PATH build BEFORE the aggregate,
       then run `test:launch` (which leaves a base-less build for lhci). Concretely, in this task run, execute:
       - `BASE_PATH=/diversityincludesdisability_four pnpm build && pnpm test:seo:build`  (proves absolute base-path SEO meta)
       - `pnpm test:launch`  (full suite + ci-gate + base-less SEO presence + lhci)
       - `pnpm exec playwright test tests/no-flash.spec.ts --workers=4` (repeat 3x -> no flake)
       - `pnpm smoke` (live DEPLOY-04 pre-check against the current live URL)
    2. Fix any regression surfaced. Do NOT lower any threshold or weaken any assertion to make a gate pass --
       fix the underlying cause. If a gate is genuinely infeasible, STOP and surface it (do not paper over it).
  </action>
  <acceptance_criteria>
    - `BASE_PATH=/diversityincludesdisability_four pnpm build && pnpm test:seo:build` prints `SEO META OK` and exits 0.
    - `pnpm test:launch` exits 0 (check + lint + tokens + content + build + split + review + e2e all green, then ci-gate + seo grep + lhci).
    - `pnpm exec playwright test tests/no-flash.spec.ts --workers=4` passes 3 consecutive runs.
    - `pnpm smoke` exits 0.
    - `rg 'test:launch' package.json` matches.
  </acceptance_criteria>
  <verify>
    <automated>pnpm test:launch</automated>
  </verify>
  <done>Every prior gate + every Phase-5 gate passes together locally via one aggregate command; no flake, no regression.</done>
</task>

<task type="auto">
  <name>Task 2: Commit and push; watch the CI pipeline deploy and smoke-verify live</name>
  <files>.github/workflows/deploy.yml</files>
  <read_first>
    - .github/workflows/deploy.yml (the pipeline that runs on push)
    - CLAUDE.md (commit rules: pnpm; no AI/assistant mentions in commit messages)
  </read_first>
  <action>
    1. Stage the Phase-5 work and commit with a change-focused message (NO AI/assistant mention), e.g.:
       `feat(launch): per-route SEO/OG meta, CI axe+lighthouse gate, live smoke, deploy retry`
    2. `git push` to `main`.
    3. Watch the Actions run to completion: `gh run watch --exit-status` (or `gh run list` then `gh run view <id> --log`).
       Confirm job order and outcomes: `verify` (green) -> `build` (green) -> `deploy` (green; note whether deploy1 or
       deploy2 succeeded) -> `smoke` (green).
    4. Confirm the live artifacts by hand-running the smoke against the deployed URL:
       `node scripts/live-smoke.mjs https://wolfwdavid.github.io/diversityincludesdisability_four` -> `SMOKE OK`.
    5. If `verify` fails on axe/lighthouse, that is the gate WORKING -- fix the violation and re-push (do not disable the gate).
       If `deploy` needed deploy2, that is the retry WORKING (record it in the SUMMARY).
  </action>
  <acceptance_criteria>
    - `gh run watch --exit-status` returns 0 for the triggered run (all four jobs succeeded).
    - `gh run view <id> --json jobs` shows `verify`, `build`, `deploy`, `smoke` all `conclusion: success`.
    - `node scripts/live-smoke.mjs https://wolfwdavid.github.io/diversityincludesdisability_four` prints `SMOKE OK` and exits 0.
    - The commit message contains no "Claude"/"AI"/assistant references (`git log -1 --pretty=%B` review).
  </acceptance_criteria>
  <verify>
    <automated>gh run watch --exit-status</automated>
  </verify>
  <done>The pushed pipeline gated on axe+Lighthouse, deployed (with retry available), and the post-deploy smoke verified the live base-path site green -- DEPLOY-04 proven on a real Pages deploy.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human launch verification (OG card + live site)</name>
  <action>Pause for the user to visually confirm the live launch after all automated gates are green: the deployed site loads and mode-toggles, the OG social card renders in a third-party debugger, per-route tab titles are correct, and the CI run shows verify -> build -> deploy -> smoke all green. This covers the single human-judged item from 05-VALIDATION.md (real social-preview rendering).</action>
  <what-built>
    Full launch hardening: per-route SEO/OG/Twitter meta with absolute base-path URLs, a 1200x630 OG card,
    a CI axe+Lighthouse gate blocking deploy, deploy retry, and a post-deploy live smoke -- all pushed and
    green in CI against the live GitHub Pages site.
  </what-built>
  <how-to-verify>
    1. Open the live site: https://wolfwdavid.github.io/diversityincludesdisability_four/ -- confirm it loads,
       toggle Premium/Accessible, hard-refresh a deep link (e.g. /about/) and confirm it resolves.
    2. Paste the live home URL into a social-card debugger (e.g. opengraph.xyz or the LinkedIn Post Inspector)
       and confirm the OG card image + title + description render (this is the human-judged social preview from
       05-VALIDATION.md "Manual-Only Verifications").
    3. Spot-check one inner route's tab title in the browser (e.g. /services/ shows "Services | Diversity Includes Disability").
    4. Confirm the CI run for this push shows verify -> build -> deploy -> smoke all green in the Actions tab.
  </how-to-verify>
  <resume-signal>Type "approved" to close Phase 5, or describe what looks wrong.</resume-signal>
</task>

</tasks>

<verification>
- `pnpm test:launch` green; `BASE_PATH=… pnpm build && pnpm test:seo:build` -> `SEO META OK`.
- `no-flash --workers=4` green x3; `pnpm smoke` green.
- Pushed CI run: verify -> build -> deploy -> smoke all success (`gh run watch --exit-status` = 0).
- Human confirms live site + OG social preview + per-route titles.
</verification>

<success_criteria>
SEO-01, QA-01, and DEPLOY-04 are all proven: absolute-URL SEO/OG meta on every route with a real OG card,
a CI accessibility+Lighthouse gate that blocks deploy on violations, and a live-verified Pages deploy with
self-healing retry -- with all 64 prior e2e and every static gate still green.
</success_criteria>

<output>
After completion, create `.planning/phases/05-launch-hardening/05-05-SUMMARY.md` and mark Phase 5 complete
(SEO-01, QA-01, DEPLOY-04) in the roadmap/requirements traceability.
</output>
