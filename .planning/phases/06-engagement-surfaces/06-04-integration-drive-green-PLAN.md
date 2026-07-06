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
    - "The full phase gate is green: default e2e (~70 v1.0 tests unchanged) + enabled e2e + vitest + all grep gates + contrast + BASE_PATH build + SEO build gate."
  artifacts:
    - path: "package.json"
      provides: "test / test:launch aggregates include unit + enabled + contrast"
      contains: "test:e2e:enabled"
    - path: ".github/workflows/deploy.yml"
      provides: "CI verify job runs the enabled + unit suites"
      contains: "test:e2e:enabled"
  key_links:
    - from: "package.json test:launch"
      to: "pnpm test:e2e:enabled / pnpm test:unit / pnpm test:contrast"
      via: "aggregate chaining"
      pattern: "test:e2e:enabled"
    - from: ".github/workflows/deploy.yml verify job"
      to: "the enabled + unit suites"
      via: "added run steps after test:e2e"
      pattern: "pnpm test:unit"
---

<objective>
Wire the Phase-6 test surfaces into the aggregate commands and CI so they always run, then drive the entire phase green — default suite, enabled suite, vitest, every grep gate, the contrast gate, and the BASE_PATH production build with the SEO gate — closing out ENGAGE-01/02/03 with no v1.0 regression.

Purpose: New specs that exist but aren't in `pnpm test`/CI produce false greens. This wave makes the coverage load-bearing and proves the whole phase passes end to end.
Output: Updated `package.json` aggregates, an updated CI `verify` job, and a proven-green full run.
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

CI verify job (deploy.yml) currently runs, in order: `pnpm install` -> install chromium -> `pnpm test:e2e` -> `pnpm exec lhci autorun ...`. The enabled suite also needs chromium (already installed in this job) and does its own `pnpm build` via its webServer.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire unit + enabled + contrast into aggregates and CI</name>
  <read_first>package.json, .github/workflows/deploy.yml</read_first>
  <files>package.json, .github/workflows/deploy.yml</files>
  <action>
Update `package.json` aggregates. Add the fast checks (`test:unit`, `test:contrast`) into `test`, and the heavier enabled build into `test:launch` (it does a second full build via its webServer, so keep it at the launch gate rather than every `pnpm test`):
```json
"test": "pnpm check && pnpm lint && pnpm test:tokens && pnpm test:contrast && pnpm test:content && pnpm build && pnpm test:split && pnpm test:review && pnpm test:e2e && pnpm test:unit",
"test:launch": "pnpm test && node scripts/check-ci-gate.mjs && pnpm exec lhci autorun && pnpm build:base && node scripts/check-seo-meta.mjs && pnpm test:e2e:enabled"
```

Update the CI `verify` job in `.github/workflows/deploy.yml`. After the existing "E2E + axe" step (`pnpm test:e2e`) and before the Lighthouse step, add two steps so the enabled + unit suites gate deploys (chromium is already installed earlier in this job):
```yaml
      - name: Component unit tests (vitest)
        run: pnpm test:unit
      - name: Enabled contact-form e2e (dummy key, network stubbed)
        run: pnpm test:e2e:enabled
```
Do not change the build/deploy/smoke jobs.
  </action>
  <verify>
    <automated>node -e "const t=require('./package.json').scripts; if(!/test:unit/.test(t.test)||!/test:contrast/.test(t.test)||!/test:e2e:enabled/.test(t['test:launch'])) process.exit(1)" && grep -q "pnpm test:e2e:enabled" .github/workflows/deploy.yml && grep -q "pnpm test:unit" .github/workflows/deploy.yml</automated>
  </verify>
  <done>`test` runs unit + contrast; `test:launch` runs the enabled suite; the CI verify job runs `pnpm test:unit` and `pnpm test:e2e:enabled` between the e2e and Lighthouse steps.</done>
</task>

<task type="auto">
  <name>Task 2: Drive the whole phase green (default + enabled + unit + gates + BASE_PATH)</name>
  <read_first>package.json, .planning/phases/06-engagement-surfaces/06-VALIDATION.md</read_first>
  <files>package.json</files>
  <action>
Run the complete phase gate and fix anything red (no new features — this is verification + any small wiring fixes surfaced by running everything together). Do NOT relax a gate to make it pass; fix the code.

Run, in order:
```bash
pnpm test           # check, lint, tokens, contrast, content, build, split, review, e2e (~70), unit
pnpm test:e2e:enabled   # enabled build: form visible/accessible/validation/aria-live + axe both modes
pnpm build:base && node scripts/check-seo-meta.mjs   # BASE_PATH build; SEO 5-route gate still green
```
Expected results / likely failure modes to check:
- Default `pnpm test:e2e` ~70 v1.0 tests unchanged AND the two new default specs green (form hidden, media omitted). If `content-routes.spec.ts` `/contact` mailto count regressed, confirm the default build has NO form (formEnabled false) so `main` still has exactly one mailto.
- `pnpm test:e2e:enabled` — the ONLY suite exercising the visible form. axe `wcag2aaa` on `/contact` in both modes transitively proves the `--danger/--success/--field-border` token contrast under the real form.
- `check-seo-meta.mjs` still asserts exactly 5 routes (the noindex `/contact/success/` is intentionally excluded) — confirm it still passes and `build/contact/success/index.html` exists from the build.
- `test:split` (3D boundary) green — the new form/media components import no `three`/`@threlte`/`motion`.

Confirm the phase-gate aggregate is green:
```bash
pnpm test:launch
```
  </action>
  <verify>
    <automated>pnpm test && pnpm test:e2e:enabled && pnpm build:base && node scripts/check-seo-meta.mjs</automated>
  </verify>
  <done>`pnpm test` (incl. unit + contrast), `pnpm test:e2e:enabled`, and the BASE_PATH build + SEO gate all pass; `pnpm test:launch` is green end to end. ENGAGE-01/02/03 fully verified with no v1.0 regression.</done>
</task>

</tasks>

<verification>
- `pnpm test:launch` green (aggregates now include unit + enabled + contrast).
- CI `verify` job runs the enabled + unit suites (grep-confirmed in deploy.yml).
- Default suite ~70 v1.0 tests unchanged + new default specs (form hidden, media omitted) pass.
- Enabled suite proves the accessible form incl. axe wcag2aaa both modes.
- SEO 5-route gate + 3D boundary + tokens/content/review gates all green.
</verification>

<success_criteria>
- New coverage is load-bearing in both the local aggregate and CI (no false greens).
- Full phase gate green; every ENGAGE requirement has a passing named assertion; zero v1.0 regression.
</success_criteria>

<output>
After completion, create `.planning/phases/06-engagement-surfaces/06-04-SUMMARY.md`.
</output>
