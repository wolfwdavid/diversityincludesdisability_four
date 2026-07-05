---
phase: 03-accessible-experience
plan: 03
type: execute
wave: 2
depends_on: ["03-01"]
files_modified:
  - src/lib/components/shell/SkipLinks.svelte
  - src/lib/components/shell/SiteHeader.svelte
  - src/lib/components/SocialLinks.svelte
  - src/lib/components/shell/SiteFooter.svelte
  - src/routes/+layout.svelte
autonomous: true
requirements: [A11Y-01, A11Y-02, A11Y-04, A11Y-05, CONT-05, CONT-07]
must_haves:
  truths:
    - "Every page has skip-to-main + skip-to-nav links, first in DOM, visible on focus"
    - "One header/nav/main/footer landmark set wraps every route"
    - "Keyboard users operate the mobile nav via a real button (aria-expanded, Escape closes)"
    - "The active nav link carries aria-current=page (via page.route.id)"
    - "Social links have accessible names (icon + text), not icon-only"
  artifacts:
    - path: "src/lib/components/shell/SiteHeader.svelte"
      provides: "Nav + ModeToggle + APG mobile disclosure, aria-current"
      contains: "aria-expanded"
      min_lines: 40
    - path: "src/lib/components/shell/SkipLinks.svelte"
      provides: "A11Y-01 two skip links"
    - path: "src/lib/components/SocialLinks.svelte"
      provides: "CONT-05 named social links"
    - path: "src/routes/+layout.svelte"
      provides: "A11Y-02 shell: SkipLinks + SiteHeader + main#main + SiteFooter"
      contains: "id=\"main\""
  key_links:
    - from: "src/routes/+layout.svelte"
      to: "SiteHeader / SiteFooter / SkipLinks"
      via: "import + render"
      pattern: "SiteHeader"
    - from: "src/lib/components/shell/SiteHeader.svelte"
      to: "$app/state page.route.id"
      via: "aria-current computation"
      pattern: "aria-current"
---

<objective>
Build the shared accessible shell all five routes rely on: `SkipLinks` (A11Y-01), `SiteHeader`
(persistent nav + Phase-2 `ModeToggle` + APG mobile disclosure with `aria-expanded`/Escape + `aria-current`),
`SocialLinks` (CONT-05, consumed by the footer and later the contact page), and `SiteFooter`
(contact email, social links, accessibility-statement link, copyright). Then extend `+layout.svelte`
to compose them into one `header/nav/main/footer` landmark set (A11Y-02) with focus-safe skip targets.

Purpose: One gold-standard semantic DOM, base-path-safe links, keyboard-complete nav — the foundation
every route composes.
Output: 4 new components + extended layout.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/03-accessible-experience/03-CONTEXT.md
@.planning/phases/03-accessible-experience/03-RESEARCH.md
@src/routes/+layout.svelte
@src/lib/components/shell/ModeToggle.svelte
@src/lib/styles/tokens.css

