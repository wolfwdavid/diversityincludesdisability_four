# Phase 3: Accessible Experience — Research

**Researched:** 2026-07-04
**Domain:** Multi-page static SvelteKit site (adapter-static / GitHub Pages base path) with a single gold-standard accessible semantic DOM; faithful DID content; static poster hero (zero WebGL)
**Confidence:** HIGH (all APIs verified against the *installed* `@sveltejs/kit@2.69.1` / `svelte@5.56.4` type defs and the existing repo code; a11y guidance is WCAG 2.2 / WAI-ARIA APG canonical; scope.org.uk statement pattern verified in Phase-0 FEATURES.md)

## Summary

Phase 2 already shipped the hard part: the no-flash mode engine (`app.html` inline script → `data-mode` on `<html>`), the WCAG-verified token set (`tokens.css` with AAA color pairs, `:focus-visible`, `prefers-reduced-motion`, `.visually-hidden`, a `.skip-link` stub), the rune-based `mode` store, and a working `ModeToggle`. Phase 3 is almost entirely **semantic HTML + content architecture + test coverage** — there is no new state machinery and no 3D. The single largest risk is *content/DOM discipline*: one DOM for both modes, one typed content source (`site.ts`), correct landmarks/heading order on five routes, and base-path-safe internal links.

The build is: (1) a typed content module `src/lib/content/site.ts` that every page imports (CONT-06 single source, with `[REVIEW: …]` markers living as **code comments**, never rendered); (2) shell components `SiteHeader` (nav + existing `ModeToggle`), `SiteFooter`, `SkipLinks`, `Hero` (token-driven CSS/SVG poster, PREM-03), `ServiceCard`, `SocialLinks`; (3) five `+page.svelte` routes (`/`, `/about`, `/services`, `/contact`, `/accessibility`) that compose those components; (4) an extended `+layout.svelte` that renders `SkipLinks` + `SiteHeader` + `<main id="main">` + `SiteFooter`; (5) a Playwright/axe suite that loops **all five routes × both modes** with zero violations (incl. `wcag2aaa`) plus targeted skip-link, heading-order, keyboard-nav, alt-text, and base-path-link assertions.

**Primary recommendation:** Build content-first from `site.ts`, compose semantic components, and treat every requirement as a named automated assertion (see Validation Architecture). Use `resolve()` from `$app/paths` for **every** internal link (the repo already uses it in `+layout.svelte`), and use the rune `page` from `$app/state` for `aria-current="page"`. Add exactly ONE `<h1>` per page inside `<main>`, and demote the brand/logo in the header to a non-heading link.

<user_constraints>
## User Constraints (from 03-CONTEXT.md)

### Locked Decisions
- **Content authenticity (LOCKED):** Real activist's site. Do NOT invent credentials, quotes, statistics, dates, client names, or biographical claims. Write professional draft copy in DID's voice from the verified public facts only. Anything needing Eman's real words carries a visible-in-source `[REVIEW: …]` marker **in a code comment in the content module, NOT rendered to users**.
- **Single content source (CONT-06):** all copy lives in `src/lib/content/site.ts` (typed), imported by every page. No copy hardcoded in page markup; no forked strings between modes.
- **Pages:** Home (`/`), About (`/about`), Services (`/services`), Contact (`/contact`), plus Accessibility Statement (`/accessibility`, A11Y-07).
- **Verified public facts** (authoritative — do not embellish): Org = Diversity Includes Disability (DID); Founder = Eman Rimawi (Eman Rimawi-Doster); Tagline "Diversity Includes Disability"; four services = Intersectional Disability Equity & Inclusion trainings/facilitation, Disability Consulting, Modeling for Representation, Speaker & Panelist; primary contact `emanrimawi@gmail.com`, CTA phrase "Let's Connect"; Social = Facebook, Twitter/X, LinkedIn, Instagram (`[REVIEW: confirm handles]`); Copyright © Diversity Includes Disability (current year).
- **Draft copy** for Home / About / Services / Contact is specified verbatim in 03-CONTEXT.md `<content>` — use it as the content source of truth for `site.ts`.
- **A11y contract (LOCKED):** A11Y-01 skip links (skip to main + skip to nav, first in DOM, visible on focus); A11Y-02 one `<header><nav><main><footer>` per page, single h1/page, correct heading order, accessible names, labeled repeated landmarks; A11Y-03 AAA (≥7:1 body, larger base type, axe zero-violations incl `wcag2aaa` both modes); A11Y-04 global `:focus-visible` ring + targets ≥24×24 (nav/buttons ≥44 comfortable); A11Y-05 keyboard-complete, no traps, mobile nav = real `button` with `aria-expanded`; A11Y-06 all images have alt (decorative → `alt=""`/`aria-hidden`), no color-only meaning; A11Y-07 Accessibility Statement page; A11Y-08 no motion under `prefers-reduced-motion`, Premium motion pausable; PREM-03 hero = static token-styled poster (`alt` set), permanent Accessible hero + Phase-4 fallback slot.
- **Navigation:** persistent header nav (Home/About/Services/Contact) + the Phase-2 mode toggle; `aria-current="page"` on active link; mobile disclosure button with `aria-expanded`, keyboard-operable, closes on Escape. Footer: contact email, social links, accessibility-statement link, copyright.
- **Reusable components (named):** `SiteHeader` (nav + toggle), `SiteFooter`, `Hero` (poster), `ServiceCard`, `SkipLinks`, `SocialLinks`, `PageShell`. All token-styled; one DOM for both modes.
- **Testing:** extend the Playwright/axe suite to scan all routes in both modes; add keyboard-nav + skip-link + heading-order assertions.

