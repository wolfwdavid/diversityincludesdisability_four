---
phase: 01-foundation-deploy-proof
plan: 02
subsystem: infra
tags: [github-pages, deploy, gh-cli, live-proof, base-path, spa-fallback, actions]

# Dependency graph
requires:
  - Buildable base-path-correct static SvelteKit app + committed deploy.yml (from 01-01)
provides:
  - Public repo wolfwdavid/diversityincludesdisability_four with main pushed and origin set
  - GitHub Pages enabled with source = GitHub Actions (build_type=workflow)
  - Green "Deploy to GitHub Pages" Actions run (run 28720101269)
  - Live hello-world at https://wolfwdavid.github.io/diversityincludesdisability_four/ (root 200, _app chunk 200, SPA 404 fallback served)
affects: [mode-system, design-tokens, content-pages, premium-3d, launch-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Default branch renamed master→main BEFORE first push so the push carries main and triggers deploy.yml (branches:[main])"
    - "Pages enabled once via gh api: PUT 404s on a brand-new site, POST /pages -f build_type=workflow creates it with the Actions source"
    - "First-deploy live probe retries the root 200 (1-2 min propagation) and asserts the deep-link on BODY (app shell), not the 404 status Pages always returns for the fallback path"

key-files:
  created: []
  modified: []

key-decisions:
  - "Created the repo --public: free Pages, matches the 'public site code only' security note; verified no PII/creds/.env tracked before pushing"
  - "Pages site created via POST (not PUT) because the site did not exist yet on the fresh repo; result build_type=workflow confirmed"

requirements-completed: [DEPLOY-03]

# Metrics
duration: 3min
completed: 2026-07-04
---

# Phase 1 Plan 02: Remote Deploy & Live Proof Summary

**Took the buildable app from 01-01 live: renamed master→main, created the public repo `wolfwdavid/diversityincludesdisability_four`, enabled Pages with the GitHub Actions source, let deploy.yml run green, and PROVED the site live under the base path — root 200, `_app/immutable` chunk 200, and a deep-link served by the SvelteKit 404.html SPA fallback.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-04T21:23:44Z
- **Completed:** 2026-07-04T21:26:00Z
- **Tasks:** 2
- **Files modified:** 0 source files (git/GitHub operations + live probes)

## Accomplishments

- **Task 1 (deploy enable, ran automatically):** `gh` was already authenticated as `wolfwdavid` with `repo`+`workflow` scopes, so the human-action checkpoint was auto-approved per the granted authorization. Renamed the default branch `master → main` (matching `deploy.yml`'s `branches:[main]`), created the **public** repo `wolfwdavid/diversityincludesdisability_four` with `gh repo create --public --source=. --remote=origin --push`, and enabled Pages with the GitHub Actions source (`gh api POST /pages -f build_type=workflow` → `build_type=workflow`). The push triggered `deploy.yml`, which ran **green** (run 28720101269: build 14s, deploy 10s).
- **Task 2 (live proof):** Verified the real Pages host. Root URL returns **200** on first attempt; the referenced `_app/immutable/entry/start.B5nHrnIH.js` chunk resolves **200** under the base path (base-path + `.nojekyll` validated on the real Jekyll-running host); a deep-link hard-refresh (`/does-not-exist/`) is served by the **SvelteKit 404.html app shell** (HTTP 404 status is expected for the fallback path — the body match confirms the SPA fallback, not GitHub's generic 404).

## Task Commits

- **Task 1:** Git/GitHub operations only (branch rename, remote create, push, Pages enable) — no source-file changes to commit atomically. The push published the 01-01 commits (`52494a0`, `779ee08`, `7b34041`, `cc61068`).
- **Task 2:** Live-URL probes only — no file changes.
- **Plan metadata:** final docs commit (SUMMARY + STATE + ROADMAP) — see below.

## Deploy Proof Results (actual observed)

| Check | Command | Result |
|-------|---------|--------|
| Default branch | `git branch --show-current` | `main` |
| Origin remote | `git remote get-url origin` | `https://github.com/wolfwdavid/diversityincludesdisability_four.git` |
| Actions run | `gh run list --workflow deploy.yml` | `completed / success` (run 28720101269) |
| Pages source | `gh api .../pages --jq .build_type` | `workflow` |
| Root URL | `curl -I https://wolfwdavid.github.io/diversityincludesdisability_four/` | **200** |
| `_app` chunk | fetch `/diversityincludesdisability_four/_app/immutable/entry/start.B5nHrnIH.js` | **200** |
| Deep-link SPA fallback | `curl .../does-not-exist/` body | app shell (SvelteKit 404.html) — **OK** (status 404 expected) |

**Live URL:** https://wolfwdavid.github.io/diversityincludesdisability_four/
**Repo:** https://github.com/wolfwdavid/diversityincludesdisability_four
**Green run:** https://github.com/wolfwdavid/diversityincludesdisability_four/actions/runs/28720101269

## Decisions Made

- **Public repo** — free Pages, matches the project's "public site code only" security note. Verified no `.env`/secret/credential/Notion files are tracked before the push (`git ls-files` scan returned none).
- **Pages via POST not PUT** — the initial `PUT /pages` returned 404 because the Pages site did not yet exist on the brand-new repo; `POST /pages -f build_type=workflow` created it with the Actions source in one call.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pages `PUT` 404 on a brand-new repo — used `POST` to create the site**
- **Found during:** Task 1 (enable Pages)
- **Issue:** `gh api -X PUT /repos/.../pages -f build_type=workflow` returned `404 Not Found` because no Pages site existed yet on the freshly created repo.
- **Fix:** Fell back to `gh api -X POST /repos/.../pages -f build_type=workflow` (the plan's documented contingency), which created the site with `build_type=workflow`.
- **Files modified:** none (GitHub API operation)
- **Verification:** `gh api /repos/.../pages --jq .build_type` prints `workflow`.

**Total deviations:** 1 auto-fixed (blocking), which was an explicitly anticipated contingency in the plan. No architectural changes; no user decision required.

## Checkpoint Handling

Task 1 was a `checkpoint:human-action` gated on GitHub auth. Authorization was pre-granted (gh confirmed logged in as `wolfwdavid` with `repo`+`workflow` scopes; user pre-approved a public repo + push + Pages-enable). Per that grant, the checkpoint was treated as **auto-approved** and executed automatically — no human handoff was needed. No `gh` command failed.

## Out-of-scope Observations (not fixed)

- The Actions run emits a `Node.js 20 is deprecated` annotation for `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `deploy-pages@v4`, `pnpm/action-setup@v4` (GitHub forces them onto Node 24). This is a non-failing warning about action internals, not this repo's code, and does not affect the green deploy. Left as-is (out of scope for this deploy proof).

## Issues Encountered

None beyond the anticipated `PUT`→`POST` Pages contingency above. Root 200 was served on the first probe (no propagation lag observed this time), though the retry loop remained in place as a safety net.

## Known Stubs

None. The live hello-world `+page.svelte` is the intentional deploy-proof placeholder; real content arrives in Phase 3.

## Next Phase Readiness

- **Deploy proof is complete.** Base-path resolution, `.nojekyll` (Jekyll no longer drops `_app/`), and the `404.html` SPA fallback are all validated on the real GitHub Pages host — the exact failure class Phase 1 exists to catch is confirmed absent.
- Phase 2 (Mode System & Design Tokens) can now build on validated, base-path-correct hosting: every push to `main` auto-deploys via the green pnpm workflow.
- DEPLOY-03 live proof satisfied; DEPLOY-01/02 (proven locally in 01-01) are now confirmed on the live host as well.

---
*Phase: 01-foundation-deploy-proof*
*Completed: 2026-07-04*

## Self-Check: PASSED

- SUMMARY file present on disk (`01-02-SUMMARY.md`).
- `origin` remote = `https://github.com/wolfwdavid/diversityincludesdisability_four.git`; current branch = `main`.
- `gh run list --workflow deploy.yml` still shows a green (success/completed) run.
- Live probes re-confirmed: root 200, `_app` chunk 200, SPA 404.html fallback body served.
