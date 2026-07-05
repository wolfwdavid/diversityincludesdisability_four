---
phase: 05-launch-hardening
plan: 04
type: execute
wave: 3
depends_on: ["05-01", "05-02", "05-03"]
files_modified:
  - .github/workflows/deploy.yml
  - scripts/check-ci-gate.mjs
  - package.json
autonomous: true
requirements: [QA-01, DEPLOY-04]

must_haves:
  truths:
    - "A `verify` job runs Playwright (axe both modes, all routes) + lhci BEFORE build, and build/deploy are gated on it"
    - "The deploy step self-heals a transient Pages failure via a guarded deploy1/deploy2 pair"
    - "A post-deploy `smoke` job runs live-smoke against the deployed page_url with propagation retry"
  artifacts:
    - path: ".github/workflows/deploy.yml"
      provides: "verify -> build -> deploy(retry) -> smoke pipeline"
      contains: "needs: verify"
    - path: "scripts/check-ci-gate.mjs"
      provides: "Static assertion that deploy.yml contains the gate + retry + smoke wiring"
  key_links:
    - from: "build job"
      to: "verify job"
      via: "needs: verify"
      pattern: "needs: verify"
    - from: "smoke job"
      to: "deploy job page_url"
      via: "needs.deploy.outputs.page_url"
      pattern: "needs.deploy.outputs.page_url"
---

<objective>
Wire the launch pipeline into `.github/workflows/deploy.yml`: a gating `verify` job (Playwright
axe-both-modes + Lighthouse) before build, a BASE_PATH build, a guarded-retry deploy (Follow-up 1),
and a post-deploy live `smoke` job (DEPLOY-04). Add a static `check-ci-gate.mjs` so the wiring itself
is asserted. This is the QA-01 gate that fails the build on any a11y violation.

Purpose: every push must be blocked on the axe/Lighthouse gate and verified live. CI-only behavior
cannot be fully executed locally, so acceptance is a workflow-content grep (`check-ci-gate.mjs`) plus
the underlying commands already proven locally in Plans 05-01..05-03.

Output: rewritten `deploy.yml` (verify -> build -> deploy(guarded pair) -> smoke), `check-ci-gate.mjs`,
and a `test:ci-gate` script.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-launch-hardening/05-RESEARCH.md
@.github/workflows/deploy.yml
@package.json