### Claude's Discretion
- Exact component file layout, poster art (a tasteful token-driven CSS/SVG motif is fine — **no raster dependency**), microcopy wording within the rules above.

### Deferred Ideas (OUT OF SCOPE)
- No Threlte/3D in this phase (Phase 4). Hero uses the static poster fallback only.
- No contact form backend (mailto only, no backend). No CAPTCHA.
- No in-page text-size/contrast widgets, no login/CMS/donation integrations, no search (would add a 3rd skip link).
- Rates/formats for services, real bio specifics, pull-quotes, and social URLs are all `[REVIEW: …]` — render nothing invented; omit optional blocks (e.g. pull-quote) when the real content isn't provided.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support (how this phase enables it) |
|----|-------------|----------------------------------------------|
| CONT-01 | Home: hero + mission + 4-service overview + founder credibility + "Let's Connect" CTA | `+page.svelte` composes `Hero`, mission `<section>`, `ServiceCard` grid (4, linking `/services`), founder strip (linking `/about`), CTA band (linking `/contact`) — all copy from `site.ts` |
| CONT-02 | About: Eman Rimawi's story + intersectional work | `about/+page.svelte` renders `site.about` scaffold; Para 2 + pull-quote are `[REVIEW]` placeholders (comment-gated), no invented biography |
| CONT-03 | Services: 4 services each with clear description | `services/+page.svelte` maps `site.services[]` → one `<h2>` section each |
| CONT-04 | Contact: labeled `mailto:emanrimawi@gmail.com` primary (no backend) | `contact/+page.svelte` renders a visible, accessibly-named `mailto:` link from `site.contact.email` |
| CONT-05 | Social links (FB/X/LinkedIn/IG) with accessible names, static (no widgets) | `SocialLinks.svelte` renders `site.social[]` as icon+visible-text links, `rel="me noopener"`, URLs `[REVIEW]` |
| CONT-06 | Single content source consumed by both modes | `src/lib/content/site.ts` typed export; grep-test asserts no hardcoded copy in pages |
| CONT-07 | Responsive, mobile-first across breakpoints | Token spacing + CSS grid/flex; mobile nav disclosure; reflow-to-320px test |
| A11Y-01 | Visible-on-focus skip links (main + nav) | `SkipLinks.svelte` first in `<body>`; targets `#main` and `#nav`; upgrade existing `.skip-link` stub |
| A11Y-02 | One semantic DOM, landmarks, heading hierarchy, accessible names, identical both modes | `+layout.svelte` provides `header/nav/main/footer`; one `<h1>` per page; labeled repeated `<nav>`s |
| A11Y-03 | AAA contrast + larger base type, axe zero incl `wcag2aaa` both modes | Tokens already AAA (Phase 2); multi-route axe loop re-verifies |
| A11Y-04 | Visible `:focus-visible` + targets ≥24×24 | Global `*:focus-visible` in tokens.css; nav/toggle/social sized ≥44; runtime bounding-box test |
| A11Y-05 | Keyboard-complete, no traps, mobile nav real `button aria-expanded` | APG disclosure pattern in `SiteHeader`; Escape-to-close; Playwright keyboard walk |
| A11Y-06 | Alt text / aria-hidden decorative; no color-only meaning | Hero SVG `aria-hidden` (decorative) or `role="img"`+alt; social icons have text labels; alt-scan test |
| A11Y-07 | Accessibility Statement page (conformance/known-issues/feedback/cadence) | `accessibility/+page.svelte`, content from `site.a11yStatement` |
| A11Y-08 | No motion under `prefers-reduced-motion`; Premium motion pausable | Already enforced globally in tokens.css `@media (prefers-reduced-motion)`; hero poster is static (no motion to pause this phase) |
| PREM-03 | Static poster hero in place of 3D, no content lost | `Hero.svelte` = token-driven CSS/SVG motif; content (headline/subhead/CTA) lives in DOM beside it, not inside the art |
</phase_requirements>

## Standard Stack

**No new dependencies.** Everything needed is already installed and pinned. Verified against the live `node_modules` on 2026-07-04.

### Core (already present — reuse)
| Library | Installed | Purpose | Notes |
|---------|-----------|---------|-------|
| `@sveltejs/kit` | 2.69.1 | Router, `$app/paths` (`resolve`), `$app/state` (`page`) | `resolve()` since 2.26; rune `page` since 2.12 — both confirmed in installed types |
| `svelte` | 5.56.4 | Runes (`$props`, `$state`, `$derived`) | Svelte 5 only — no `export let`/`$:` |
| `@sveltejs/adapter-static` | 3.0.10 | Prerender all routes + `404.html` fallback | Already configured in `svelte.config.js` |
| `vite` | 8.1.3 | Build/dev | — |
| `@fontsource/lexend`, `@fontsource/source-sans-3` | 5.2.11 / 5.2.9 | Self-hosted fonts | Imported in `+layout.svelte` |

### Testing (already present — extend)
| Library | Installed | Purpose |
|---------|-----------|---------|
| `@playwright/test` + `playwright` | 1.61.1 | E2E / keyboard / bounding-box assertions |
| `@axe-core/playwright` + `axe-core` | 4.12.1 | WCAG scan (`wcag2a/aa/aaa`, `wcag21aa`, `wcag22aa`) |
| `@lhci/cli` | 0.15.1 | Optional Lighthouse a11y=1.0 gate |
| `svelte-check` | 4.7.x | Type/a11y compiler warnings (`svelte/a11y-*`) — first static gate |

