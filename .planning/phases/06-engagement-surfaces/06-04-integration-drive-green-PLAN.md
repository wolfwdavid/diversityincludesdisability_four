---
phase: 06-engagement-surfaces
plan: 04
type: execute
wave: 3
depends_on: ["06-02", "06-03"]
files_modified:
  - package.json
  - .github/workflows/deploy.yml
autonomous: true
requirements: [ENGAGE-01, ENGAGE-02, ENGAGE-03]

must_haves:
  truths:
    - "The new tests (unit + enabled + contrast) are wired into the aggregate commands and the CI verify job, so they can never silently no-op into a false green (RESEARCH Pitfall 6)."
    - "The enabled suite runs AFTER Lighthouse in CI so its dummy-key rebuild of build/ never gets audited by lhci (which serves staticDistDir='build'). Lighthouse only ever audits the default, no-key build."
    - "The full phase gate is green: default e2e (~70 v1.0 tests unchanged) + enabled e2e + vitest + all grep gates + contrast + BASE_PATH build + SEO build gate."
  artifacts:
    - path: "package.json"
      provides: "test / test:launch aggregates include unit + enabled + contrast"
      contains: "test:e2e:enabled"
    - path: ".github/workflows/deploy.yml"
      provides: "CI verify job runs the enabled + unit suites AFTER lhci"
      contains: "test:e2e:enabled"
  key_links:
    - from: "package.json test:launch"
      to: "pnpm test:e2e:enabled / pnpm test:unit / pnpm test:contrast"
      via: "aggregate chaining (enabled AFTER lhci, mirroring CI)"
      pattern: "test:e2e:enabled"
    - from: ".github/workflows/deploy.yml verify job"
      to: "the enabled + unit suites"
      via: "run steps added AFTER the Lighthouse (lhci) step"
      pattern: "pnpm test:e2e:enabled"
---

<objective>
Wire the Phase-6 test surfaces into the aggregate commands and CI so they always run, ordering the dummy-key enabled suite AFTER Lighthouse so it can never pollute the audited build, then drive the entire phase green — default suite, enabled suite, vitest, every grep gate, the contrast gate, and the BASE_PATH production build with the SEO gate — closing out ENGAGE-01/02/03 with no v1.0 regression.

Purpose: New specs that exist but aren't in `pnpm test`/CI produce false greens; and an enabled rebuild that runs before Lighthouse would silently make lhci audit the dummy-key build. This wave makes the coverage load-bearing AND correctly ordered, and proves the whole phase passes end to end.
Output: Updated `package.json` aggregates, a correctly-ordered CI `verify` job, and a proven-green full run.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/06-engagement-surfaces/06-VALIDATION.md
@package.json
@.github/workflows/deploy.yml

<interfaces>
<!-- Contracts from earlier waves the executor wires together. -->

Scripts added in 06-01 (definitions exist): `test:unit` = `vitest run`; `test:e2e:enabled` = `playwright test --config playwright.enabled.config.ts`; `test:contrast` = `node scripts/check-token-contrast.mjs`.

Existing aggregates (package.json):
```
"test": "pnpm check && pnpm lint && pnpm test:tokens && pnpm test:content && pnpm build && pnpm test:split && pnpm test:review && pnpm test:e2e",
"test:launch": "pnpm test && node scripts/check-ci-gate.mjs && pnpm exec lhci autorun && pnpm build:base && node scripts/check-seo-meta.mjs"
```
Ordering rule (CRITICAL): `test:e2e:enabled`'s webServer runs `pnpm build` with the dummy `PUBLIC_WEB3FORMS_KEY`, OVERWRITING `build/` with the enabled variant. `lhci autorun` serves `staticDistDir='build'`. So `test:e2e:enabled` MUST run AFTER `lhci` (and after `check-seo-meta.mjs`, which also depends on a clean default `build/`). In `test:launch`, append `test:e2e:enabled` at the END so lhci + SEO gate audit the default no-key build; the `build:base` step already rebuilds before the SEO gate, and the final `pnpm build:base` is the last artifact-producing step for deploy. To be safe, the enabled suite (last) re-runs its own build in an isolated dir — but never leave the dummy build as the deploy artifact: it is the LAST step and the deploy job re-checks out + rebuilds cleanly.

CI verify job (deploy.yml) currently runs, in order: `pnpm install` -> install chromium -> `pnpm test:e2e` -> `pnpm exec lhci autorun ...`. The enabled + unit suites also need chromium (already installed in this job). The enabled suite does its own `pnpm build` via its webServer with the dummy key, so it MUST be ordered AFTER lhci (mirroring local `test:launch`).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire unit + enabled + contrast into aggregates and CI (enabled AFTER lhci)</name>
  <read_first>package.json, .github/workflows/deploy.yml</read_first>
  <files>package.json, .github/workflows/deploy.yml</files>
  <action>
Update `package.json` aggregates. Add the fast checks (`test:unit`, `test:contrast`) into `test`, and the heavier enabled build into `test:launch` as the LAST step (it rebuilds `build/` with the dummy key, so it must run AFTER `lhci` + the SEO gate, both of which need the default build):
```json
"test": "pnpm check && pnpm lint && pnpm test:tokens && pnpm test:contrast && pnpm test:content && pnpm build && pnpm test:split && pnpm test:review && pnpm test:e2e && pnpm test:unit",
"test:launch": "pnpm test && node scripts/check-ci-gate.mjs && pnpm exec lhci autorun && pnpm build:base && node scripts/check-seo-meta.mjs && pnpm test:e2e:enabled"
```

