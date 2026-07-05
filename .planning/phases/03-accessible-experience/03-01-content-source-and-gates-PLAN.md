---
phase: 03-accessible-experience
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/content/site.ts
  - scripts/check-content-source.mjs
  - scripts/check-review-markers.mjs
  - package.json
autonomous: true
requirements: [CONT-06]
must_haves:
  truths:
    - "Every page can import all site copy from one typed module (no forked strings)"
    - "No `[REVIEW` marker can reach built HTML"
    - "No hardcoded absolute internal href (`href=\"/`) survives in source"
  artifacts:
    - path: "src/lib/content/site.ts"
      provides: "Single typed content source for the whole site (CONT-06)"
      contains: "export const site"
    - path: "scripts/check-content-source.mjs"
      provides: "CONT-06 gate: pages import site.ts + no hardcoded absolute internal links"
    - path: "scripts/check-review-markers.mjs"
      provides: "Build gate: fails if `[REVIEW` appears in build/**/*.html"
  key_links:
    - from: "src/routes/**/+page.svelte"
      to: "src/lib/content/site"
      via: "import { site }"
      pattern: "content/site"
---

<objective>
Create the single typed content source (`src/lib/content/site.ts`, CONT-06) holding ALL user-visible
copy from the locked CONTEXT draft, plus the two Node grep gates that keep it honest: a content-source
gate (pages must import `site.ts`; no hardcoded absolute internal `href="/"`) and a review-marker gate
(no `[REVIEW` string in the built HTML). Wire both into `package.json` test scripts.

Purpose: One auditable copy source, zero drift between modes, and a build that fails if placeholder
markers or base-path-breaking links ever leak.
Output: `site.ts`, two gate scripts, updated `package.json`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-CONTEXT.md
@.planning/phases/03-accessible-experience/03-RESEARCH.md
@scripts/check-no-raw-hex.mjs
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author the typed content source site.ts (CONT-06)</name>
  <files>src/lib/content/site.ts</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-CONTEXT.md (`<content>` draft copy — verbatim source of truth)
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (Pattern 1 — the `site.ts` shape, interfaces, `[REVIEW]`-as-comment rule)
  </read_first>
  <action>
    Create `src/lib/content/site.ts`. Export `interface ServiceItem { slug: string; title: string; summary: string; body: string }`
    and `interface SocialItem { name: string; label: string; href: string; icon: 'facebook' | 'x' | 'linkedin' | 'instagram' }`,
    then `export const site = { ... } as const`. Use ONLY the CONTEXT draft copy — invent NO credentials,
    quotes, statistics, dates, or biography. All `[REVIEW: …]` markers are **TS comments only**, never inside
    a string that renders. Populate exactly:

    - `org: 'Diversity Includes Disability'`
    - `founder: 'Eman Rimawi'`
    - `contact: { email: 'emanrimawi@gmail.com', ctaPhrase: "Let's Connect" }`
    - `home.heroHeadline: 'Diversity Includes Disability'`
    - `home.heroSubhead: 'Intersectional disability equity, inclusion, and representation — training, consulting, and speaking that move organizations from awareness to action.'`
    - `home.mission: 'Disability belongs in every conversation about diversity. Diversity Includes Disability partners with organizations, institutions, and audiences to build accessibility and belonging into the way they work — not as an afterthought, but as a foundation.'`
    - `home.founderRole: 'Founder & Lead Consultant'` with a trailing `// [REVIEW: confirm title]` comment
    - `home.founderPositioning: 'Eman Rimawi leads Diversity Includes Disability, partnering with organizations to build accessibility and belonging into how they work.'` with `// [REVIEW: bio specifics — confirm with Eman]` comment
    - `about.heading: 'About Eman Rimawi'`
    - `about.para1`: mission expanded, true-and-generic (e.g. "Diversity Includes Disability works with organizations, institutions, and audiences to make disability a central part of every diversity, equity, and inclusion conversation — moving partners from awareness to durable, accessible practice.")
    - `about.para2Placeholder`: generic-but-true intersectional-advocacy framing, preceded by `// [REVIEW: Eman's personal story / lived experience / credentials — to be provided]`
    - `about.para3`: approach line (intersectional, lived-experience-informed, action-oriented)
    - `about.pullQuote: undefined as string | undefined` with `// [REVIEW: real quote from Eman — render only if provided]`
    - `services: [...] satisfies ServiceItem[]` — four items using CONTEXT descriptions verbatim:
      trainings ("Trainings & Facilitation"), consulting ("Disability Consulting"),
      modeling ("Modeling for Representation"), speaking ("Speaking & Panels"). Each gets a one-line `summary`
      (for Home cards) and a fuller `body` (for /services) drawn from the CONTEXT §Services descriptions.
    - `servicesIntro: 'Diversity Includes Disability partners with organizations across trainings, consulting, representation, and speaking — meeting each partner where they are and building toward durable, accessible practice.'` (intro line for /services; true-and-generic)
    - `contactIntro: 'Reach out about trainings, consulting, modeling, or speaking engagements — or just to start a conversation about building disability equity into your work.'` (invitation line for /contact)
    - `social: [...] satisfies SocialItem[]` — Facebook / X / LinkedIn / Instagram, each `href: '#'` (NOT empty string)
      with a trailing `// [REVIEW: confirm handle/URL]` comment, and `label` an accessible name like
      'Diversity Includes Disability on Facebook'.
    - `a11yStatement: { conformanceTarget, knownIssues: string[], feedbackEmail: 'emanrimawi@gmail.com', reviewCadence, lastReviewed }`.
      `conformanceTarget`: 'WCAG 2.2 Level AA as the floor, targeting Level AAA where feasible in Accessible mode.'
      `knownIssues`: honest short list, e.g. ['The Premium 3D hero is not yet shipped; the Accessible static poster is the current hero in both modes.', 'Social profile links are pending confirmation.']
      `reviewCadence`: 'Reviewed at least every six months.'  `lastReviewed: '2026-07'` with `// [REVIEW: keep current]`.

    Top-of-file comment block: "Single source of truth for ALL site copy (CONT-06). [REVIEW] markers are CODE COMMENTS ONLY — never rendered."
  </action>
  <acceptance_criteria>
    - `grep -q "export const site" src/lib/content/site.ts`
    - `grep -q "emanrimawi@gmail.com" src/lib/content/site.ts`
    - `grep -q "Let's Connect" src/lib/content/site.ts`
    - `grep -q "satisfies ServiceItem\[\]" src/lib/content/site.ts`
    - `grep -q "satisfies SocialItem\[\]" src/lib/content/site.ts`
    - `grep -q "servicesIntro" src/lib/content/site.ts` and `grep -q "contactIntro" src/lib/content/site.ts`
    - `grep -c "href: '#'" src/lib/content/site.ts` returns 4
    - `[REVIEW` appears ONLY on comment lines (each occurrence line also contains `//`)
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>`site.ts` type-checks, exports `site` + both interfaces, holds all CONTEXT copy (incl servicesIntro/contactIntro), and every `[REVIEW` is a comment.</done>
</task>