**Installation:** none. `pnpm install` already satisfied. Do NOT add icon libraries — draw the 4 social + hero glyphs as inline SVG (matches the ModeToggle precedent and the "emoji-as-icons is an anti-pattern" rule in 02-UI-SPEC).

**Version verification (already done):**
```
@sveltejs/kit 2.69.1 · svelte 5.56.4 · @sveltejs/adapter-static 3.0.10 · vite 8.1.3
```

## Architecture Patterns

### Recommended file layout
```
src/
├── lib/
│   ├── content/
│   │   └── site.ts                      # CONT-06 single typed content source
│   ├── components/
│   │   ├── shell/
│   │   │   ├── ModeToggle.svelte        # exists — reuse unchanged
│   │   │   ├── SiteHeader.svelte        # NEW: <header><nav> + ModeToggle + mobile disclosure
│   │   │   ├── SiteFooter.svelte        # NEW: contact email, SocialLinks, a11y-statement link, ©
│   │   │   └── SkipLinks.svelte         # NEW: skip-to-main + skip-to-nav (A11Y-01)
│   │   ├── Hero.svelte                  # NEW: static token/SVG poster (PREM-03)
│   │   ├── ServiceCard.svelte           # NEW: title + one-line + "Let's Connect"/detail link
│   │   └── SocialLinks.svelte           # NEW: icon+text links (CONT-05)
│   └── styles/tokens.css                # exists — may add small utility classes only
└── routes/
    ├── +layout.svelte                   # EXTEND: SkipLinks + SiteHeader + <main id="main"> + SiteFooter
    ├── +layout.ts                       # exists (prerender=true, trailingSlash='always') — unchanged
    ├── +page.svelte                     # REWRITE: Home (CONT-01)
    ├── about/+page.svelte               # NEW (CONT-02)
    ├── services/+page.svelte            # NEW (CONT-03)
    ├── contact/+page.svelte             # NEW (CONT-04, CONT-05)
    └── accessibility/+page.svelte       # NEW (A11Y-07)
```

