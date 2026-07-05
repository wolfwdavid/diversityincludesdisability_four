---
phase: 03-accessible-experience
plan: 07
type: execute
wave: 4
depends_on: ["03-01", "03-02", "03-03", "03-04", "03-05", "03-06"]
files_modified:
  - tests/a11y.spec.ts
  - tests/keyboard-nav.spec.ts
  - tests/content-routes.spec.ts
  - tests/responsive.spec.ts
autonomous: false
requirements: [A11Y-02, A11Y-03, CONT-07]
must_haves:
  truths:
    - "The full suite is green: axe zero-violations on all 5 routes × both modes (incl wcag2aaa)"
    - "No [REVIEW] marker reaches build/**/*.html; no hardcoded internal href in source"
    - "Keyboard-only + screen-reader pass confirms the gold-standard experience"
  artifacts:
    - path: "tests/a11y.spec.ts"
      provides: "Final green multi-route axe gate"
  key_links:
    - from: "pnpm test"
      to: "all Phase-3 routes + gates"
      via: "full suite"
      pattern: "test:e2e"
---

<objective>
Close the phase: run the complete suite across all five now-existing routes, drive it fully green
(fixing any residual axe/heading/keyboard/reflow failures in the owning spec or a flagged component),
confirm both grep gates and the review-marker build gate pass, then a human keyboard-only + screen-reader
verification of the gold-standard Accessible experience across all five routes and both modes.

Purpose: Prove the phase's success criteria hold end-to-end, not just per-plan.
Output: green `pnpm test`; signed-off manual a11y pass.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-VALIDATION.md
@.planning/phases/03-accessible-experience/03-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Drive the full suite green</name>
  <files>tests/a11y.spec.ts, tests/keyboard-nav.spec.ts, tests/content-routes.spec.ts, tests/responsive.spec.ts</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-VALIDATION.md (per-requirement map + phase-gate command)
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (Common Pitfalls — likely failure modes: base links, heading order, trailing-slash aria-current, [REVIEW] leak)
  </read_first>
  <action>
    Run `pnpm test` (check + lint + tokens + content grep + build + review-marker grep + e2e). For any failure:
    - axe `heading-order`/`page-has-heading-one` → fix the offending route's heading levels (or ServiceCard `level` prop usage). Prefer fixing in the route/component; only adjust a spec if the assertion itself is wrong per the LOCKED contract.
    - `target-size` < 44 → bump the flagged control's scoped padding/min-size (tokens only).
    - keyboard-nav / aria-current mismatch → verify `page.route.id` comparison (trailing-slash Pitfall 3).
    - content-source/review-marker/base-link gate failures → fix the source (never weaken the gate).
    Re-run until `pnpm test` is fully green. Do NOT introduce raw hex (`node scripts/check-no-raw-hex.mjs` stays clean).
  </action>
  <acceptance_criteria>
    - `pnpm test` exits 0 (all: check, lint, test:tokens, test:content, build, test:review, test:e2e)
    - `node scripts/check-no-raw-hex.mjs` exits 0
    - axe reports zero violations for every ROUTE × MODE combination (incl `wcag2aaa`)
  </acceptance_criteria>
  <verify>
    <automated>pnpm test</automated>
  </verify>
  <done>The entire Phase-3 suite is green across all 5 routes and both modes, with all grep gates passing.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human keyboard-only + screen-reader a11y pass</name>
  <files>—</files>
  <action>
    Present the built site for a human accessibility verification pass. No code changes unless barriers are found
    (those become gap-closure tasks). This checkpoint confirms the gold-standard Accessible experience that
    automated axe + keyboard specs cannot fully judge (SR nuance, focus-visibility quality, reading order).
  </action>
  <what-built>
    All five routes (Home, About, Services, Contact, Accessibility) as one accessible semantic DOM on the
    Phase-2 mode engine: skip links, keyboard nav with mobile disclosure, aria-current, static poster hero,
    named social links, mailto CTA, and an accessibility statement — axe-clean in both modes.
  </what-built>
  <how-to-verify>
    1. Run `pnpm build && pnpm preview`; open the previewed site.
    2. Keyboard-only pass (no mouse) on EACH of `/`, `/about/`, `/services/`, `/contact/`, `/accessibility/`:
       - Press Tab once → a visible "Skip to main content" link appears; activate it → focus lands in main.
       - Tab through the nav; confirm a clearly visible focus ring on every link/button and the active page shows `aria-current`.
       - At a narrow window (~375px), the Menu button opens/closes the nav; Escape closes it and returns focus to the button.
    3. Toggle Premium ⇄ Accessible on each page: layout stays intact, no flash, no motion; the poster hero and all content remain.
    4. Screen-reader spot check (NVDA/VoiceOver): landmarks (header/nav/main/footer), one h1 per page, social links read with names, hero art is silent (decorative).
    5. Confirm no "[REVIEW" text is visible anywhere on the live pages.
  </how-to-verify>
  <verify>
    <automated>MISSING — manual screen-reader/keyboard pass; Task 1's `pnpm test` is the automated gate</automated>
  </verify>
  <done>Human confirms keyboard-only + screen-reader usability across all 5 routes × both modes with no barriers.</done>
  <resume-signal>Type "approved" or list any barriers found (they become gap-closure tasks).</resume-signal>
</task>

</tasks>

<verification>
- `pnpm test` fully green.
- Manual keyboard-only + screen-reader pass approved across all 5 routes × both modes.
- No `[REVIEW]` visible on any rendered page.
</verification>

<success_criteria>
Phase 3 success criteria proven end-to-end: keyboard-complete, axe-AAA-clean, single-content-source, responsive,
poster-hero, statement-documented Accessible experience — signed off by an automated suite and a human a11y pass.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-07-SUMMARY.md`.
</output>