<task type="auto">
  <name>Task 2: Content-source + review-marker grep gates and package.json wiring</name>
  <files>scripts/check-content-source.mjs, scripts/check-review-markers.mjs, package.json</files>
  <read_first>
    - scripts/check-no-raw-hex.mjs (the walker pattern to mirror — Windows/pnpm-safe, no rg/bash)
    - package.json (existing `test` script chain)
  </read_first>
  <action>
    Model both scripts on `scripts/check-no-raw-hex.mjs` (Node `fs`, forward-slash normalized paths, `process.exit(1)` on failure).

    `scripts/check-content-source.mjs` (CONT-06 + base-path safety, source-only, no build needed):
    1. Walk `src/routes/**/+page.svelte`; FAIL any that does not contain the substring `content/site` (every page must import the content module).
    2. Walk all `src/**/*.svelte`; FAIL on any literal `href="/` (hardcoded absolute internal link — must use `resolve()` instead). Allowed href literals are `href="#`, `href="mailto:`, `href={` (resolve/expression). Match only the literal-string form `href="/`.
    Print `OK: content sourced from site.ts, no hardcoded base-breaking links` on success.

    `scripts/check-review-markers.mjs` (build gate):
    - Walk `build/**/*.html`; FAIL if any file contains the substring `[REVIEW`. If `build/` does not exist, exit non-zero with a message to run `pnpm build` first.
    Print `OK: no [REVIEW markers in built HTML` on success.

    `package.json` scripts — add and rewire (keep pnpm, no npm):
    - `"test:content": "node scripts/check-content-source.mjs"`
    - `"test:review": "node scripts/check-review-markers.mjs"`
    - Update `"test"` to: `"pnpm check && pnpm lint && pnpm test:tokens && pnpm test:content && pnpm build && pnpm test:review && pnpm test:e2e"`
  </action>
  <acceptance_criteria>
    - `node scripts/check-content-source.mjs` exits 0 on the current tree
    - `grep -q "test:content" package.json` and `grep -q "test:review" package.json`
    - `grep -q "check-content-source.mjs" package.json` and `grep -q "check-review-markers.mjs" scripts/check-review-markers.mjs`
    - After `pnpm build`, `node scripts/check-review-markers.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>node scripts/check-content-source.mjs && pnpm build && node scripts/check-review-markers.mjs</automated>
  </verify>
  <done>Both gates run clean on the current tree and are wired into the `test` script in the correct order (content grep before build, review grep after build).</done>
</task>

</tasks>

<verification>
- `pnpm check` clean (site.ts type-checks).
- `node scripts/check-content-source.mjs` exits 0.
- `pnpm build && node scripts/check-review-markers.mjs` exits 0.
- No `[REVIEW` string outside a comment in `site.ts`.
</verification>

<success_criteria>
Single typed content source exists and type-checks; both grep gates pass and are wired into `test`;
no hardcoded absolute internal links and no rendered `[REVIEW` markers are possible.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-01-SUMMARY.md`.
</output>