<interfaces>
From src/lib/content/site.ts (created in 03-01):
```typescript
export const site: {
  org: string; founder: string;
  contact: { email: string; ctaPhrase: string };
  social: { name: string; label: string; href: string; icon: 'facebook'|'x'|'linkedin'|'instagram' }[];
  // …plus home/about/services/a11yStatement
};
```
Existing (unchanged): `resolve` from `$app/paths`; `page` rune from `$app/state`;
`mode` store from `$lib/stores/mode.svelte`; `ModeToggle.svelte`. Global CSS already provides
`.skip-link` (off-screen → visible on `:focus`), `.visually-hidden`, and `*:focus-visible`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: SkipLinks + SiteHeader (nav, aria-current, APG mobile disclosure)</name>
  <files>src/lib/components/shell/SkipLinks.svelte, src/lib/components/shell/SiteHeader.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (Pattern 3 aria-current via page.route.id; Pattern 4 disclosure; §Code Examples SkipLinks)
    - src/routes/+layout.svelte (current brand link + ModeToggle to migrate INTO SiteHeader)
    - src/lib/components/shell/ModeToggle.svelte (reuse unchanged)
  </read_first>
  <action>
    `SkipLinks.svelte` — two anchors, nothing else, styled by the existing global `.skip-link`:
    ```svelte
    <a class="skip-link" href="#main">Skip to main content</a>
    <a class="skip-link" href="#nav">Skip to navigation</a>
    ```

    `SiteHeader.svelte` — a real `<header>` containing a brand link (NOT a heading — the sole `<h1>` lives
    in each page's `<main>`), a `<nav id="nav" aria-label="Primary">`, the mobile disclosure button, and `<ModeToggle />`.
    Implement the APG Disclosure pattern from RESEARCH Pattern 4:
    - `import { page } from '$app/state'; import { resolve } from '$app/paths'; import ModeToggle from '$lib/components/shell/ModeToggle.svelte'; import { site } from '$lib/content/site';`
    - `const nav = [{href:'/',label:'Home'},{href:'/about',label:'About'},{href:'/services',label:'Services'},{href:'/contact',label:'Contact'}] as const;`
    - `let open = $state(false);` and `$effect(() => { page.url.pathname; open = false; });` (auto-close on route change).
    - Brand: `<a class="brand" href={resolve('/')}>{site.org}</a>`.
    - Button: `<button id="nav-toggle" type="button" class="nav-toggle" aria-expanded={open} aria-controls="primary-nav-list" onclick={() => (open = !open)}>` with an inline `aria-hidden="true"` SVG + `<span>Menu</span>`.
    - Nav list: `<ul id="primary-nav-list" class:open>`; each item `<a href={resolve(item.href)} aria-current={page.route.id === item.href ? 'page' : undefined}>{item.label}</a>` — `aria-current` OMITTED (undefined), never `"false"`.
    - `onkeydown` on the nav: Escape when open → `open = false` and refocus `#nav-toggle`.
    - Scoped `<style>` using tokens ONLY (no raw hex): mobile-first `#primary-nav-list{display:none}` / `.open{display:block}`;
      `.nav-toggle{min-height:44px;min-width:44px}` (A11Y-04); `@media (min-width:48rem){ .nav-toggle{display:none} #primary-nav-list{display:flex;gap:var(--space-5)} }`.
      Nav links padded so their target box is ≥44px tall. Do NOT use `role="menu"`/`menuitem`.
  </action>
  <acceptance_criteria>
    - `grep -q 'href="#main"' src/lib/components/shell/SkipLinks.svelte` and `grep -q 'href="#nav"' src/lib/components/shell/SkipLinks.svelte`
    - `grep -q 'aria-expanded' src/lib/components/shell/SiteHeader.svelte`
    - `grep -q 'aria-controls="primary-nav-list"' src/lib/components/shell/SiteHeader.svelte`
    - `grep -q 'aria-current' src/lib/components/shell/SiteHeader.svelte` and `grep -q 'page.route.id' src/lib/components/shell/SiteHeader.svelte`
    - `grep -q 'resolve(' src/lib/components/shell/SiteHeader.svelte` and NOT `grep -q 'href="/' src/lib/components/shell/SiteHeader.svelte`
    - `grep -q 'aria-label="Primary"' src/lib/components/shell/SiteHeader.svelte`
    - `node scripts/check-no-raw-hex.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check && node scripts/check-no-raw-hex.mjs</automated>
  </verify>
  <done>SkipLinks renders both links; SiteHeader is a semantic `<header><nav>` with keyboard disclosure, aria-current via route.id, resolve()'d links, ModeToggle, ≥44px targets.</done>
</task>

<task type="auto">
  <name>Task 2: SocialLinks (CONT-05) + SiteFooter</name>
  <files>src/lib/components/SocialLinks.svelte, src/lib/components/shell/SiteFooter.svelte</files>
  <read_first>
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (CONT-05 SocialLinks — icon+visible text, rel="me noopener", href="#"; Pattern 6 footer a11y link)
    - src/lib/components/shell/ModeToggle.svelte (inline-SVG icon precedent — no icon library)
  </read_first>
  <action>
    `SocialLinks.svelte` — `import { site } from '$lib/content/site';` and render `{#each site.social as s}` a link:
    `<a href={s.href} rel="me noopener" aria-label={s.label}>` containing an inline `aria-hidden="true"` SVG glyph
    per `s.icon` (draw facebook / x / linkedin / instagram as simple inline `<svg>` paths — NO icon lib, matching
    ModeToggle) PLUS a visible `<span>{s.name}</span>` text label (never icon-only — CONT-05/A11Y-06). Each link
    box ≥44px (scoped style, tokens only). Wrap in `<ul>`/`<li>`.

    `SiteFooter.svelte` — a real `<footer>` (landmark; if repeated content warrants it add `aria-label="Site"`).
    Contents from `site`:
    - Contact: a visible labeled `<a href={`mailto:${site.contact.email}`}>` (e.g. text "Email {site.founder}" or the address).
    - `<SocialLinks />`.
    - Accessibility statement link: `<a href={resolve('/accessibility')}>Accessibility statement</a>` (consistent placement, WCAG 3.2.6).
    - Copyright: `© {new Date().getFullYear()} {site.org}` (render year at build/runtime, no hardcoded year).
    Scoped styles use tokens only.
  </action>
  <acceptance_criteria>
    - `grep -q 'rel="me noopener"' src/lib/components/SocialLinks.svelte`
    - `grep -q 'aria-label={s.label}' src/lib/components/SocialLinks.svelte` and `grep -q '{s.name}' src/lib/components/SocialLinks.svelte`
    - `grep -q 'mailto:' src/lib/components/shell/SiteFooter.svelte`
    - `grep -q "resolve('/accessibility')" src/lib/components/shell/SiteFooter.svelte`
    - `grep -q 'getFullYear' src/lib/components/shell/SiteFooter.svelte`
    - `node scripts/check-no-raw-hex.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check && node scripts/check-no-raw-hex.mjs</automated>
  </verify>
  <done>SocialLinks renders four named icon+text links; footer exposes mailto, social, accessibility link, and dynamic copyright.</done>
</task>

<task type="auto">
  <name>Task 3: Extend +layout.svelte into the shell composition (A11Y-02)</name>
  <files>src/routes/+layout.svelte</files>
  <read_first>
    - src/routes/+layout.svelte (keep the font imports, favicon head, and the MODE-04 OS-change $effect + data-hydrated setter + live-region announcer)
    - .planning/phases/03-accessible-experience/03-RESEARCH.md (§Extended +layout.svelte)
  </read_first>
  <action>
    Modify `+layout.svelte`: KEEP all existing font/token imports, `<svelte:head>` (title/favicon/preloads), the
    `$effect` that sets `data-hydrated` + handles live OS changes, and the persistent mode announcer live region.
    REMOVE the inline brand link + `<header>` + `<ModeToggle />` currently in the markup (they move into `SiteHeader`),
    and remove the single old `.skip-link`. Import and compose:
    ```svelte
    import SkipLinks from '$lib/components/shell/SkipLinks.svelte';
    import SiteHeader from '$lib/components/shell/SiteHeader.svelte';
    import SiteFooter from '$lib/components/shell/SiteFooter.svelte';
    ```
    Body markup order:
    ```svelte
    <SkipLinks />
    <SiteHeader />
    <main id="main" tabindex="-1">{@render children()}</main>
    <SiteFooter />
    <p class="visually-hidden" role="status" aria-live="polite">{mode.announcement}</p>
    ```
    `<main>` gets `id="main" tabindex="-1"` so the skip link reliably lands focus there. Keep the layout `<style>`
    minimal (the `#main` padding/max-width may stay); header/nav/footer styling now lives in their components.
  </action>
  <acceptance_criteria>
    - `grep -q 'id="main" tabindex="-1"' src/routes/+layout.svelte`
    - `grep -q '<SkipLinks' src/routes/+layout.svelte` and `grep -q '<SiteHeader' src/routes/+layout.svelte` and `grep -q '<SiteFooter' src/routes/+layout.svelte`
    - `grep -q 'aria-live="polite"' src/routes/+layout.svelte`
    - NOT `grep -q '<header' src/routes/+layout.svelte` (header now lives in SiteHeader)
    - `node scripts/check-no-raw-hex.mjs` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check && pnpm build && npx playwright test tests/skip-links.spec.ts tests/targets.spec.ts</automated>
  </verify>
  <done>Layout renders SkipLinks → SiteHeader → main#main(tabindex=-1) → SiteFooter → announcer; skip-link and target-size specs pass.</done>
</task>

</tasks>

<verification>
- `pnpm check` + `node scripts/check-no-raw-hex.mjs` clean.
- `pnpm build` succeeds (all crawlable links resolve).
- `npx playwright test tests/skip-links.spec.ts tests/targets.spec.ts tests/keyboard-nav.spec.ts` green (keyboard-nav needs at least Home + About routes — if About not yet built it may partially fail; skip-links + targets must pass).
</verification>

<success_criteria>
One semantic shell wraps every route: two skip links, labeled primary nav with aria-current + keyboard disclosure,
named social links, footer with mailto + accessibility link + dynamic copyright, main focus target — all token-styled, base-path-safe.
</success_criteria>

<output>
After completion, create `.planning/phases/03-accessible-experience/03-03-SUMMARY.md`.
</output>