> **On `PageShell`:** the CONTEXT lists a `PageShell` component. Because `+layout.svelte` already IS the shell (header/main/footer wrapper) and SvelteKit layouts wrap every route automatically, a separate `PageShell` is redundant — fold its role into `+layout.svelte`. If the planner wants a per-page title/lead wrapper, `PageShell` can be a thin `<section>` that renders an `<h1>` + optional lead from props; either is acceptable (Claude's discretion on file layout). Recommend: put the shell in the layout, skip a separate `PageShell` file.

### Pattern 1: Typed single content source (`site.ts`) — CONT-06
**What:** One typed module all pages import. `[REVIEW: …]` markers live as **TS comments** (compiler strips them from output; never rendered). Optional real content (pull-quote, real bio para) is `undefined` until provided, and pages conditionally render it.
**When:** Every string of user-visible copy.
```typescript
// src/lib/content/site.ts
// Single source of truth for ALL site copy (CONT-06). No copy in page markup.
// [REVIEW: …] markers are CODE COMMENTS ONLY — they must never reach the DOM.

export interface ServiceItem {
  slug: string;
  title: string;
  summary: string;   // one-liner for Home cards
  body: string;      // fuller paragraph for /services
}
export interface SocialItem {
  name: string;      // "Facebook"
  label: string;     // accessible name: "Diversity Includes Disability on Facebook"
  href: string;      // [REVIEW: confirm handles] — placeholder until confirmed
  icon: 'facebook' | 'x' | 'linkedin' | 'instagram';
}

export const site = {
  org: 'Diversity Includes Disability',
  tagline: 'Diversity Includes Disability',
  founder: 'Eman Rimawi',
  contact: {
    email: 'emanrimawi@gmail.com',
    ctaPhrase: "Let's Connect",
  },
  home: {
    heroHeadline: 'Diversity Includes Disability',
    heroSubhead:
      'Intersectional disability equity, inclusion, and representation — training, consulting, and speaking that move organizations from awareness to action.',
    mission:
      'Disability belongs in every conversation about diversity. Diversity Includes Disability partners with organizations, institutions, and audiences to build accessibility and belonging into the way they work — not as an afterthought, but as a foundation.',
    // founder strip — role is [REVIEW: confirm title]. Keep true-but-generic until confirmed.
    founderRole: 'Founder & Lead Consultant', // [REVIEW: confirm title]
  },
  about: {
    heading: 'About Eman Rimawi',
    para1: '…', // mission expanded (true, generic)
    // [REVIEW: Eman's personal story / lived experience / credentials — to be provided]
    para2Placeholder: '…', // generic-but-true intersectional-advocacy framing
    para3: '…', // approach: intersectional, lived-experience-informed, action-oriented
    pullQuote: undefined as string | undefined, // [REVIEW: real quote] — render ONLY if defined
  },
  services: [
    { slug: 'trainings', title: 'Trainings & Facilitation', summary: '…', body: '…' },
    { slug: 'consulting', title: 'Disability Consulting', summary: '…', body: '…' },
    { slug: 'modeling', title: 'Modeling for Representation', summary: '…', body: '…' },
    { slug: 'speaking', title: 'Speaking & Panels', summary: '…', body: '…' },
  ] satisfies ServiceItem[],
  social: [
    { name: 'Facebook',  label: 'Diversity Includes Disability on Facebook',  href: '#', icon: 'facebook'  }, // [REVIEW: URL]
    { name: 'X',         label: 'Diversity Includes Disability on X (Twitter)', href: '#', icon: 'x'        }, // [REVIEW: URL]
    { name: 'LinkedIn',  label: 'Diversity Includes Disability on LinkedIn',  href: '#', icon: 'linkedin'  }, // [REVIEW: URL]
    { name: 'Instagram', label: 'Diversity Includes Disability on Instagram', href: '#', icon: 'instagram' }, // [REVIEW: URL]
  ] satisfies SocialItem[],
  a11yStatement: {
    conformanceTarget: 'WCAG 2.2 Level AA as the floor, aiming for Level AAA where feasible in Accessible mode.',
    knownIssues: [ /* string[] — see A11Y-07 pattern */ ],
    feedbackEmail: 'emanrimawi@gmail.com',
    reviewCadence: 'Reviewed at least every 6 months.',
    lastReviewed: '2026-07', // [REVIEW: keep current]
  },
} as const;
```
> **Note the `href: '#'` placeholders for social:** the crawler/prerender treats `#` as safe (same-page). Do NOT leave them as empty string (some a11y rules flag empty href). When real URLs arrive they replace `#`.

### Pattern 2: Base-path-safe internal links — `resolve()` (repo-established)
**What:** Every internal link uses `resolve('/route')` from `$app/paths`, which prefixes the base path (`/diversityincludesdisability_four` in prod, `''` in dev). The repo already does this in `+layout.svelte` (`href={resolve('/')}`). NEVER hardcode `href="/about"`.
```svelte
<script lang="ts">
  import { resolve } from '$app/paths';
</script>
<a href={resolve('/about')}>About</a>
<a href={resolve('/services')}>Services</a>
```
- External links (`mailto:`, social URLs) are used as-is — do NOT pass them through `resolve()`.
- `static/` assets (favicon etc.) are already handled via Vite import (`import favicon from '$lib/assets/favicon.svg'`) — the base-correct path is produced automatically. Continue that pattern; do not write `src="/logo.svg"`.

### Pattern 3: `aria-current="page"` via the rune `page` — A11Y-02
**What:** Use `page` from `$app/state` (Svelte-5 rune, no store subscription needed) to compare against each nav route. `page.url.pathname` includes the base path in prod, so compare against `resolve()` output (also base-prefixed) or strip the base. Simplest robust comparison: build the nav from a route list and match `page.url.pathname === resolve(route)` OR use `page.route.id`.
```svelte
<script lang="ts">
  import { page } from '$app/state';   // rune-based; NOT $app/stores
  import { resolve } from '$app/paths';
  const nav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ] as const;
  // page.route.id is base-independent ('/', '/about', …) — the cleanest key.
  const currentId = $derived(page.route.id);
</script>
<nav id="nav" aria-label="Primary">
  <ul>
    {#each nav as item}
      <li>
        <a
          href={resolve(item.href)}
          aria-current={currentId === item.href ? 'page' : undefined}
        >{item.label}</a>
      </li>
    {/each}
  </ul>
</nav>
```
> `aria-current` must be **omitted** (not `"false"`) on inactive links — `undefined` in Svelte drops the attribute. Prefer `page.route.id` for matching because it is not base-path-polluted; `trailingSlash: 'always'` means `page.url.pathname` will be `/diversityincludesdisability_four/about/` in prod, which is annoying to compare — `route.id` sidesteps that entirely.

### Pattern 4: Accessible mobile nav disclosure (APG Disclosure) — A11Y-05
**What:** A single real `<button aria-expanded>` toggles the nav list on narrow viewports. Desktop shows the list via CSS (`@media (min-width)`), independent of JS. Escape closes and returns focus to the button. This is the WAI-ARIA APG "Disclosure (Show/Hide) Navigation" pattern — do NOT reimplement a menubar/roving-tabindex (over-engineered for a simple nav; APG explicitly says site nav links are just links, not `role="menuitem"`).
```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  let open = $state(false);
  const nav = [/* …as Pattern 3… */] as const;
  // Auto-close on route change (rune reacts to navigation).
  $effect(() => { page.url.pathname; open = false; });
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
      (document.getElementById('nav-toggle') as HTMLButtonElement | null)?.focus();
    }
  }
</script>

<button
  id="nav-toggle"
  type="button"
  class="nav-toggle"
  aria-expanded={open}
  aria-controls="primary-nav-list"
  onclick={() => (open = !open)}
>
  <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">…</svg>
  <span>Menu</span>
</button>

<nav id="nav" aria-label="Primary" onkeydown={onKeydown}>
  <ul id="primary-nav-list" class:open>
    {#each nav as item}
      <li><a href={resolve(item.href)}
             aria-current={page.route.id === item.href ? 'page' : undefined}>{item.label}</a></li>
    {/each}
  </ul>
</nav>

<style>
  /* Mobile-first: list hidden unless .open; desktop: always shown, button hidden. */
  #primary-nav-list { display: none; }
  #primary-nav-list.open { display: block; }
  .nav-toggle { min-height: 44px; min-width: 44px; /* A11Y-04 */ }
  @media (min-width: 48rem) {
    .nav-toggle { display: none; }
    #primary-nav-list { display: flex; gap: var(--space-5); }
  }
</style>
```
Key correctness points: (a) the toggle is a native `<button type="button">` → free Enter/Space/focus; (b) `aria-expanded` reflects state; (c) `aria-controls` points at the list `id`; (d) Escape closes and restores focus; (e) route change auto-closes; (f) target ≥44px; (g) NO focus trap — it is a disclosure, not a modal, so focus is free to leave (correct per APG). Do not add `aria-hidden` to the list when closed — `display:none` already removes it from the a11y tree.

### Pattern 5: Static poster Hero (PREM-03) — token-driven CSS/SVG, no raster
**What:** A decorative token-styled motif behind/beside the real hero text. Because the visual carries no information the text doesn't already convey, mark it **decorative** (`aria-hidden="true"` on the SVG, or `role="presentation"`). The headline/subhead/CTA are real DOM siblings — content is never inside the art (satisfies "no content lost" and the Phase-4 fallback slot). Use `currentColor` / token vars so it recolors correctly in both themes.
```svelte
<!-- Hero.svelte -->
<script lang="ts">
  import { site } from '$lib/content/site';
  import { resolve } from '$app/paths';
</script>
<section class="hero">
  <!-- Decorative poster: pure token-driven SVG, no raster asset, no motion (A11Y-08). -->
  <svg class="hero__poster" aria-hidden="true" focusable="false" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
    <!-- concentric arcs / intersecting rings motif in --primary/--accent, low-opacity gradient scrim -->
  </svg>
  <div class="hero__content">
    <h1>{site.home.heroHeadline}</h1>
    <p class="hero__subhead">{site.home.heroSubhead}</p>
    <a class="btn btn--primary" href={resolve('/contact')}>{site.contact.ctaPhrase}</a>
  </div>
</section>
```
> **Decorative vs meaningful decision (A11Y-06):** the motif is abstract/branding → decorative → `aria-hidden`. If the planner instead ships a *representational* illustration that conveys meaning, switch to `role="img"` + `aria-label="…"`. Either is compliant; abstract-motif + `aria-hidden` is the recommended default and the simplest. The CONTEXT phrase "`alt` set" is satisfied for an SVG by `role="img"`+`aria-label` OR, for a decorative one, an explicit `aria-hidden` (the "explicitly marked" equivalent of `alt=""`). Document the choice in a comment so the verifier isn't surprised.

### Pattern 6: Accessibility Statement content (scope.org.uk shape) — A11Y-07
**What:** A dedicated `/accessibility` route with the four canonical sections. Content from `site.a11yStatement`. Mirrors scope.org.uk's live statement structure (verified in FEATURES.md).
Required sections (each an `<h2>` under the page `<h1>`):
1. **Conformance target** — "WCAG 2.2 AA floor, AAA where feasible in Accessible mode."
2. **Known issues** — an honest, possibly-short `<ul>` (e.g. "Premium mode's 3D hero is not yet shipped; Accessible poster is the current hero." / "Social profile links pending confirmation."). Empty-but-honest beats fake-perfect.
3. **Feedback path** — labeled `mailto:` to report a barrier (reuse `site.contact.email`).
4. **Review cadence** — "Reviewed at least every 6 months; last reviewed {date}."
Link to `/accessibility` from `SiteFooter` on every page (consistent placement, WCAG 3.2.6 Consistent Help).

### Anti-Patterns to Avoid
- **Two `<h1>`s per page** — the header brand link must NOT be an `<h1>`; the sole `<h1>` is the page title inside `<main>`. (Common axe/heading-order failure.)
- **Copy hardcoded in markup** — violates CONT-06; the grep test will fail the build.
- **`[REVIEW]` markers rendered to users** — they are TS comments only; never put them in a template string that reaches the DOM.
- **Hardcoded `href="/about"`** — breaks under the base path (Pitfall 1). Always `resolve()`.
- **Icon-only social links** — need a visible or `.visually-hidden` accessible name (CONT-05, A11Y-06).
- **`role="menu"`/`menuitem` on site nav** — wrong ARIA; site nav is a list of links (APG).
- **`aria-current="false"`** on inactive links — omit the attribute instead.
- **Motion in the poster hero** — this phase ships zero motion; keep the SVG static (A11Y-08).
- **`display:none` for `.visually-hidden`** — removes it from a11y tree; the repo's clip-rect utility is correct, reuse it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Base-path link prefixing | String-concat `base + path` | `resolve()` from `$app/paths` | Handles base + route-id population; repo already standardized on it |
| Active-link detection | Manual `window.location` parsing | `page` rune from `$app/state` (`page.route.id`) | Reactive, SSR-safe, base-independent |
| Skip-link / visually-hidden CSS | New clip hacks | Existing `.skip-link` + `.visually-hidden` in `tokens.css` | Already token-correct; just extend `.skip-link` to two links |
| Focus ring | Per-component outlines | Global `*:focus-visible` in `tokens.css` | One rule, both modes, AAA-contrast ring |
| Reduced-motion kill-switch | Per-animation guards | Global `@media (prefers-reduced-motion)` in `tokens.css` | Already zeroes `--dur` + disables all transitions |
| Mobile menu behavior | Custom modal/focus-trap | APG Disclosure pattern (native `<button aria-expanded>`) | A disclosure isn't a modal — a trap would be a bug |
| Icons | Icon font / lib install | Inline SVG (like `ModeToggle`) | Zero deps, colorable via `currentColor`, `aria-hidden`-able |
| Contact form | Form + validation + backend | Labeled `mailto:` (locked decision) | No backend on Pages; form is out of scope |

**Key insight:** Phase 2 already solved every cross-cutting a11y primitive (tokens, focus, reduced-motion, no-flash, visually-hidden, skip-link stub, live region). Phase 3 should *consume* them, not rebuild them. The only genuinely new interactive behavior is the mobile nav disclosure — and that's a 20-line APG pattern.

## Common Pitfalls

### Pitfall 1: Base-path-broken internal links (release-blocking on Pages)
**What goes wrong:** Nav works on `localhost` but 404s on `…github.io/diversityincludesdisability_four/about`.
**Why:** Hardcoded `href="/about"` resolves to domain root in prod. (Full detail in `.planning/research/PITFALLS.md` Pitfall 1.)
**How to avoid:** `resolve()` for every internal link; grep the source (`.svelte`) for `href="/` and fail on matches (test below). The repo build sets `paths.relative:false` + `BASE_PATH`, so `resolve()` output is correct.
**Warning signs:** Links work in dev, 404 in prod; test loop can't reach `/about`.

### Pitfall 2: Two `<h1>`s or broken heading order (A11Y-02 / axe `heading-order`)
**What goes wrong:** Brand link styled as heading, or a `ServiceCard` uses `<h2>` on Home where the section is already `<h2>`, producing skipped/duplicated levels.
**Why:** Reusable cards don't know their context depth.
**How to avoid:** Exactly one `<h1>` per route, in `<main>`. `ServiceCard` renders its title as `<h3>` on Home (under the "Our Services" `<h2>`) but as `<h2>` on `/services` — make the heading level a **prop** (`level: 2 | 3`) so the card adapts. Test asserts single-h1 + monotonic order per route.
**Warning signs:** axe `page-has-heading-one` / `heading-order`; SR heading list has gaps.

### Pitfall 3: `trailingSlash:'always'` vs `page.url.pathname` mismatch
**What goes wrong:** `aria-current` never matches because prod pathname is `/base/about/` but you compared to `/about`.
**How to avoid:** Compare `page.route.id` (base- and slash-independent: `'/about'`), not `page.url.pathname`. (Pattern 3.)

### Pitfall 4: `[REVIEW]` text leaking into the DOM
**What goes wrong:** A placeholder marker renders on the live site of a real activist.
**How to avoid:** Markers are TS **comments** only; optional real content is `undefined` and conditionally rendered (`{#if site.about.pullQuote}`). Add a test that greps the built HTML (`build/**/*.html`) for `[REVIEW` and fails on any hit.
**Warning signs:** Any `[REVIEW` string in `build/` output.

### Pitfall 5: Prerender can't reach a route (adapter-static crawl)
**What goes wrong:** A route only reachable by JS nav isn't prerendered → build warning / missing page.
**How to avoid:** Every route is linked by a real `<a href={resolve(...)}>` in `SiteHeader`/`SiteFooter`, so the crawler finds all five. `svelte.config.js` already sets `entries:['*']` + `handleHttpError:'fail'` — a dangling internal link fails the build (good).

### Pitfall 6: Social/`mailto` links flagged (empty href / no discernible name)
**How to avoid:** Social placeholders use `href="#"` (not `""`); each social link has a visible label or `.visually-hidden` text so its accessible name isn't just an icon. `mailto:` link text is visible (the email or "Email Eman"), never a bare icon.

## Code Examples

### SkipLinks (A11Y-01) — two links, first in DOM, visible on focus
```svelte
<!-- SkipLinks.svelte — rendered as the FIRST children in +layout.svelte -->
<a class="skip-link" href="#main">Skip to main content</a>
<a class="skip-link" href="#nav">Skip to navigation</a>
```
`tokens.css` already styles `.skip-link` (off-screen `top:-100%` → `top:var(--space-3)` on `:focus`). Ensure `SiteHeader`'s `<nav id="nav">` and layout's `<main id="main">` exist as targets. Give `#main` a `tabindex="-1"`? Not required for anchor skip-links, but adding `tabindex="-1"` to the `<main>` makes focus land there reliably in all browsers — recommended.

### Extended `+layout.svelte` (shell composition)
```svelte
<script lang="ts">
  import '$lib/styles/tokens.css';
  /* …existing font imports + $effect for OS-change… (keep) */
  import SkipLinks from '$lib/components/shell/SkipLinks.svelte';
  import SiteHeader from '$lib/components/shell/SiteHeader.svelte';
  import SiteFooter from '$lib/components/shell/SiteFooter.svelte';
  import { mode } from '$lib/stores/mode.svelte';
  let { children } = $props();
</script>

<SkipLinks />
<SiteHeader />
<main id="main" tabindex="-1">{@render children()}</main>
<SiteFooter />
<p class="visually-hidden" role="status" aria-live="polite">{mode.announcement}</p>
```
> Move the brand link + `ModeToggle` out of the layout and INTO `SiteHeader` (the layout currently inlines them). Keep the mode-announcer live region in the layout (it must persist across route changes).

### ServiceCard with context-adaptive heading level
```svelte
<script lang="ts">
  import type { ServiceItem } from '$lib/content/site';
  import { resolve } from '$app/paths';
  let { service, level = 3, showBody = false }: { service: ServiceItem; level?: 2 | 3; showBody?: boolean } = $props();
</script>
<article class="service-card">
  <svelte:element this={`h${level}`}>{service.title}</svelte:element>
  <p>{showBody ? service.body : service.summary}</p>
  <a href={resolve('/contact')}>Let's Connect</a>
</article>
```
`<svelte:element this={`h${level}`}>` is the clean Svelte-5 way to vary heading depth by context (Pitfall 2).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$page` store from `$app/stores` | `page` rune from `$app/state` | SvelteKit 2.12 (2024) | Use `$app/state`; no `$`-subscription, works in runes mode. `$app/stores` still works but is legacy |
| `base + '/path'` string concat / `resolveRoute` | `resolve()` from `$app/paths` | SvelteKit 2.26 | Single helper for base-prefix + param population; repo already uses it |
| Svelte 4 `export let` / `$:` | Runes `$props`/`$state`/`$derived` | Svelte 5 | Mandatory here (svelte 5.56.4) |

**Deprecated/outdated for this repo:**
- `$app/stores` `page` store — prefer `$app/state` `page` (both installed; use the rune).
- Any icon-font/emoji approach — inline SVG only (02-UI-SPEC anti-pattern list).

## Open Questions

1. **Real social URLs, bio specifics, founder title, pull-quote** — all `[REVIEW]`. *Recommendation:* ship placeholders (`href="#"`, comment-gated optional blocks) and list "pending confirmation" items honestly in the Accessibility Statement's known-issues + as `[REVIEW]` comments. Do not block the phase.
2. **Poster hero: decorative vs meaningful** — *Recommendation:* abstract token-driven SVG marked `aria-hidden` (decorative). Revisit only if a representational illustration is chosen (then `role="img"`+`aria-label`).
3. **`PageShell` component** — *Recommendation:* fold into `+layout.svelte`; skip a standalone file unless the planner wants a per-page `<h1>`+lead wrapper. Not load-bearing either way.

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `@playwright/test` 1.61.1 + `@axe-core/playwright` 4.12.1 |
| Config file | `playwright.config.ts` (builds + previews the real static artifact on :4173) |
| Quick run command | `pnpm test:a11y` (axe suite only) |
| Full suite command | `pnpm test` (`svelte-check` + `eslint`/`prettier` + `test:tokens` grep + `test:e2e`) |

> **Base-path note for tests:** the Playwright webServer runs `pnpm build && pnpm preview` with `BASE_PATH` **unset**, so test URLs are plain `/`, `/about/`, etc. Base-path *correctness* is therefore validated by a **source-grep test** (no hardcoded `href="/"`) rather than a live prod-base crawl — this is the reliable, CI-friendly approach. Optionally add one job that builds with `BASE_PATH=/diversityincludesdisability_four` and greps `build/**/*.html` for `href="/_` regressions.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command / Assertion | Exists? |
|--------|----------|-----------|-------------------------------|---------|
| A11Y-03 / A11Y-02 | Zero axe violations (incl `wcag2aaa`) on ALL 5 routes × BOTH modes | axe loop | `tests/a11y.spec.ts` — nest `for (route of ROUTES) for (m of MODES)` | ⚠️ extend (single-route now) |
| A11Y-01 | Skip links present, first in DOM, visible on focus, target resolves | e2e | `tests/skip-links.spec.ts` | ❌ Wave 0 |
| A11Y-02 | Exactly one `<h1>`/route + monotonic heading order | e2e/axe | `tests/headings.spec.ts` (+ axe `heading-order`, `page-has-heading-one`) | ❌ Wave 0 |
| A11Y-04 | Nav/toggle/social targets ≥44px; `:focus-visible` present | e2e | `tests/targets.spec.ts` boundingBox ≥44 (extends mode-toggle precedent) | ❌ Wave 0 |
| A11Y-05 | Keyboard reaches nav, operates mobile disclosure (`aria-expanded`), Escape closes, `aria-current` correct | e2e | `tests/keyboard-nav.spec.ts` | ❌ Wave 0 |
| A11Y-06 | Every `<img>` has `alt`; decorative SVG `aria-hidden`/`role=img`; social links have accessible names | e2e/axe | `tests/alt-text.spec.ts` (+ axe `image-alt`, `link-name`) | ❌ Wave 0 |
| A11Y-07 | `/accessibility` route exists with 4 sections + feedback mailto | e2e | assertion in `tests/content-routes.spec.ts` | ❌ Wave 0 |
| A11Y-08 | No animation under `prefers-reduced-motion` | e2e | Playwright `colorScheme`/`reducedMotion:'reduce'` context → assert no running animations | ❌ Wave 0 (light) |
| CONT-01..05 | Each page renders its required content blocks | e2e | `tests/content-routes.spec.ts` (headline, mission, 4 cards, mailto, 4 social) | ❌ Wave 0 |
| CONT-06 | Pages import from `site.ts`; no hardcoded copy | grep | `scripts/check-content-source.mjs` (+ `[REVIEW` not in built HTML) | ❌ Wave 0 |
| CONT-07 | Reflow to 320px, no horizontal scroll; mobile nav shows disclosure | e2e | `tests/responsive.spec.ts` viewport 320 → `scrollWidth<=clientWidth` | ❌ Wave 0 |
| PREM-03 | Hero renders static poster + real headline/subhead/CTA in DOM (Accessible mode, zero WebGL) | e2e | assertion in `tests/content-routes.spec.ts` (`.hero h1`, no `<canvas>`) | ❌ Wave 0 |

### Concrete spec skeletons

**Multi-route × multi-mode axe loop** (replace current single-route `a11y.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/']; // trailingSlash:'always'
const MODES = ['accessible', 'premium'] as const;

for (const route of ROUTES)
  for (const m of MODES)
    test(`axe: ${route} in ${m} mode`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-mode', m);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations).toEqual([]);
    });
```

**Skip-link operation:**
```typescript
test('skip link is first focusable and targets #main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');                     // first Tab
  const first = page.locator(':focus');
  await expect(first).toHaveText(/skip to main content/i);
  await expect(first).toHaveAttribute('href', '#main');
  await first.click();
  await expect(page.locator('#main')).toBeFocused();    // requires tabindex="-1" on <main>
});
```

**Single-h1 + heading order (per route):**
```typescript
for (const route of ROUTES)
  test(`headings: single h1 + no skipped levels on ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    const levels = await page.locator('h1,h2,h3,h4,h5,h6')
      .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    for (let i = 1; i < levels.length; i++)
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1); // never jump >1 deeper
  });
