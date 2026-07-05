---
phase: 04-premium-3d-needs-research
plan: 03
type: execute
wave: 3
depends_on: ["04-01", "04-02"]
files_modified:
  - src/lib/components/premium/PremiumHero.svelte
  - src/lib/components/premium/HeroScene.svelte
  - src/lib/components/premium/scene/Scene.svelte
  - src/lib/components/premium/scene/ParticleField.svelte
  - src/lib/components/premium/scene/EchoRings.svelte
  - src/lib/components/premium/scene/Lights.svelte
autonomous: false
requirements: [PREM-01, PREM-02, PREM-04]

must_haves:
  truths:
    - "node scripts/check-3d-boundary.mjs exits 0 after build: ≥1 premium chunk exists AND the home critical bundle references no three/@threlte chunk (PREM-02 proof)"
    - "The full tests/premium-3d.spec.ts suite is green (canvas-gating, aria-hidden, reduced-motion poster, PREM-02 network, dispose x15, context-loss fallback)"
    - "axe reports zero violations in BOTH modes with the canvas present, including wcag2aaa (no regression from Phase 2/3)"
    - "The whole prior e2e suite (a11y/keyboard/no-flash/os-signal/etc.) still passes with the island shipped"
  artifacts:
    - path: "scripts/check-3d-boundary.mjs"
      provides: "green PREM-02 bundle gate (now that the scene chunk exists)"
      contains: "home bundle is WebGL-free"
  key_links:
    - from: "build/index.html (Accessible entry)"
      to: "premium chunk"
      via: "must NOT reference it (modulepreload/module script)"
      pattern: "OK: .* premium chunk\\(s\\) split out"
    - from: "tests/premium-3d.spec.ts"
      to: "shipped scene + fallback matrix"
      via: "playwright green"
      pattern: "premium-3d"
---

<objective>
Drive the RED harness from 04-01 to GREEN against the scene from 04-02: prove the bundle boundary
(the primary PREM-02 gate), pass the full premium runtime suite (gating, disposal, context-loss),
confirm axe stays clean in Premium with the canvas present, and confirm no Phase 2/3 regression —
then a human confirms the scene is tasteful.

