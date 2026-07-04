---
phase: 01-foundation-deploy-proof
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified: []
autonomous: false
requirements: [DEPLOY-03]
user_setup:
  - service: github
    why: "Create the public repo under wolfwdavid, push, and enable Pages (GitHub Actions source) so the deploy workflow runs and the live URL serves"
    env_vars: []
    dashboard_config:
      - task: "Authenticate gh as wolfwdavid with repo+workflow scopes (only if the executing gh is not already logged in as wolfwdavid)"
        location: "run `gh auth login` / `gh auth status` locally"

must_haves:
  truths:
    - "The local default branch is 'main', matching the workflow trigger branches:[main]"
    - "A public GitHub repo wolfwdavid/diversityincludesdisability_four exists with origin set and the main branch pushed"
    - "GitHub Pages source is set to 'GitHub Actions' (build_type=workflow)"
    - "The deploy.yml workflow run for the push is green (gh run list shows success)"
    - "https://wolfwdavid.github.io/diversityincludesdisability_four/ returns 200 and its referenced _app JS chunk resolves 200"
    - "A deep-link/hard-refresh serves the SvelteKit 404.html app shell, not GitHub's generic 404 page"
  artifacts:
    - path: ".git/config"
      provides: "origin remote pointing at wolfwdavid/diversityincludesdisability_four"
      contains: "diversityincludesdisability_four"
  key_links:
    - from: "local branch main"
      to: ".github/workflows/deploy.yml trigger"
      via: "branches: [main] — must match the pushed default branch"
      pattern: "main"
    - from: "gh Pages API (build_type=workflow)"
      to: "deploy-pages@v4 environment github-pages"
      via: "Pages source = GitHub Actions"
      pattern: "build_type=workflow"
---

<objective>
Take the buildable app from plan 01-01 live: rename the default branch to `main` (so the
workflow triggers), create the public GitHub repo under `wolfwdavid`, push, enable Pages with
the GitHub Actions source, let the deploy workflow run, and PROVE the site is live under the
base path with resolving assets and a working SPA 404 fallback.

Purpose: This is the actual deploy proof — the whole point of Phase 1. It confirms base-path,
`.nojekyll`, and `404.html` behavior on the real GitHub Pages host (Jekyll and pretty-URL
behavior that `vite preview` cannot reproduce), before any content is built on top.

Output: A green Actions run and a live hello-world at
https://wolfwdavid.github.io/diversityincludesdisability_four/ with `_app/immutable` chunks
resolving and a deep-link hard-refresh served by the app's 404.html.

This plan is NOT autonomous: the repo-create + push + Pages-enable steps require an
authenticated `gh` as `wolfwdavid` (repo+workflow scopes). If `gh` is not so authenticated,
Task 1 hands off to the user via a checkpoint, then automated verification resumes.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-foundation-deploy-proof/01-RESEARCH.md
@.planning/phases/01-foundation-deploy-proof/01-01-SUMMARY.md

<environment_facts>
<!-- Verified in this repo on 2026-07-04. -->
- Default branch is currently `master`; the workflow triggers on `branches: [main]`. Rename BEFORE first push, or the workflow never runs (Pitfall 3).
- Repo is local-only (no origin remote yet).
- GitHub namespace is `wolfwdavid` (NOT the HF handle `WolfDavid`).
- Target repo: wolfwdavid/diversityincludesdisability_four (public — free Pages, matches "public site code only" security note).
- Live URL: https://wolfwdavid.github.io/diversityincludesdisability_four/
- Pages source MUST be "GitHub Actions" (build_type=workflow), set once via the gh API.
- First-deploy propagation can lag 1–2 min after a green run — the live probe must retry, not assert once.
- GitHub Pages returns HTTP 404 for the fallback path even when correctly serving your 404.html — assert on the BODY (app shell), not the status code, for the deep-link check.
</environment_facts>
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Rename branch to main, create the public remote, push, enable Pages</name>
  <files>.git/config (origin remote), local branch ref (master→main)</files>
  <read_first>
    - .planning/phases/01-foundation-deploy-proof/01-RESEARCH.md §"Environment Reality", §"Create remote + enable Pages", §"Open Questions" (gh auth, public/private)
    - .planning/phases/01-foundation-deploy-proof/01-01-SUMMARY.md (confirm build is green locally)
  </read_first>
  <what-built>
    Plan 01-01 produced a buildable static SvelteKit app with a committed deploy.yml
    (branches:[main]). This step publishes it and turns on Pages. It is gated on an
    authenticated `gh` as `wolfwdavid`; the assistant attempts it automatically and only
    pauses for the human if auth is missing.
  </what-built>
  <action>