```

**Keyboard nav + mobile disclosure:**
```typescript
test('mobile nav: button toggles aria-expanded, Escape closes, aria-current correct', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const toggle = page.getByRole('button', { name: /menu/i });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const about = page.getByRole('link', { name: 'About' });
  await about.click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
  // Escape closes when reopened
  await page.getByRole('button', { name: /menu/i }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /menu/i })).toHaveAttribute('aria-expanded', 'false');
});
```

**Alt-text / accessible-name scan:**
```typescript
for (const route of ROUTES)
  test(`alt: all images have alt on ${route}`, async ({ page }) => {
    await page.goto(route);
    const imgsMissingAlt = await page.locator('img:not([alt])').count();
    expect(imgsMissingAlt).toBe(0);
    // decorative SVGs must be aria-hidden or role=img; assert no bare focusable svg
    const socialLinks = page.locator('a[rel~="me"]');
    for (const l of await socialLinks.all())
      expect((await l.getAttribute('aria-label')) || (await l.innerText())).toBeTruthy();
  });
```

**Base-path link + content-source greps** (Node scripts, no browser):
```javascript
// scripts/check-content-source.mjs — CONT-06
// 1) No hardcoded absolute internal links in components/routes.
//    Fail on href="/... that is NOT resolve(...) — i.e. literal leading-slash string hrefs.
// 2) Pages under src/routes import from '$lib/content/site'.
// 3) No user-visible '[REVIEW' — allowed ONLY in site.ts comments, never in build/**/*.html.
// Model on the existing scripts/check-no-raw-hex.mjs walker.
```
Wire as `pnpm test:content` and add to the `test` script chain (mirrors `test:tokens`).

### Sampling Rate
- **Per task commit:** `pnpm test:a11y` (fast axe loop) + `pnpm check` (svelte-check a11y warnings).
- **Per wave merge:** `pnpm test` (full: check + lint + content grep + all e2e).
- **Phase gate:** `pnpm test` fully green + a manual keyboard-only + screen-reader pass on all 5 routes before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Extend `tests/a11y.spec.ts` → multi-route × multi-mode loop (currently single `/`).
- [ ] `tests/skip-links.spec.ts` — A11Y-01.
- [ ] `tests/headings.spec.ts` — A11Y-02 single-h1 + order.
- [ ] `tests/keyboard-nav.spec.ts` — A11Y-05 disclosure + aria-current.
- [ ] `tests/targets.spec.ts` — A11Y-04 ≥44px (extends mode-toggle boundingBox precedent).
- [ ] `tests/alt-text.spec.ts` — A11Y-06.
- [ ] `tests/content-routes.spec.ts` — CONT-01..05, A11Y-07, PREM-03 content presence + no `<canvas>` in Accessible.
- [ ] `tests/responsive.spec.ts` — CONT-07 reflow-to-320.
- [ ] `scripts/check-content-source.mjs` + `test:content` npm script — CONT-06 + `[REVIEW]` leak guard.
- [ ] Framework install: none — infra already present.

## Sources

### Primary (HIGH confidence)
- Installed type defs `node_modules/@sveltejs/kit/types/index.d.ts` — `resolve()` (since 2.26), `resolveRoute`, `match`; `$app/state` runtime present — verified 2026-07-04.
- Installed `node_modules` versions — kit 2.69.1, svelte 5.56.4, adapter-static 3.0.10, vite 8.1.3.
- Existing repo code — `+layout.svelte` (`resolve` usage, live region, `data-hydrated`), `tokens.css` (`.skip-link`/`.visually-hidden`/`:focus-visible`/reduced-motion), `mode.svelte.ts`, `ModeToggle.svelte`, `a11y.spec.ts`, `mode-toggle.spec.ts`, `playwright.config.ts`, `svelte.config.js`, `scripts/check-no-raw-hex.mjs`.
- `.planning/REQUIREMENTS.md` — exact CONT-01..07 / A11Y-01..08 / PREM-03 text.
- `.planning/phases/03-accessible-experience/03-CONTEXT.md` — locked content + a11y contract.
- `.planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md` — token contract, type scale.
- WAI-ARIA APG — Disclosure (Show/Hide) Navigation pattern; site nav = list of links (not menu). HIGH (canonical).
- WCAG 2.2 SCs referenced (2.4.1, 2.4.7, 2.5.8, 3.2.6, 1.1.1, 1.3.1, 1.4.10). HIGH (canonical).

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` — scope.org.uk statement structure (verified against live statement Nov 2025), skip-link pattern, mailto/social guidance.
- `.planning/research/PITFALLS.md` — base-path, prerender, heading/label, no-flash pitfalls.

### Tertiary (LOW confidence)
- None — no unverified WebSearch-only claims were needed; all APIs confirmed against installed code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; all versions read from `node_modules`.
- Architecture / SvelteKit patterns: HIGH — `resolve()`/`page`-rune confirmed in installed types and already used in-repo.
- A11y patterns: HIGH — WCAG 2.2 + APG canonical; Phase-2 primitives already in place.
- Content shape: HIGH — driven by locked CONTEXT copy.
- Poster hero decorative choice: MEDIUM — design discretion; both `aria-hidden` and `role=img` paths documented.

**Research date:** 2026-07-04
**Valid until:** 2026-08-04 (stable stack; re-verify only if SvelteKit/Svelte majors bump).
