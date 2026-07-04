---
phase: 1
slug: foundation-deploy-proof
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase is infrastructure/deploy — validation is build-output assertions and a live-URL probe, not unit tests.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build-output assertions (shell) + live-URL smoke check (curl). No unit-test framework this phase. |
| **Config file** | none — deploy proof validated via build artifacts + Pages URL |
| **Quick run command** | `pnpm build` (must exit 0 and emit build/) |
| **Full suite command** | `pnpm build && ls build/index.html build/404.html build/.nojekyll` |
| **Estimated runtime** | ~20 seconds local build; +1–2 min Pages propagation |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build` (or the task's specific assertion)
- **After every plan wave:** Run the full build-output assertion set
- **Before `/gsd:verify-work`:** Live Pages URL returns 200 with base-path assets resolving
- **Max feedback latency:** ~20s local; live-URL check retries over ~2 min

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DEPLOY-01 | build | `pnpm build && test -f build/index.html` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DEPLOY-01 | grep | `grep -rq "/diversityincludesdisability_four/_app" build/index.html` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | DEPLOY-02 | file | `test -f build/404.html && test -f build/.nojekyll` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | DEPLOY-03 | file | `test -f .github/workflows/deploy.yml && grep -q "upload-pages-artifact" .github/workflows/deploy.yml` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | DEPLOY-03 | live | `curl -sfI https://wolfwdavid.github.io/diversityincludesdisability_four/ | grep -q "200"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` + SvelteKit scaffold — created in the first plan task (no framework preinstalled)
- [ ] `pnpm install` — dependencies from verified STACK.md pins
- [ ] No separate test framework needed this phase — assertions are build-output + curl

*Build tooling is the "framework" here; it is installed by the scaffold task.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub repo created + Pages source = GitHub Actions | DEPLOY-03 | Requires authenticated `gh` (possible human handoff) | Run `gh auth status`; if authed as wolfwdavid: `gh repo create wolfwdavid/diversityincludesdisability_four --public --source=. --push` then `gh api -X PUT /repos/wolfwdavid/diversityincludesdisability_four/pages -f build_type=workflow`. Else hand off to user. |
| Live site reachable under base path | DEPLOY-03 | Depends on Pages CDN propagation (1–2 min) after first Actions run | After workflow succeeds, retry `curl -sfI https://wolfwdavid.github.io/diversityincludesdisability_four/` until 200 |

---

## Validation Sign-Off

- [ ] All tasks have build/grep/file/live assertions or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers scaffold/install
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s local
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
