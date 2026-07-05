---
phase: 03-accessible-experience
plan: 06
type: execute
wave: 3
depends_on: ["03-03", "03-04"]
files_modified:
  - src/routes/about/+page.svelte
  - src/routes/contact/+page.svelte
  - src/routes/accessibility/+page.svelte
autonomous: true
requirements: [CONT-02, CONT-04, A11Y-07]
must_haves:
  truths:
    - "About tells Eman's story via role-based copy (no invented biography), single h1"
    - "Contact provides a labeled mailto:emanrimawi@gmail.com plus named social links"
    - "The Accessibility Statement documents conformance target, known issues, feedback path, review cadence"
    - "No [REVIEW] marker or unprovided optional block renders"
  artifacts:
    - path: "src/routes/about/+page.svelte"
      provides: "CONT-02 About"
      min_lines: 15
    - path: "src/routes/contact/+page.svelte"
      provides: "CONT-04 mailto + CONT-05 social"
      contains: "mailto:"
    - path: "src/routes/accessibility/+page.svelte"
      provides: "A11Y-07 statement"
      min_lines: 20
  key_links:
    - from: "src/routes/contact/+page.svelte"
      to: "site.contact.email + SocialLinks"
      via: "mailto + component"
      pattern: "mailto:"
    - from: "src/routes/accessibility/+page.svelte"
      to: "site.a11yStatement"
      via: "import"
      pattern: "a11yStatement"
---

<objective>
Build the three remaining routes, all sourced from `site.ts`: About (`/about`, CONT-02 — role-based
story scaffold with the personal-story paragraph gated as a comment placeholder, optional pull-quote
rendered only if provided), Contact (`/contact`, CONT-04 + CONT-05 — labeled `mailto:` primary contact
plus the named `SocialLinks`), and the Accessibility Statement (`/accessibility`, A11Y-07 — four canonical
sections). Single `<h1>` per page; conditional rendering so no `[REVIEW]`/unprovided content ever shows.

Note: all three route files (`about`, `contact`, `accessibility`) already EXIST as Wave-1 placeholder stubs
(created by 03-01 so the crawler-strict build stayed green). This plan OVERWRITES each stub with the real
content — the files are present, not newly created.

Purpose: Complete the five-route set as one accessible DOM.
Output: three overwritten `+page.svelte` routes.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-CONTEXT.md
@.planning/phases/03-accessible-experience/03-RESEARCH.md

<interfaces>
From 03-01 `site.ts`: `site.about.{heading,para1,para2Placeholder,para3,pullQuote?}`,
`site.contact.{email,ctaPhrase}`, `site.contactIntro`, `site.founder`,
`site.a11yStatement.{conformanceTarget,knownIssues[],feedbackEmail,reviewCadence,lastReviewed}`.
From 03-03: `SocialLinks.svelte`. `resolve` from `$app/paths`. Heading rule: exactly one `<h1>` per route.
`site.about.pullQuote` is `undefined` until real copy is provided — render ONLY with `{#if site.about.pullQuote}`.
03-01 already placed stub `+page.svelte` files for /about, /contact, /accessibility — this plan overwrites all three.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: About route (CONT-02)</name>
  <files>src/routes/about/+page.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-CONTEXT.md (`<content>` §About — 2–3 role-based paras, NO invented biography; pull-quote optional)
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (CONT-02 row; Pitfall 4 [REVIEW] leak)
  </read_first>
  <action>
    OVERWRITE `src/routes/about/+page.svelte` (it already exists as the 03-01 Wave-1 stub — replace its full
    contents). `import { site } from '$lib/content/site';`
    - `<h1>{site.about.heading}</h1>` (single h1).
    - `<p>{site.about.para1}</p>`, `<p>{site.about.para2Placeholder}</p>`, `<p>{site.about.para3}</p>`.
    - Optional pull-quote: `{#if site.about.pullQuote}<blockquote>{site.about.pullQuote}</blockquote>{/if}` — renders nothing while undefined.
    - Closing link to contact: `<a href={resolve('/contact')}>{site.contact.ctaPhrase}</a>` (add `import { resolve } from '$app/paths'`).
    Scoped `<style>` tokens-only; body uses `--measure` for readable line length. No hardcoded copy; no `[REVIEW]` text.
  </action>
  <acceptance_criteria>
    - `grep -q 'site.about.heading' src/routes/about/+page.svelte`
    - `grep -q '{#if site.about.pullQuote}' src/routes/about/+page.svelte`
    - `grep -q '<h1' src/routes/about/+page.svelte`
    - NOT `grep -q '\[REVIEW' src/routes/about/+page.svelte` and NOT `grep -q 'href="/' src/routes/about/+page.svelte`
    - `node scripts/check-content-source.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>/about renders the role-based story from site.about with a conditional pull-quote and no invented/placeholder text.</done>
</task>

<task type="auto">
  <name>Task 2: Contact route (CONT-04 + CONT-05)</name>
  <files>src/routes/contact/+page.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-CONTEXT.md (`<content>` §Contact — "Let's Connect" h1, labeled mailto, named social list)
    - src/lib/components/SocialLinks.svelte (from 03-03)
  </read_first>
  <action>
    OVERWRITE `src/routes/contact/+page.svelte` (it already exists as the 03-01 Wave-1 stub — replace its full
    contents). `import { site } from '$lib/content/site'; import SocialLinks from '$lib/components/SocialLinks.svelte';`
    - `<h1>{site.contact.ctaPhrase}</h1>` (i.e. "Let's Connect").
    - `<p>{site.contactIntro}</p>`.
    - Primary contact: a visible, accessibly-named `<a href={`mailto:${site.contact.email}`}>Email {site.founder}</a>` (link text is real, not a bare icon; the address is also visible nearby).
    - `<h2>Follow Diversity Includes Disability</h2>` + `<SocialLinks />`.
    Scoped `<style>` tokens-only, mailto link target ≥44px. No backend/form (locked). No hardcoded copy.
  </action>
  <acceptance_criteria>
    - `grep -q 'mailto:' src/routes/contact/+page.svelte` and `grep -q 'site.contact.email' src/routes/contact/+page.svelte`
    - `grep -q 'SocialLinks' src/routes/contact/+page.svelte`
    - `grep -q '<h1' src/routes/contact/+page.svelte`
    - NOT `grep -q 'href="/' src/routes/contact/+page.svelte`
    - `node scripts/check-content-source.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm build && npx playwright test tests/content-routes.spec.ts --grep "contact" && npx playwright test tests/alt-text.spec.ts --grep "contact"</automated>
  </verify>
  <done>/contact exposes a labeled mailto to emanrimawi@gmail.com plus four named social links, single h1, no backend.</done>