FIRST check auth, then either run the sequence automatically or hand off.

0. Preflight (assistant runs):
   ```
   gh auth status
   ```
   - If authenticated as `wolfwdavid` with repo+workflow scopes → run steps 1–4 automatically.
   - If NOT → present the how-to-verify block below to the user as a human handoff and wait
     for a resume signal. Do not fail the plan; this is an expected gate.

1. Rename the branch so it matches the workflow trigger (do this BEFORE pushing):
   ```
   git branch -m master main
   ```

2. Create the public repo under wolfwdavid, set origin, and push main:
   ```
   gh repo create wolfwdavid/diversityincludesdisability_four --public --source=. --remote=origin --push
   ```
   (Ensure pnpm-lock.yaml, static/.nojekyll, and .github/workflows/deploy.yml are committed
    and included in this push — CI needs the lockfile for --frozen-lockfile.)

3. Enable Pages with the GitHub Actions source:
   ```
   gh api -X PUT /repos/wolfwdavid/diversityincludesdisability_four/pages -f build_type=workflow
   ```
   If PUT 404s because the Pages site does not exist yet, create it first:
   ```
   gh api -X POST /repos/wolfwdavid/diversityincludesdisability_four/pages -f build_type=workflow
   ```

4. The push in step 2 triggers deploy.yml on `main`. Watch it to green:
   ```
   gh run watch
   # or: gh run list --workflow deploy.yml   (expect a completed/success run)
   ```
  </action>
  <how-to-verify>
    Human handoff (only if `gh auth status` is not wolfwdavid). Run these locally, then reply:
    1. `gh auth status` — confirm you are logged in as wolfwdavid (else `gh auth login` with
       repo + workflow scopes).
    2. `git branch -m master main`
    3. `gh repo create wolfwdavid/diversityincludesdisability_four --public --source=. --remote=origin --push`
    4. `gh api -X PUT /repos/wolfwdavid/diversityincludesdisability_four/pages -f build_type=workflow`
       (if that 404s, use `-X POST` instead)
    5. `gh run watch` — wait until the "Deploy to GitHub Pages" run is green.
    Confirm the repo is PUBLIC (free Pages) and contains no PII/creds from the private Notion
    source.
  </how-to-verify>
  <acceptance_criteria>
    - `git branch --show-current` prints `main`
    - `git remote get-url origin` contains `diversityincludesdisability_four`
    - `gh run list --workflow deploy.yml --limit 1` shows a `success`/`completed` run
    - `gh api /repos/wolfwdavid/diversityincludesdisability_four/pages --jq .build_type` prints `workflow`
  </acceptance_criteria>
  <verify>
    <automated>test "$(git branch --show-current)" = "main" && git remote get-url origin | grep -q diversityincludesdisability_four && gh run list --workflow deploy.yml --limit 1 2>/dev/null | grep -qiE "success|completed"</automated>
  </verify>
  <resume-signal>Reply "deployed" once `gh run list` shows a green "Deploy to GitHub Pages" run (or paste the run URL), or describe the failure.</resume-signal>
  <done>Branch is main, public repo wolfwdavid/diversityincludesdisability_four exists with origin set and main pushed, Pages source = GitHub Actions, and the deploy workflow run is green.</done>
</task>

<task type="auto">
  <name>Task 2: Verify the live site under the base path (200, resolving _app chunk, SPA 404 fallback)</name>
  <files>(no files — live-URL probes against the deployed Pages site)</files>
  <read_first>
    - .planning/phases/01-foundation-deploy-proof/01-RESEARCH.md §"Validation Architecture" → "B. Live-URL probes"
    - .planning/phases/01-foundation-deploy-proof/01-VALIDATION.md (Manual-Only Verifications, propagation lag)
  </read_first>
  <action>
After Task 1's workflow run is green, verify the real Pages URL. First deploys can lag 1–2
minutes, so the root check RETRIES. Run these (bash / Git Bash):