<facts>
- `pnpm test:e2e` runs Playwright whose webServer is `pnpm build && pnpm preview` (BASE-LESS), producing `build/` at root. The `verify` job therefore gets a base-less `build/` on disk that lhci then serves via staticDistDir (research "Why two builds"). The separate `build` job does the BASE_PATH build for the Pages artifact.
- CI must install the browser: `pnpm exec playwright install --with-deps chromium`.
- Follow-up 1 pattern (research "Follow-up 1", Option B): GitHub Actions cannot loop a `uses:` step, so use a guarded pair -- `deploy1` (continue-on-error) then, on failure, `sleep 30` + `deploy2`. `page_url` resolves from whichever succeeded.
- Smoke retry: `nick-fields/retry@v4` is correct for the shell `node scripts/live-smoke.mjs` step (research "Retry the smoke step").
- `deploy-pages@v4` accepts `timeout` (ms). Reconfirm the input name against the action README if it errors.
- Depends on 05-01 (test:e2e now includes seo.spec), 05-02 (no-flash deterministic + CI worker cap so the verify job is stable), 05-03 (lhci + live-smoke scripts exist).
</facts>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite deploy.yml as verify -> build -> deploy(retry) -> smoke</name>
  <read_first>
    - .github/workflows/deploy.yml (current build+deploy -- you are replacing it)
    - .planning/phases/05-launch-hardening/05-RESEARCH.md sections "CI Gate (QA-01)", "Follow-up 1: Deploy Retry", "Retry the smoke step"
    - package.json (script names: test:e2e, lhci, smoke)
  </read_first>
  <action>
    Replace `.github/workflows/deploy.yml` in full with the pipeline below (keep the existing `name`,
    `on`, `permissions`, `concurrency` header; permissions already include pages:write + id-token:write):

    ```yaml
    name: Deploy to GitHub Pages

    on:
      push:
        branches: [main]
      workflow_dispatch:

    permissions:
      contents: read
      pages: write
      id-token: write

    concurrency:
      group: pages
      cancel-in-progress: true

    jobs:
      verify:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: pnpm/action-setup@v4
          - uses: actions/setup-node@v4
            with:
              node-version: 24
              cache: pnpm
          - run: pnpm install --frozen-lockfile
          - name: Install Playwright browser
            run: pnpm exec playwright install --with-deps chromium
          - name: E2E + axe (both modes, all routes) - hard WCAG gate
            run: pnpm test:e2e
          - name: Lighthouse budgets (base-less build/)
            run: pnpm exec lhci autorun

      build:
        needs: verify
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: pnpm/action-setup@v4
          - uses: actions/setup-node@v4
            with:
              node-version: 24
              cache: pnpm
          - run: pnpm install --frozen-lockfile
          - name: Build (BASE_PATH for Pages)
            env:
              BASE_PATH: '/${{ github.event.repository.name }}'
            run: pnpm run build
          - uses: actions/upload-pages-artifact@v3
            with:
              path: build

      deploy:
        needs: build
        runs-on: ubuntu-latest
        environment:
          name: github-pages
          url: ${{ steps.deploy2.outputs.page_url || steps.deploy1.outputs.page_url }}
        outputs:
          page_url: ${{ steps.deploy2.outputs.page_url || steps.deploy1.outputs.page_url }}
        steps:
          - id: deploy1
            uses: actions/deploy-pages@v4
            continue-on-error: true
            with:
              timeout: 600000
          - name: Wait before retry
            if: steps.deploy1.outcome == 'failure'
            run: sleep 30
          - id: deploy2
            if: steps.deploy1.outcome == 'failure'
            uses: actions/deploy-pages@v4
            with:
              timeout: 600000

      smoke:
        needs: deploy
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: pnpm/action-setup@v4
          - uses: actions/setup-node@v4
            with:
              node-version: 24
              cache: pnpm
          - name: Live smoke (with CDN-propagation retry)
            uses: nick-fields/retry@v4
            with:
              timeout_minutes: 3
              max_attempts: 5
              retry_wait_seconds: 15
              command: node scripts/live-smoke.mjs "${{ needs.deploy.outputs.page_url }}"
    ```

    Do not `pnpm install` in the smoke job -- live-smoke uses only Node global fetch (no deps).
  </action>
  <acceptance_criteria>
    - `rg 'verify:|build:|deploy:|smoke:' .github/workflows/deploy.yml` shows all four jobs.
    - `rg 'needs: verify' .github/workflows/deploy.yml`, `rg 'needs: build' .github/workflows/deploy.yml`, `rg 'needs: deploy' .github/workflows/deploy.yml` all match (gate chain).
    - `rg 'pnpm test:e2e' .github/workflows/deploy.yml` and `rg 'lhci autorun' .github/workflows/deploy.yml` match (axe + Lighthouse gate).
    - `rg 'playwright install --with-deps chromium' .github/workflows/deploy.yml` matches.
    - `rg 'continue-on-error: true' .github/workflows/deploy.yml` and `rg "steps.deploy1.outcome == 'failure'" .github/workflows/deploy.yml` match (guarded retry pair).
    - `rg 'nick-fields/retry@v4' .github/workflows/deploy.yml` and `rg 'scripts/live-smoke.mjs' .github/workflows/deploy.yml` match.
    - `pnpm dlx yaml-lint .github/workflows/deploy.yml` parses without error (valid YAML).
  </acceptance_criteria>
  <verify>
    <automated>pnpm dlx yaml-lint .github/workflows/deploy.yml</automated>
  </verify>
  <done>deploy.yml is a verify -> build -> deploy(guarded retry) -> smoke pipeline: build/deploy gated on verify (axe + lhci), transient Pages failure self-heals, live smoke runs post-deploy with retry.</done>