Purpose: PREM-02 is only "done" when the build-grep proves zero WebGL in the Accessible critical
path AND a separate premium chunk exists; PREM-01/04 are only "done" when the runtime suite is
green. This plan closes the phase.
Output: green scripts/check-3d-boundary.mjs, green tests/premium-3d.spec.ts, green full suite,
plus any minimal fixes needed in premium/* to get there.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/04-premium-3d-needs-research/04-RESEARCH.md
@.planning/phases/04-premium-3d-needs-research/04-VALIDATION.md
@src/lib/components/premium/PremiumHero.svelte
@src/lib/components/premium/HeroScene.svelte
@src/lib/components/premium/scene/Scene.svelte

<interfaces>
<!-- What "green" means, from 04-01. -->
- Bundle gate: `pnpm build && node scripts/check-3d-boundary.mjs` -> exit 0, prints
  "OK: N premium chunk(s) split out; home bundle is WebGL-free".
- Runtime suite: `pnpm exec playwright test tests/premium-3d.spec.ts` -> all ≥7 tests pass.
- Full regression: `pnpm test:e2e` (all tests/*.spec.ts) -> pass.
- axe tags used across the suite: ['wcag2a','wcag2aa','wcag2aaa','wcag21aa','wcag22aa'].
- If a chunk-name edge case makes the boundary matcher miss (e.g. minified `three` without the
  literal `three.module`), broaden MARK in check-3d-boundary.mjs to also match a stable three
  identifier — do NOT weaken the "home references no premium chunk" assertion.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Prove the bundle boundary green (PREM-02 primary gate)</name>
  <read_first>
    - scripts/check-3d-boundary.mjs (from 04-01)
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Validation Architecture — why import() splits the chunk; §Common Pitfalls Pitfall 1)
  </read_first>
  <files>scripts/check-3d-boundary.mjs (adjust matcher only if needed), src/lib/components/premium/* (fix a leak only if the gate finds one)</files>
  <action>
    1. Build and run the gate:
       ```bash
       pnpm build && node scripts/check-3d-boundary.mjs
       ```
    2. Expected: exit 0 with "OK: N premium chunk(s) split out; home bundle is WebGL-free".
    3. If it FAILS with "no three/@threlte chunk found": the scene isn't reachable via import() or
       the matcher is too strict — verify PremiumHero uses `import('./HeroScene.svelte')` and
       broaden MARK to a stable three token if minification stripped the literals. Do NOT statically
       import HeroScene to force the chunk.
    4. If it FAILS with "three/@threlte reachable from home critical bundle": a static import leaked
       WebGL into the Accessible graph (Pitfall 1). Find it and remove it:
       ```bash
       grep -rEn "from '(three|@threlte)" src/lib | grep -v "src/lib/components/premium/"
       ```
       That grep MUST return nothing. Any hit outside premium/ is the leak — quarantine it back
       into premium/ and reach it only via the dynamic import. Re-run until exit 0.
  </action>
  <acceptance_criteria>
    - `pnpm build && node scripts/check-3d-boundary.mjs` exits 0
    - gate stdout matches `OK: [0-9]+ premium chunk\(s\) split out; home bundle is WebGL-free`
    - `grep -rEn "from '(three|@threlte)" src/lib | grep -v "src/lib/components/premium/"` returns NOTHING (empty)
    - `pnpm test:split` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm build && node scripts/check-3d-boundary.mjs</automated>
  </verify>
  <done>The build-grep gate is green: a separate premium chunk carries three/@threlte and the prerendered Home entry references none of it — zero WebGL in the Accessible bundle (PREM-02 proven).</done>
</task>

<task type="auto">
  <name>Task 2: Drive the premium runtime suite + axe regression green</name>
  <read_first>
    - tests/premium-3d.spec.ts (from 04-01)
    - tests/a11y.spec.ts (the existing both-modes axe loop that must still pass)
    - .planning/phases/04-premium-3d-needs-research/04-VALIDATION.md (Per-Requirement Verification Map)
  </read_first>
  <files>tests/premium-3d.spec.ts (only if an assertion needs tightening), src/lib/components/premium/* (minimal fixes to pass)</files>
  <action>
    1. Run the premium suite against the production preview build:
       ```bash
       pnpm exec playwright test tests/premium-3d.spec.ts
       ```
       All ≥7 tests must pass: accessible=no canvas+poster; premium+reduce=poster,no canvas;
       premium+motion=visible aria-hidden canvas + axe clean; PREM-02 network (accessible loads no
       three, premium does); dispose x15 with zero context-leak console errors; forced context-loss
       -> poster + h1 still visible.
    2. Common fixes if a test is red (keep changes minimal, in premium/*):
       - canvas never visible in premium+motion: check show3D gating (mode.current, prefersReducedMotion,
         webglSupported) and that HeroScene actually renders a <Canvas>.
       - canvas still present under reduced-motion: prefersReducedMotion.current must gate show3D.
       - dispose test flags "Too many active WebGL contexts": confirm onDestroy runs dispose() +
         forceContextLoss() and IO/listener cleanup (Scene.svelte).
       - context-loss test: onLost must preventDefault() + call onContextLost so PremiumHero sets
         contextLost and collapses to the poster.
    3. Confirm no A11Y regression — the decorative canvas must not introduce axe violations in either
       mode (aria-hidden wrapper, no tabindex, pointer-events:none):
       ```bash
       pnpm exec playwright test tests/a11y.spec.ts
       ```
       Both must stay green (axe zero-violations incl wcag2aaa, both modes, all 5 routes).
    4. Full regression sweep (no Phase 2/3 breakage from the island):
       ```bash
       pnpm test:e2e
       ```
  </action>
  <acceptance_criteria>
    - `pnpm exec playwright test tests/premium-3d.spec.ts` exits 0 (all tests pass)
    - `pnpm exec playwright test tests/a11y.spec.ts` exits 0 (both-modes axe still clean with canvas present)
    - `pnpm test:e2e` exits 0 (entire suite green — no regression)
  </acceptance_criteria>
  <verify>
    <automated>pnpm exec playwright test tests/premium-3d.spec.ts tests/a11y.spec.ts</automated>
  </verify>
  <done>All premium runtime assertions pass (gating, decorative canvas, reduced-motion poster, network split, dispose x15 leak-free, context-loss fallback), axe stays zero-violation in both modes, and the full e2e suite is green.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human taste + comfort check of the Premium hero</name>
  <what-built>
    A procedural Threlte hero (instanced glow particles + wireframe echo rings + blue/orange point
    lights) that mounts only in Premium mode with motion allowed and WebGL present, layered over the
    existing static poster, disposed on nav-away. All automated gates (bundle boundary, runtime
    suite, axe both modes) are already green.
  </what-built>
  <action>
    All automated gates are green; this task is a human aesthetic + vestibular-comfort pass that no
    script can judge. Present the preview to the user and collect approval:
    1. Start the preview build:  `pnpm build && pnpm preview`
    2. Open the previewed Home URL. If it lands in Accessible mode, click the header mode toggle
       (top-right) to switch to Premium.
    3. Confirm a restrained, slow luminous-depth motion (particles drift, rings rotate gently) that
       reads as "the poster, brought to life" — NOT fast, flashy, or vestibular-uncomfortable; the
       hero headline/subhead/CTA stay crisp and readable above the motion.
    4. Toggle back to Accessible: the motion/canvas disappears instantly, only the static poster
       remains (no flash, no layout shift).
    5. Optional: enable OS "reduce motion", reload in Premium — expect the static poster, no animation.
    6. Optional: navigate Home -> About -> Home a few times; the scene re-appears cleanly, no console errors.
    If the user requests changes (speed, density, glow, particle count), apply minimal tweaks in
    premium/scene/* and re-run Tasks 1-2 gates before re-presenting.
  </action>
  <how-to-verify>
    Same numbered steps as <action>. The user visually confirms the scene is tasteful and comfortable
    and that every fallback path still shows the poster with no content loss.
  </how-to-verify>
  <verify>Human confirms tasteful, comfortable, non-vestibular motion; poster fallback intact on toggle/reduced-motion. Type "approved" or list adjustments.</verify>
  <done>User has approved the Premium hero's aesthetics and motion comfort (or requested tweaks were applied and re-approved).</done>
  <resume-signal>Type "approved" if the scene is tasteful and comfortable, or describe what to adjust (speed, density, glow intensity, particle count).</resume-signal>
</task>

</tasks>

<verification>
- pnpm build && node scripts/check-3d-boundary.mjs -> exit 0 (PREM-02).
- pnpm exec playwright test tests/premium-3d.spec.ts -> all pass (PREM-01/02/04).
- pnpm exec playwright test tests/a11y.spec.ts -> both modes clean (no A11Y regression).
- pnpm test:e2e -> full suite green.
- Human confirms the scene is tasteful + comfortable.
</verification>

<success_criteria>
- Bundle boundary gate green: premium chunk exists, home bundle WebGL-free (PREM-02).
- Full premium runtime suite green: gating, decorative aria-hidden canvas, reduced-motion poster, dispose x15 leak-free, context-loss fallback (PREM-01, PREM-04).
- axe zero-violations in both modes with the canvas present — no Phase 2/3 regression.
- Human sign-off on aesthetic/comfort.
</success_criteria>

<output>
After completion, create `.planning/phases/04-premium-3d-needs-research/04-03-SUMMARY.md`.
</output>