```
URL=https://wolfwdavid.github.io/diversityincludesdisability_four/

# 1. Root returns 200 (retry up to ~2.5 min for first-deploy propagation):
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
  [ "$code" = "200" ] && { echo "OK root 200"; break; }
  echo "waiting… ($code)"; sleep 15
done

# 2. The referenced _app JS chunk actually resolves under the base path:
asset=$(curl -s "$URL" | grep -oE '/diversityincludesdisability_four/_app/[^"]+\.js' | head -1)
curl -s -o /dev/null -w 'asset %{http_code}\n' "https://wolfwdavid.github.io${asset}"   # expect 200

# 3. Deep-link / hard-refresh is served by the SvelteKit 404.html app shell (NOT GitHub's
#    generic 404). Pages returns HTTP 404 for this path even when correct — assert on the BODY:
curl -s "${URL}does-not-exist/" | grep -qi "sveltekit\|%sveltekit\|deploy proof" \
  && echo "OK SPA fallback served" || echo "FAIL: not the app 404.html"
```

Interpretation:
- Probe 1 must reach `OK root 200`.
- Probe 2 must print `asset 200`.
- Probe 3 must print `OK SPA fallback served` (body is the app shell, not GitHub's page).

If probe 2 or 3 fails, the likely cause is a base-path or `.nojekyll` regression — inspect
DevTools Network for red `_app/immutable` 404s and confirm `build/.nojekyll` shipped in the
artifact. This is exactly the failure class Phase 1 exists to catch early.
  </action>
  <acceptance_criteria>
    - `curl -s -o /dev/null -w '%{http_code}' https://wolfwdavid.github.io/diversityincludesdisability_four/` returns `200` (after retry window)
    - The first `/diversityincludesdisability_four/_app/*.js` chunk referenced by the page returns `200`
    - `curl -s https://wolfwdavid.github.io/diversityincludesdisability_four/does-not-exist/` body matches `sveltekit|deploy proof` (app 404.html served, not GitHub's generic 404)
  </acceptance_criteria>
  <verify>
    <automated>URL=https://wolfwdavid.github.io/diversityincludesdisability_four/; for i in $(seq 1 10); do code=$(curl -s -o /dev/null -w '%{http_code}' "$URL"); [ "$code" = "200" ] && break; sleep 15; done; test "$code" = "200" && asset=$(curl -s "$URL" | grep -oE '/diversityincludesdisability_four/_app/[^"]+\.js' | head -1) && test -n "$asset" && test "$(curl -s -o /dev/null -w '%{http_code}' https://wolfwdavid.github.io${asset})" = "200" && curl -s "${URL}does-not-exist/" | grep -qi "sveltekit\|deploy proof"</automated>
  </verify>
  <done>The live URL returns 200, its referenced _app chunk resolves 200, and a deep-link hard-refresh is served by the app's 404.html SPA fallback. Deploy proof complete — base-path, .nojekyll, and 404 fallback all validated on the real host.</done>
</task>

</tasks>

<verification>
Phase deploy-proof gate:
1. `git branch --show-current` = `main`; `git remote get-url origin` contains the repo.
2. `gh run list --workflow deploy.yml` shows a green run.
3. `gh api /repos/wolfwdavid/diversityincludesdisability_four/pages --jq .build_type` = `workflow`.
4. Root URL 200; referenced `_app/*.js` chunk 200; deep-link body is the app 404.html shell.
</verification>

<success_criteria>
- DEPLOY-03 (live proof): the pnpm GitHub Actions workflow ran green on push to main and
  auto-deployed to Pages with BASE_PATH injected from the repo name.
- The hello-world is live at https://wolfwdavid.github.io/diversityincludesdisability_four/
  with every `_app/immutable` asset resolving (no 404s) — validating base-path + `.nojekyll`.
- A deep-link hard-refresh resolves via the `404.html` SPA fallback, not GitHub's generic 404.
- The repo is public and contains no PII/creds from the private Notion source.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-deploy-proof/01-02-SUMMARY.md`
recording: the repo URL, the green run URL, Pages build_type, the live-probe results
(root 200, asset 200, SPA fallback body match), and whether Task 1 ran automatically or via
human handoff. This closes Phase 1's deploy proof; Phase 2 (Mode System & Design Tokens)
builds on this validated hosting.
</output>