</task>

<task type="auto">
  <name>Task 2: Author scripts/check-ci-gate.mjs + test:ci-gate script</name>
  <read_first>
    - .github/workflows/deploy.yml (the file this gate asserts)
    - scripts/check-3d-boundary.mjs (Node-ESM style to mirror)
    - package.json (scripts)
  </read_first>
  <action>
    1. Create `scripts/check-ci-gate.mjs` -- a static assertion that the workflow contains the QA-01 gate,
       the Follow-up-1 retry, and the DEPLOY-04 smoke wiring (so a future edit cannot silently drop the gate):
       ```js
       import { readFileSync } from 'node:fs';

       const wf = readFileSync('.github/workflows/deploy.yml', 'utf8');
       const need = [
         ['verify job', /verify:/],
         ['playwright browser install', /playwright install --with-deps chromium/],
         ['axe/e2e gate', /pnpm test:e2e/],
         ['lighthouse budget', /lhci autorun/],
         ['build gated on verify', /needs: verify/],
         ['deploy gated on build', /needs: build/],
         ['guarded deploy retry', /continue-on-error: true/],
         ['deploy retry guard', /steps\.deploy1\.outcome == 'failure'/],
         ['smoke gated on deploy', /smoke:[\s\S]*needs: deploy/],
         ['smoke retry action', /nick-fields\/retry@v4/],
         ['smoke runs live-smoke', /scripts\/live-smoke\.mjs/]
       ];
       const fails = need.filter(([, re]) => !re.test(wf)).map(([label]) => label);
       if (fails.length) { console.error('CI GATE FAIL: deploy.yml missing:\n- ' + fails.join('\n- ')); process.exit(1); }
       console.log('CI GATE OK: verify(axe+lhci) -> build -> deploy(retry) -> smoke all present');
       ```
    2. Add to `package.json` `scripts`: `"test:ci-gate": "node scripts/check-ci-gate.mjs"`.
    3. Run `pnpm test:ci-gate` -> must print `CI GATE OK`.
    4. Also re-run the local proofs of what the CI will run, to confirm the gate would pass:
       - `pnpm exec lhci autorun` (after a base-less `pnpm build`) exits 0.
       - `pnpm smoke` exits 0.
  </action>
  <acceptance_criteria>
    - `pnpm test:ci-gate` prints `CI GATE OK: verify(axe+lhci) -> build -> deploy(retry) -> smoke all present` and exits 0.
    - `rg '"test:ci-gate"' package.json` matches.
    - `pnpm build && pnpm exec lhci autorun` exits 0 (the gate the CI verify job runs).
    - `pnpm smoke` exits 0 (the check the CI smoke job runs).
  </acceptance_criteria>
  <verify>
    <automated>pnpm test:ci-gate</automated>
  </verify>
  <done>A static gate asserts deploy.yml still contains the axe+lhci gate, the deploy retry, and the smoke wiring; wired as `pnpm test:ci-gate`; local lhci + smoke proofs green.</done>
</task>

</tasks>

<verification>
- `pnpm test:ci-gate` -> `CI GATE OK`.
- `pnpm dlx yaml-lint .github/workflows/deploy.yml` -> valid.
- `pnpm build && pnpm exec lhci autorun` -> exits 0; `pnpm smoke` -> exits 0 (the two commands the CI runs).
- Grep confirms `needs: verify`, `continue-on-error: true`, `nick-fields/retry@v4`, `scripts/live-smoke.mjs` all in deploy.yml.
</verification>

<success_criteria>
The workflow gates build+deploy on the axe(both modes)+Lighthouse `verify` job, self-heals a transient
Pages deploy failure, and verifies the live URL post-deploy -- with a static gate proving the wiring
stays intact.
</success_criteria>

<output>
After completion, create `.planning/phases/05-launch-hardening/05-04-SUMMARY.md`.
</output>
