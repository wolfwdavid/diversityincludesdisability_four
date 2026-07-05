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
  - src/routes/about/+page.svelte
  - src/routes/services/+page.svelte
  - src/routes/contact/+page.svelte
  - src/routes/accessibility/+page.svelte
autonomous: true
requirements: [CONT-06]
must_haves:
  truths:
    - "Every page can import all site copy from one typed module (no forked strings)"
    - "No `[REVIEW` marker can reach built HTML"
    - "No hardcoded absolute internal href (`href=\"/`) survives in source"
    - "All five routes exist (real or stub) so the crawler-strict build never hard-fails on a missing nav/footer link"
  artifacts:
    - path: "src/lib/content/site.ts"
      provides: "Single typed content source for the whole site (CONT-06)"
      contains: "export const site"
    - path: "scripts/check-content-source.mjs"
      provides: "CONT-06 gate: pages import site.ts + no hardcoded absolute internal links"
    - path: "scripts/check-review-markers.mjs"
      provides: "Build gate: fails if `[REVIEW` appears in build/**/*.html"
    - path: "src/routes/about/+page.svelte"
      provides: "Wave-1 placeholder stub (overwritten by 03-06 in Wave 3) so `pnpm build` resolves the shell's /about link"
    - path: "src/routes/services/+page.svelte"
      provides: "Wave-1 placeholder stub (overwritten by 03-05 in Wave 3)"
    - path: "src/routes/contact/+page.svelte"
      provides: "Wave-1 placeholder stub (overwritten by 03-06 in Wave 3)"
    - path: "src/routes/accessibility/+page.svelte"
      provides: "Wave-1 placeholder stub (overwritten by 03-06 in Wave 3)"
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
(no `[REVIEW` string in the built HTML). Wire both into `package.json` test scripts. Finally, lay down
minimal placeholder `+page.svelte` stubs for the four not-yet-built routes (/about, /services, /contact,
/accessibility) so that the crawler-strict `prerender.entries:['*'] + handleHttpError:'fail'` build stays
green the moment Wave 2 adds nav/footer links to those routes.

Purpose: One auditable copy source, zero drift between modes, a build that fails if placeholder markers or
base-path-breaking links ever leak, and a continuously buildable route graph from Wave 2 onward.
Output: `site.ts`, two gate scripts, updated `package.json`, four throwaway route stubs.
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
@svelte.config.js
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
    - `grep -q "check-content-source.mjs" package.json` and `grep -q "check-review-markers.mjs" package.json`
    - After `pnpm build`, `node scripts/check-review-markers.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>node scripts/check-content-source.mjs && pnpm build && node scripts/check-review-markers.mjs</automated>
  </verify>
  <done>Both gates run clean on the current tree, both are wired into package.json (`test:content`, `test:review`, and referenced in the `test` chain), in the correct order (content grep before build, review grep after build).</done>
</task>

<task type="auto">
  <name>Task 3: Placeholder route stubs so the crawler-strict build stays green from Wave 2 on</name>
  <files>src/routes/about/+page.svelte, src/routes/services/+page.svelte, src/routes/contact/+page.svelte, src/routes/accessibility/+page.svelte</files>
  <read_first>
    - svelte.config.js (`prerender.entries: ['*']`, `handleHttpError: 'fail'` — this is WHY the stubs are needed)
    - src/lib/content/site.ts (created in Task 1 — the stubs import from it to satisfy check-content-source)
  </read_first>
  <action>
    `svelte.config.js` sets `prerender.entries: ['*']` with `handleHttpError: 'fail'`, and the Playwright webServer
    runs `pnpm build && pnpm preview`. So the moment Wave 2 (03-03 shell) adds nav + footer links to /about,
    /services, /contact, and /accessibility, ANY `pnpm build` (and therefore any `npx playwright test`) will crawl
    those links and HARD-FAIL because the real routes don't land until Wave 3. Fix it now by laying down minimal
    placeholder `+page.svelte` stubs for all four routes so the build resolves them continuously.

    Each stub is a throwaway scaffold that (a) imports the content module so `check-content-source.mjs` passes on it,
    (b) renders exactly one `<h1>`, and (c) references a `site` field so the import is used (no unused-import lint):
    - `src/routes/about/+page.svelte` → `<script>import { site } from '$lib/content/site';</script>` then `<h1>{site.about.heading}</h1>`
    - `src/routes/services/+page.svelte` → import site; `<h1>Services</h1>` + `<p>{site.servicesIntro}</p>`
    - `src/routes/contact/+page.svelte` → import site; `<h1>{site.contact.ctaPhrase}</h1>`
    - `src/routes/accessibility/+page.svelte` → import site; `<h1>Accessibility</h1>` + `<p>{site.a11yStatement.conformanceTarget}</p>`

    NO `[REVIEW]` text, NO hardcoded absolute internal `href="/"`. These stubs are OVERWRITTEN with the real,
    fully accessible content in Wave 3 — /services by 03-05, and /about + /contact + /accessibility by 03-06. That
    is an intentional cross-wave overwrite, not a same-wave collision.
  </action>
  <acceptance_criteria>
    - All four files exist and each contains `content/site`
    - `grep -q '<h1' src/routes/about/+page.svelte` (and same for services, contact, accessibility)
    - NOT `grep -q 'href="/' src/routes/about/+page.svelte` (and same for the other three)
    - NOT `grep -q '\[REVIEW' src/routes/about/+page.svelte` (and same for the other three)
    - `pnpm build` (BASE_PATH set, MSYS_NO_PATHCONV=1) exits 0 and produces `build/about/index.html`, `build/services/index.html`, `build/contact/index.html`, `build/accessibility/index.html`
    - `node scripts/check-content-source.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>node scripts/check-content-source.mjs && pnpm check && pnpm build</automated>
  </verify>
  <done>Four placeholder route stubs exist, each imports site.ts and renders a single h1; `pnpm build` prerenders all five routes so the shell's nav/footer links resolve continuously from Wave 2 onward.</done>
</task>

</tasks>

<verification>
- `pnpm check` clean (site.ts + stubs type-check).
- `node scripts/check-content-source.mjs` exits 0.
- `pnpm build && node scripts/check-review-markers.mjs` exits 0, with `build/{about,services,contact,accessibility}/index.html` present.
- No `[REVIEW` string outside a comment in `site.ts`; no `[REVIEW` in any stub.
</verification>

<success_criteria>
Single typed content source exists and type-checks; both grep gates pass and are wired into `test`;
no hardcoded absolute internal links and no rendered `[REVIEW` markers are possible; and all five routes
prerender (four as throwaway stubs) so the crawler-strict build never hard-fails on a missing nav/footer link.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-01-SUMMARY.md`.
</output>
</output>