Update the CI `verify` job in `.github/workflows/deploy.yml`. The unit + enabled suites must run AFTER the Lighthouse step (mirroring `test:launch`), because the enabled suite rebuilds `build/` with the dummy key and lhci serves `staticDistDir='build'` — running the enabled suite before lhci would silently audit the dummy-key build. So the step order in `verify` becomes: `pnpm test:e2e` (default) -> `pnpm exec lhci autorun` (audits the clean default build) -> `pnpm test:unit` -> `pnpm test:e2e:enabled`. Add these two steps immediately AFTER the existing Lighthouse step (chromium is already installed earlier in this job):
```yaml
      # Order matters: these run AFTER lhci. test:e2e:enabled rebuilds build/ with the dummy key,
      # and lhci serves staticDistDir='build' — so the enabled suite must never precede Lighthouse.
      - name: Component unit tests (vitest)
        run: pnpm test:unit
      - name: Enabled contact-form e2e (dummy key, network stubbed)
        run: pnpm test:e2e:enabled
```
Do not reorder or change the existing `pnpm test:e2e` and `lhci` steps otherwise, and do not change the build/deploy/smoke jobs.
  </action>
  <verify>
    <automated>node -e "const t=require('./package.json').scripts; if(!/test:unit/.test(t.test)||!/test:contrast/.test(t.test)||!/test:e2e:enabled/.test(t['test:launch'])) process.exit(1); if(!/lhci[\s\S]*seo-meta[\s\S]*test:e2e:enabled/.test(t['test:launch'])) { console.error('test:launch: enabled must come after lhci+seo'); process.exit(1) }" && grep -q "pnpm test:e2e:enabled" .github/workflows/deploy.yml && grep -q "pnpm test:unit" .github/workflows/deploy.yml && node -e "const y=require('fs').readFileSync('.github/workflows/deploy.yml','utf8'); const lhci=y.indexOf('lhci'); const en=y.indexOf('test:e2e:enabled'); if(lhci<0||en<0||en<lhci){console.error('deploy.yml: test:e2e:enabled must appear AFTER lhci');process.exit(1)}"</automated>
  </verify>
  <done>`test` runs unit + contrast; `test:launch` runs the enabled suite as its LAST step (after lhci + SEO gate); the CI verify job runs `pnpm test:unit` and `pnpm test:e2e:enabled` AFTER the Lighthouse step, so lhci only ever audits the default no-key build.</done>
</task>

<task type="auto">
  <name>Task 2: Drive the whole phase green (default + enabled + unit + gates + BASE_PATH)</name>
  <read_first>package.json, .planning/phases/06-engagement-surfaces/06-VALIDATION.md</read_first>
  <files>package.json</files>
  <action>
Run the complete phase gate and fix anything red (no new features — this is verification + any small wiring fixes surfaced by running everything together). Do NOT relax a gate to make it pass; fix the code.

Run, in order (enabled suite LAST, so it never leaves the dummy build for lhci/SEO to audit):
```bash
pnpm test           # check, lint, tokens, contrast, content, build, split, review, e2e (~70), unit
pnpm build:base && node scripts/check-seo-meta.mjs   # BASE_PATH build; SEO 5-route gate still green
pnpm test:e2e:enabled   # LAST: enabled build: form visible/accessible/validation/aria-live + axe both modes
```
Expected results / likely failure modes to check:
- Default `pnpm test:e2e` ~70 v1.0 tests unchanged AND the two new default specs green (form hidden, media omitted). If `content-routes.spec.ts` `/contact` mailto count regressed, confirm the default build has NO form (formEnabled false) so `main` still has exactly one mailto.
- `pnpm test:e2e:enabled` — the ONLY suite exercising the visible form. axe `wcag2aaa` on `/contact` in both modes transitively proves the `--danger/--success/--field-border` token contrast under the real form; the payload assertion proves the honeypot is bound + forwarded.
- `check-seo-meta.mjs` still asserts exactly 5 routes (the noindex `/contact/success/` is intentionally excluded) — confirm it still passes and `build/contact/success/index.html` exists from the build. Run it BEFORE `test:e2e:enabled` so it audits the default build.
- `test:split` (3D boundary) green — the new form/media components import no `three`/`@threlte`/`motion`.

Confirm the phase-gate aggregate is green (its ordering already runs the enabled suite last):
```bash
pnpm test:launch
```
  </action>
  <verify>
    <automated>pnpm test && pnpm build:base && node scripts/check-seo-meta.mjs && pnpm test:e2e:enabled</automated>
  </verify>
  <done>`pnpm test` (incl. unit + contrast), the BASE_PATH build + SEO gate (on the default build), and `pnpm test:e2e:enabled` (run last) all pass; `pnpm test:launch` is green end to end with the enabled suite ordered after lhci. ENGAGE-01/02/03 fully verified with no v1.0 regression.</done>
</task>

</tasks>

<verification>
- `pnpm test:launch` green (aggregates now include unit + enabled + contrast, enabled ordered last).
- CI `verify` job runs the enabled + unit suites AFTER lhci (grep + index-order confirmed in deploy.yml) — Lighthouse audits only the default build.
- Default suite ~70 v1.0 tests unchanged + new default specs (form hidden, media omitted) pass.
- Enabled suite proves the accessible form incl. axe wcag2aaa both modes + bound-honeypot payload.
- SEO 5-route gate + 3D boundary + tokens/content/review gates all green.
</verification>

<success_criteria>
- New coverage is load-bearing in both the local aggregate and CI (no false greens).
- The dummy-key enabled build can never be the artifact Lighthouse audits (enabled suite ordered after lhci in both `test:launch` and CI).
- Full phase gate green; every ENGAGE requirement has a passing named assertion; zero v1.0 regression.
</success_criteria>

<output>
After completion, create `.planning/phases/06-engagement-surfaces/06-04-SUMMARY.md`.
</output>
</content>