</task>

<task type="auto">
  <name>Task 3: Accessibility Statement route (A11Y-07)</name>
  <files>src/routes/accessibility/+page.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (Pattern 6 — scope.org.uk statement shape, four h2 sections)
    - .planning/REQUIREMENTS.md (A11Y-07 text)
  </read_first>
  <action>
    OVERWRITE `src/routes/accessibility/+page.svelte` (it already exists as the 03-01 Wave-1 stub — replace its full
    contents). `import { site } from '$lib/content/site';`
    - `<h1>Accessibility</h1>` (single h1).
    - `<section aria-labelledby="conf-h"><h2 id="conf-h">Conformance target</h2><p>{site.a11yStatement.conformanceTarget}</p></section>`.
    - `<section aria-labelledby="issues-h"><h2 id="issues-h">Known issues</h2><ul>{#each site.a11yStatement.knownIssues as issue}<li>{issue}</li>{/each}</ul></section>`.
    - `<section aria-labelledby="feedback-h"><h2 id="feedback-h">Give feedback</h2><p>...<a href={`mailto:${site.a11yStatement.feedbackEmail}`}>Email us</a> ...</p></section>`.
    - `<section aria-labelledby="review-h"><h2 id="review-h">Review cadence</h2><p>{site.a11yStatement.reviewCadence} Last reviewed {site.a11yStatement.lastReviewed}.</p></section>`.
    Scoped `<style>` tokens-only. No hardcoded copy (all from a11yStatement).
  </action>
  <acceptance_criteria>
    - `grep -q 'a11yStatement.conformanceTarget' src/routes/accessibility/+page.svelte`
    - `grep -q 'a11yStatement.knownIssues' src/routes/accessibility/+page.svelte`
    - `grep -q 'mailto:' src/routes/accessibility/+page.svelte` and `grep -q 'reviewCadence' src/routes/accessibility/+page.svelte`
    - `grep -c '<h2' src/routes/accessibility/+page.svelte` returns 4
    - `node scripts/check-content-source.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm build && npx playwright test tests/content-routes.spec.ts --grep "accessibility" && npx playwright test tests/headings.spec.ts --grep "accessibility"</automated>
  </verify>
  <done>/accessibility documents conformance target, known issues, feedback mailto, and review cadence in four h2 sections from site.a11yStatement.</done>
</task>

</tasks>

<verification>
- `pnpm build` prerenders `/about/`, `/contact/`, `/accessibility/`.
- `npx playwright test tests/content-routes.spec.ts tests/headings.spec.ts tests/alt-text.spec.ts --grep "(about|contact|accessibility)"` green.
- `node scripts/check-content-source.mjs` exits 0; no `[REVIEW]` in any route.
</verification>

<success_criteria>
About, Contact, and the Accessibility Statement complete the five-route accessible DOM — single-h1, sourced from
`site.ts`, base-path-safe, with a working mailto CTA, named social links, and a scope.org.uk-shaped statement.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-06-SUMMARY.md`.
</output>
</output>
