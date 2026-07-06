# Phase 6: Engagement Surfaces - Research

**Researched:** 2026-07-06
**Domain:** Static-site contact form (progressive enhancement) + data-driven media section on SvelteKit `adapter-static` / GitHub Pages / Svelte 5 runes
**Confidence:** HIGH (backend limits + SvelteKit env behavior verified against official docs and live vendor docs 2026-07-06; a11y form patterns verified against WCAG 2.2 + existing repo conventions)

## Summary

Phase 6 adds two data-driven, ship-inert surfaces to the already-shipped v1.0 site: (1) an accessible, progressively-enhanced contact form layered over the existing `mailto:` on `/contact`, and (2) a podcast/media section fed by a typed `site.ts` list. Both must render *nothing* until configured/populated, and none of the v1.0 gates (axe zero-violations both modes incl. `wcag2aaa`, the 3D bundle boundary, the SEO 5-route meta gate, the raw-hex token gate, the content-source gate, the review-marker gate, the fail-closed CI pipeline) may regress.

The form-backend decision resolves cleanly to **Web3Forms**: 250 free submissions/month (5× Formspree's 50), **no account required** (an access key is issued to an email address with no signup — critical, because it removes an Eman-gated dependency), a built-in `botcheck` honeypot (no CAPTCHA, satisfying the cognitive-barrier ban), and first-class support for both plain-HTML no-JS `POST`+redirect *and* JSON `fetch` — exactly the progressive-enhancement shape ENGAGE-01 needs. The access key is public in a static bundle regardless of vendor; Web3Forms keys are forward-only (a leaked key can only send mail to the pre-registered address), so exposure is a non-issue.

The single most important technical finding: **`$env/dynamic/public` cannot be read during prerendering** in SvelteKit 2 + `adapter-static` (it throws), and **`$env/static/public` throws a build error if the variable is undefined**. The inert-until-configured pattern must therefore use `$env/static/public` **with a committed empty default** (`PUBLIC_WEB3FORMS_KEY=""` in a committed `.env`), which is prerender-safe, keeps every build (local, CI, contributor) green with the form hidden, and is override-able via `process.env` for the with-key test build and for the eventual live enablement. This one mechanism satisfies ENGAGE-02's "no key → form hidden, mailto primary, never broken" *and* makes the enabled state testable in a real browser.

**Primary recommendation:** Web3Forms + `$env/static/public` (`PUBLIC_WEB3FORMS_KEY`, committed empty default) for the form; a typed `site.ts` `podcasts: PodcastItem[]` (empty default) rendered as a section on the **About page** (not a new route — avoids touching the 5-route SEO/axe gate arrays and dangling-nav/empty-route problems); Playwright covers hidden/omitted + enabled-form states (enabled via a second build config), and a small **vitest + @testing-library/svelte** layer covers the MediaSection empty-vs-populated data branch.

<user_constraints>
## User Constraints

> No `06-CONTEXT.md` exists for this phase (verified — the phase dir contained no CONTEXT file). The constraints below are carried verbatim from the task brief and the v1.0 milestone gates, which the ROADMAP explicitly requires every v1.1 phase to keep green. Treat these as locked.

### Locked Decisions (carried from v1.0 gates — all still enforced)
- **Single content source**: all copy from `src/lib/content/site.ts` (`check-content-source.mjs` gate — every `+page.svelte` must import `content/site`).
- **Token-only styling**: no raw hex outside `src/lib/styles/tokens.css` (`check-no-raw-hex.mjs`; `src/lib/components/premium/` is the *only* exempt dir — new form/media components are NOT exempt).
- **One accessible DOM**: identical structure both modes; modes differ through tokens, not markup.
- **axe zero-violations** on every route in **both** modes, including `wcag2aaa` (color-contrast-enhanced ≥7:1) — `tests/a11y.spec.ts`.
- **Zero WebGL in the Accessible bundle** — `check-3d-boundary.mjs`; new components must never statically import `three`/`@threlte`/`motion`.
- **Review-marker gate**: no `[REVIEW` string may reach built HTML — `check-review-markers.mjs`.
- **SEO gate**: 5-route absolute base-path canonical/OG/Twitter meta — `check-seo-meta.mjs` + `tests/seo.spec.ts`.
- **CI fail-closed pipeline**: verify(axe+lhci) → build → deploy(retry) → smoke — `check-ci-gate.mjs`.
- **No backend / no database / no server runtime** (GitHub Pages is static).
- **No CAPTCHA** (cognitive barrier; brushes WCAG 3.3.8 intent).
- **pnpm** (never npm); **Svelte 5 runes** (never Svelte 4 syntax); base-path-safe links via `resolve()`/`$app/paths` (never `href="/..."`).

### Claude's Discretion (recommendations made in this doc)
- Backend vendor choice (→ **Web3Forms**, §Standard Stack).
- Where the endpoint key lives (→ **`$env/static/public` + committed empty default**, Pattern 1).
- Where the media section renders (→ **section on About page**, Pattern 4).
- Test mechanisms for the enabled-form and populated-media branches (→ §Validation Architecture).

### Deferred Ideas (OUT OF SCOPE for Phase 6)
- Donation mechanism (CONT2-02 — gated on 501(c)(3)/fiscal-sponsor status).
- Real social/podcast URLs and Eman's bio/quote (Phase 7, GATED on Eman).
- Domain cutover (Phase 8).
- A dedicated `/media` route, in-page text-size/contrast controls, live social embeds (v2+).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENGAGE-01 | Accessible on-page contact form (visible labels, on-blur inline validation, error+recovery, focus-to-first-error, no CAPTCHA) as progressive enhancement over the mailto | §Architecture Pattern 2 (Svelte 5 runes form), §Architecture Pattern 3 (progressive enhancement: no-JS POST + JSON fetch upgrade), §Code Examples, §Common Pitfalls 1–5 |
| ENGAGE-02 | Config-driven endpoint; no key → form hidden, mailto primary, site never shows a broken form | §Architecture Pattern 1 (`$env/static/public` + committed empty default), §Standard Stack (Web3Forms), §Validation Architecture (no-key-hidden test) |
| ENGAGE-03 | Typed podcast/media list in `site.ts`; section omitted entirely while list empty | §Architecture Pattern 4 (MediaSection on About, `{#if items.length}`), §Code Examples, §Validation Architecture (empty-omitted + populated tests) |
</phase_requirements>

## Standard Stack

### Backend — recommendation: **Web3Forms** (decisive)

The access key is **public in a static bundle no matter which vendor you pick** (it ships in the HTML/JS). So the decision hinges on: free-tier headroom, spam handling *without CAPTCHA*, no-JS `POST`+redirect support, and — decisively for this project — whether provisioning needs a vendor **account** (an Eman-gated dependency) or just an **email**.

| Vendor | Free tier (verified 2026-07-06) | Account needed? | Honeypot (no-CAPTCHA) | No-JS POST + redirect | Verdict |
|--------|--------------------------------|-----------------|-----------------------|-----------------------|---------|
| **Web3Forms** ✅ | **250 submissions/mo**; 30-day retention | **No** — key issued to an email, no signup | **Yes** — built-in `botcheck` checkbox + optional hCaptcha (opt-in, we leave CAPTCHA off) | **Yes** — documented plain-HTML pattern with `redirect` hidden field (same-domain redirect free) | **RECOMMENDED** |
| Formspree | 50 submissions/mo; Formspree branding on emails; 30-day history | **Yes** — account tied to submission handling | Honeypot via `_gotcha`; reCAPTCHA optional | Yes (`action` swap) | 5× less headroom + account gate |
| Static Forms | Free, email-key, no account | No | Honeypot supported | Yes | Fewer features, less actively maintained than Web3Forms; Web3Forms is the stronger no-account pick |

**Why Web3Forms wins for THIS project:**
1. **No account = no Eman dependency for provisioning.** The key can be generated against `emanrimawi@gmail.com` from a single form on web3forms.com; the key only ever forwards mail to that address. This is the "getting the actual key is a Phase-7-adjacent human task" the brief anticipates — but it's a *2-minute email task*, not an account signup.
2. **250/mo** dwarfs a low-traffic advocacy site's needs and Formspree's 50.
3. **Honeypot without CAPTCHA** is native (`botcheck`), directly satisfying the no-CAPTCHA constraint.
4. **True progressive enhancement**: the exact same `<form action>` works as a no-JS navigation POST *and* as a JSON `fetch`.
5. **One-line migration**: if spam ever forces a change, only the `action` URL + hidden key change — zero component rewrite.

**Endpoint / POST contract (both paths):**
- **Endpoint:** `https://api.web3forms.com/submit` · **Method:** `POST`
- **Required field:** hidden `access_key` (the public key)
- **Honeypot:** checkbox named `botcheck` (bot-checked → submission silently rejected)
- **No-JS path:** native form navigation. Set `enctype="multipart/form-data"` (do **NOT** use `application/x-www-form-urlencoded` — Web3Forms docs warn it causes a 301→CORS issue). Add hidden `redirect` = full `https://…` URL on **our own domain** (same-domain redirect is free-tier) → lands on a prerendered success page.
- **JS path:** `preventDefault`, validate, then `fetch(endpoint, { method:'POST', headers:{ 'Content-Type':'application/json', Accept:'application/json' }, body: JSON.stringify({ access_key, name, email, message, botcheck:false }) })` → response JSON `{ success: boolean, message: string }` → drive the aria-live region. JSON avoids the urlencoded 301/CORS trap entirely.

**Key-provisioning steps to hand off (later, non-blocking):**
1. Go to https://web3forms.com, enter `emanrimawi@gmail.com`, submit. (No signup.)
2. Web3Forms emails an access key (UUID) to that address.
3. Set it in production: add repo **Variable** (not Secret — it's public) `PUBLIC_WEB3FORMS_KEY` in GitHub → Settings → Secrets and variables → Actions → Variables, and reference it in the build job env; **or** edit the committed `.env` default. Either override wins over the empty default → form goes live on next deploy. No code change required.

### Test tooling to ADD (Wave 0)

| Package | Version (verified 2026-07-06 via `npm view`) | Purpose |
|---------|----------------------------------------------|---------|
| `vitest` | `4.1.10` | Component-level test runner for the MediaSection empty-vs-populated data branch (can't be flipped via env/prod build) |
| `@testing-library/svelte` | `5.4.2` | Svelte-5-compatible component rendering + queries for the branch test |
| `jsdom` | `29.1.1` | DOM env for vitest (fast, no browser) |

> **Version verification:** run `npm view <pkg> version` before pinning; the four above were confirmed on 2026-07-06. `vitest-browser-svelte@2.2.0` is the real-browser alternative if jsdom proves insufficient for a runes component (unlikely for this simple list).

### Already in the repo (reuse, do not re-add)

`@playwright/test@1.61.1`, `@axe-core/playwright@4.12.1`, `svelte@^5.56`, `@sveltejs/kit@^2.63`, `@sveltejs/adapter-static@3.0.10`. Form/media components use **only** these + `$app/paths` + `$env/static/public` + `site.ts` — never `three`/`@threlte`/`motion`.

**Installation:**
```bash
pnpm add -D vitest@4.1.10 @testing-library/svelte@5.4.2 jsdom@29.1.1
```

## Architecture Patterns

### Recommended file layout
```
src/lib/content/site.ts            # + contactForm config note + podcasts: PodcastItem[] + PodcastItem interface
src/lib/components/
├── ContactForm.svelte             # NEW — the accessible progressive-enhancement form (accepts accessKey prop)
└── MediaSection.svelte            # NEW — data-driven podcast/media list (accepts items prop, default site.podcasts)
src/routes/contact/+page.svelte    # MODIFY — gate <ContactForm> on PUBLIC_WEB3FORMS_KEY; mailto stays primary/first
src/routes/contact/success/+page.svelte  # NEW — prerendered no-JS success landing (imports site, mailto present)
src/routes/about/+page.svelte      # MODIFY — render <MediaSection /> below the bio (omits itself when empty)
src/lib/styles/tokens.css          # MODIFY — add --danger/--success/--field tokens (both modes, AAA-safe)
.env                               # NEW — committed empty default: PUBLIC_WEB3FORMS_KEY=""
.env.example                       # NEW — documents the variable for humans
vitest.config.ts                   # NEW — component test config
playwright.enabled.config.ts       # NEW — second Playwright config: builds WITH a dummy key, own port
tests/contact-form.spec.ts         # NEW (default suite) — form HIDDEN with no key; mailto primary
tests/contact-form.enabled.spec.ts # NEW (enabled config) — visible form: labels/blur/focus/aria-live/honeypot/axe
tests/media-section.spec.ts        # NEW (default suite) — section OMITTED when site.podcasts is empty
src/lib/components/MediaSection.test.ts  # NEW (vitest) — empty→nothing, fixture→list
```

### Pattern 1: Inert-until-configured (the key location) — `$env/static/public` + committed empty default
**What:** Gate the form on a build-time public env var that defaults to empty.
**Why this and not the alternatives (VERIFIED):**
- ❌ `$env/dynamic/public` — **throws during prerendering** in SvelteKit 2 + `adapter-static` ("Cannot read values from `$env/dynamic/public` while prerendering"). Every route here is prerendered → hard build failure. Do not use.
- ❌ bare `$env/static/public` with the var unset — build error: *"does not provide an export named 'PUBLIC_WEB3FORMS_KEY'"* (static/public only exports vars that exist at build time; there is no default-value mechanism). Breaks CI/local when the key isn't set — the opposite of "ship inert."
- ✅ `$env/static/public` **with a committed empty `.env` default** — the export always exists (empty string → falsy → form hidden). Prerender-safe. `process.env` overrides the file value, so the enabled test build and production enablement just set the variable. The key is public anyway, so committing an *empty* default leaks nothing.

```svelte
<!-- src/routes/contact/+page.svelte (MODIFY) -->
<script lang="ts">
  import { PUBLIC_WEB3FORMS_KEY } from '$env/static/public';
  import { site } from '$lib/content/site';
  import ContactForm from '$lib/components/ContactForm.svelte';
  import SocialLinks from '$lib/components/SocialLinks.svelte';
  import Seo from '$lib/components/Seo.svelte';
  const formEnabled = PUBLIC_WEB3FORMS_KEY.length > 0; // '' → false → inert
</script>

<!-- mailto stays the PRIMARY, always-present contact method (ENGAGE-02) -->
<a class="contact__mailto" href={`mailto:${site.contact.email}`}>Email {site.founder}</a>
<span class="contact__address">{site.contact.email}</span>

{#if formEnabled}
  <ContactForm accessKey={PUBLIC_WEB3FORMS_KEY} />
{/if}
<SocialLinks />
```
```dotenv
# .env  (committed — value is PUBLIC and empty by default; form ships hidden)
PUBLIC_WEB3FORMS_KEY=""
```
**Build behavior:** local `pnpm build`, CI, and contributor clones all read the empty default → `formEnabled=false` → no form → mailto primary, zero broken UI. Setting `PUBLIC_WEB3FORMS_KEY` in `process.env` (test webServer, or the GH Actions build job) overrides → form renders. **Alternative accepted only if the team dislikes committing `.env`:** keep the key as a `site.ts` field `contactForm.accessKey: string` (empty now) — also prerender-safe and single-source-friendly, but then the enabled state can't be flipped by env for e2e (would require prop injection in a component test build), so `$env/static/public` is preferred for testability.

### Pattern 2: Accessible form (Svelte 5 runes)
**What:** Fields name/email/message + honeypot; visible labels; `autocomplete`; validation **on blur**; errors linked via `aria-describedby`; focus-to-first-error on submit; `role="status"` progress/success + `role="alert"` failure; disabled-while-submitting; ≥44px targets; token-only styling.
**State model (runes):**
```svelte
<script lang="ts">
  let { accessKey }: { accessKey: string } = $props();
  const ENDPOINT = 'https://api.web3forms.com/submit';
  let name = $state(''); let email = $state(''); let message = $state('');
  let touched = $state({ name: false, email: false, message: false });
  let status = $state<'idle'|'sending'|'ok'|'error'>('idle');
  const errors = $derived({
    name: touched.name && !name.trim() ? 'Enter your name.' : '',
    email: touched.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Enter a valid email address.' : '',
    message: touched.message && message.trim().length < 10 ? 'Enter a message of at least 10 characters.' : ''
  });
</script>
```
**Rules baked into the plan:**
- Validation fires **on `onblur`** (sets `touched[field]=true`) — never on keystroke (WCAG-friendly; no error-flicker while typing).
- Each field: `<label for>` (visible) + `aria-invalid={!!errors.x}` + `aria-describedby="x-error"`; the error `<p id="x-error" role="alert">` renders only when non-empty. Error text is prefixed "Error:" / carries an icon so it never relies on color alone (A11Y-06).
- `autocomplete="name"` / `autocomplete="email"` + `inputmode="email"`.
- On submit with errors: mark all touched, then `document.getElementById(firstErrorId)?.focus()` (focus-to-first-error).
- A single `<p role="status" aria-live="polite">` announces "Sending…" / "Message sent — thank you." On failure use `role="alert"` (assertive) with recovery: a **Retry** button + the always-present mailto fallback ("Or email {founder} directly").
- Submit button: text swaps to "Sending…" while `status==='sending'`; use `aria-disabled` (not bare `disabled`) so the button keeps its name/announcement, and guard the handler. Button + inputs ≥44px tall.

### Pattern 3: Progressive enhancement (no-JS POST + JSON fetch upgrade)
**What:** The form works as a native navigation POST with JS off, and upgrades to a no-navigation JSON `fetch` with JS on.
```svelte
<form action={ENDPOINT} method="POST" enctype="multipart/form-data" onsubmit={enhance}>
  <input type="hidden" name="access_key" value={accessKey} />
  <input type="hidden" name="redirect" value={`${site.url}${base}/contact/success/`} />
  <!-- a11y-safe honeypot: off-screen (NOT display:none-only), out of tab order, hidden from AT -->
  <div aria-hidden="true" class="hp"><input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" /></div>
  <!-- name/email/message fields … -->
  <button type="submit" aria-disabled={status==='sending'}>Send message</button>
</form>
```
- **No JS:** browser POSTs multipart form → Web3Forms emails Eman → 302-redirects to our prerendered `/contact/success/` page (same-domain, free tier). `multipart/form-data` avoids the urlencoded 301/CORS warning.
- **JS (`enhance`):** `e.preventDefault()`, validate, `status='sending'`, `fetch` JSON (Pattern 1 body), set `status` from `res.success`. No page navigation; aria-live carries the result.
- **Honeypot a11y:** the `.hp` container is `aria-hidden`, off-screen positioned (reuse `.visually-hidden`-style clip, NOT `display:none` alone — some bots skip `display:none`), input `tabindex="-1"` + `autocomplete="off"`. Never harms AT because the whole wrapper is `aria-hidden`.

### Pattern 4: Media section on the About page (ENGAGE-03) — NOT a new route
**What:** `PodcastItem` typed list in `site.ts`; `MediaSection.svelte` renders `<section>` only when non-empty; placed on `/about`.
**Why a section on About, not a `/media` route (justified):**
- A new prerendered route would force edits to **three hardcoded 5-route arrays** (`check-seo-meta.mjs`, `tests/seo.spec.ts`, `tests/a11y.spec.ts`) + a `site.seo.media` entry + a nav item + `prerender.entries` — large blast radius on green v1.0 gates.
- An empty `/media` route would still prerender (empty shell) or need nav-gating — exactly the "no empty shell" problem ENGAGE-03 forbids.
- A **section** simply doesn't render when the list is empty (`{#if items.length}`) — clean omission, no dangling nav item, no empty route.
- `/about` is the credibility page (founder media appearances belong there thematically), and `tests/a11y.spec.ts` **already scans `/about/` in both modes**, so the new section gets axe coverage in both modes with **zero test-array edits**. (Home is an acceptable alternative; About is preferred.)
```ts
// site.ts additions
export interface PodcastItem { title: string; description: string; url: string; platform?: string; }
// …
podcasts: [] satisfies PodcastItem[] as PodcastItem[],  // empty now → section omitted
```
```svelte
<!-- MediaSection.svelte — accepts items prop (default = site.podcasts) so vitest can inject a fixture -->
<script lang="ts">
  import { site } from '$lib/content/site';
  import type { PodcastItem } from '$lib/content/site';
  let { items = site.podcasts }: { items?: PodcastItem[] } = $props();
</script>
{#if items.length}
  <section class="media" aria-labelledby="media-h">
    <h2 id="media-h">Media &amp; Podcasts</h2>
    <ul>{#each items as item (item.url)}
      <li><a href={item.url} rel="noopener">{item.title}{#if item.platform} · {item.platform}{/if}</a>
      <p>{item.description}</p></li>
    {/each}</ul>
  </section>
{/if}
```
> Note: external podcast URLs use a literal `href={item.url}` expression (not base-resolved) — allowed by the content-source gate (it only forbids `href="/`). Add an eslint-disable for `svelte/no-navigation-without-resolve` like `SocialLinks.svelte` does.

### Anti-Patterns to Avoid
- **`$env/dynamic/public` anywhere** — prerender crash (verified). Static only.
- **`display:none`-only honeypot** — some bots skip it; also don't let it reach the a11y tree. Off-screen + `aria-hidden` wrapper + `tabindex="-1"`.
- **`x-www-form-urlencoded` to Web3Forms** — 301→CORS on the fetch path. Use JSON (fetch) / `multipart/form-data` (no-JS).
- **Validation on keystroke** — error-flicker; validate on blur.
- **Adding a `/media` route** — needless churn on 5-route gates + empty-shell risk.
- **Color-only error signaling** — fails A11Y-06; prefix "Error:"/icon + `role="alert"`.
- **Raw hex in the new components** — they are NOT in the `premium/` exemption; add tokens to `tokens.css`.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Receiving form submissions on a static host | A serverless function / SMTP relay | **Web3Forms** endpoint | GitHub Pages has no runtime; Web3Forms is free, no-account, honeypot-native |
| Spam mitigation without CAPTCHA | Custom bot heuristics | Web3Forms `botcheck` honeypot | Native, zero-a11y-cost; CAPTCHA is banned |
| Email validation | A strict RFC-5322 regex | A pragmatic `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` + rely on Web3Forms delivery | Over-strict regexes reject valid addresses; the server is the real validator |
| Env-based feature flag on a prerendered site | Runtime config fetch | `$env/static/public` + committed empty default | Only prerender-safe mechanism that's also override-able |
| Component data-branch testing | A throwaway prod test route | **vitest + @testing-library/svelte** | Prop-injected fixture tests the branch without polluting the shipped bundle or the 5-route gates |

**Key insight:** every "hard" part of this phase is a solved, off-the-shelf concern — the engineering value is in the *accessibility* of the form and the *inert-by-default* wiring, not in reinventing a form backend or a feature-flag system.

## Runtime State Inventory

> Not a rename/refactor/migration phase — this is additive feature work. Included for completeness; the only "state outside the repo" is the endpoint key.

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | None — no DB/datastore; submissions are emailed by Web3Forms, not stored by us | None |
| Live service config | The Web3Forms **access key** (issued to `emanrimawi@gmail.com`) lives at web3forms.com, not in git. It is public-by-design and forward-only. | Human task (2 min, non-blocking): provision key, set `PUBLIC_WEB3FORMS_KEY` repo Variable. Ships inert until then. |
| OS-registered state | None | None |
| Secrets/env vars | `PUBLIC_WEB3FORMS_KEY` — **public**, not a secret. Committed empty default in `.env`; real value via repo **Variable** (not Secret). | Add repo Variable at enablement |
| Build artifacts | None stale — new components/routes only | `pnpm build` regenerates all |

## Common Pitfalls

### Pitfall 1: `$env/dynamic/public` prerender crash
**What goes wrong:** Build fails "Cannot read values from `$env/dynamic/public` while prerendering." **Avoid:** use `$env/static/public` + committed empty default. **Warning sign:** any `import { env } from '$env/dynamic/public'`.

### Pitfall 2: `$env/static/public` missing-export build error
**What goes wrong:** With the var unset, build errors "does not provide an export named 'PUBLIC_WEB3FORMS_KEY'." **Avoid:** commit `.env` with `PUBLIC_WEB3FORMS_KEY=""`. **Warning sign:** green locally (you have a `.env`) but red in CI/fresh clone.

### Pitfall 3: urlencoded fetch → CORS
**What goes wrong:** JSON-less `fetch` with default enctype 301-redirects and throws CORS (mail still sent, but the UI thinks it failed). **Avoid:** JSON body for fetch; `multipart/form-data` for the no-JS form. **Warning sign:** submissions arrive but the aria-live says "error."

### Pitfall 4: honeypot in the a11y tree / trapping real AT users
**What goes wrong:** A `display:none`/`required` honeypot either gets skipped by bots or blocks screen-reader users. **Avoid:** off-screen + `aria-hidden` wrapper + `tabindex="-1"` + `autocomplete="off"`; never `required`. **Warning sign:** axe flags a hidden control, or real users report "can't submit."

### Pitfall 5: axe `wcag2aaa` fails on new error/field colors
**What goes wrong:** Error text or field borders introduce a <7:1 pair → the AAA gate goes red in Accessible mode. **Avoid:** add `--danger`/`--success`/`--field-border` tokens to `tokens.css` for BOTH modes, contrast-checked ≥7:1 in accessible mode (the existing `--accent:#9a3412` on `--bg:#fff` ≈ 7.5:1 is a safe danger base). **Warning sign:** `tests/a11y.spec.ts` on `/contact` (enabled build) reports `color-contrast-enhanced`.

### Pitfall 6: forgetting to wire the new tests/config into the aggregate
**What goes wrong:** New specs exist but `pnpm test` and CI don't run them → false green. **Avoid:** add `test:form` (enabled config), `test:unit` (vitest) to `package.json` and into the `test` + `test:launch` aggregates and the CI `verify` job. **Warning sign:** CI passes but the enabled form was never exercised.

## Code Examples

### Web3Forms JSON fetch (JS path) — from official docs
```ts
// Source: https://docs.web3forms.com  (verified 2026-07-06)
async function enhance(e: SubmitEvent) {
  e.preventDefault();
  touched = { name: true, email: true, message: true };
  if (errors.name || errors.email || errors.message) {
    document.getElementById(firstErrorId())?.focus();   // focus-to-first-error
    return;
  }
  status = 'sending';
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: accessKey, name, email, message, botcheck: false })
    });
    const data = await res.json();
    status = data.success ? 'ok' : 'error';
  } catch { status = 'error'; }  // network → offer Retry + mailto fallback
}
```

### Honeypot markup (a11y-safe)
```svelte
<!-- Source: Web3Forms spam-protection docs, adapted to be aria-safe -->
<div aria-hidden="true" style="position:absolute;left:-9999px" >
  <label>Do not fill this <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" /></label>
</div>
```

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| `$env/dynamic/public` for build flags on static sites | `$env/static/public` (dynamic throws under prerender) | SvelteKit 2.0 | Must use static + committed default |
| reCAPTCHA on contact forms | Honeypot / privacy challenges | ongoing | CAPTCHA banned here anyway |
| Formspree as default static form backend | Web3Forms (no-account, 250/mo) now the popular no-friction pick | 2024→2026 | Removes account gate |

**Deprecated/outdated:** none in the current repo toolchain; all v1.0 versions remain current.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright `1.61.1` (e2e/a11y, real build) + **vitest `4.1.10` + @testing-library/svelte `5.4.2` (NEW, component branch tests)** |
| Config file | `playwright.config.ts` (default, no key) · **`playwright.enabled.config.ts` (NEW — builds WITH dummy key, own `PREVIEW_PORT`)** · **`vitest.config.ts` (NEW)** |
| Quick run command | `pnpm exec playwright test tests/contact-form.spec.ts tests/media-section.spec.ts` |
| Full suite command | `pnpm test && pnpm test:form && pnpm test:unit` |

### Phase Requirements → Test Map
| Req | Behavior | Test type | Automated command | File |
|-----|----------|-----------|-------------------|------|
| ENGAGE-02 | No key → form **hidden**, mailto still present | e2e (default build) | `pnpm exec playwright test tests/contact-form.spec.ts` | ❌ Wave 0 `tests/contact-form.spec.ts` |
| ENGAGE-01 | With key → form **visible & accessible** (labels, autocomplete, ≥44px, axe zero incl. wcag2aaa both modes) | e2e (enabled build) | `pnpm test:form` | ❌ Wave 0 `tests/contact-form.enabled.spec.ts` |
| ENGAGE-01 | On-blur validation, focus-to-first-error, `aria-describedby` links, `role=status`/`role=alert` announcements | e2e (enabled build) | `pnpm test:form` | ❌ Wave 0 (same file) |
| ENGAGE-01 | Honeypot present but `aria-hidden` + out of tab order (invisible to AT) | e2e (enabled) + axe | `pnpm test:form` | ❌ Wave 0 (same file) |
| ENGAGE-01 | JS fetch success/failure drives aria-live; failure offers Retry + mailto (network **stubbed** via `page.route('**/api.web3forms.com/**')`) | e2e (enabled) | `pnpm test:form` | ❌ Wave 0 (same file) |
| ENGAGE-03 | Empty list → section **omitted** (no `#media-h`, no section) on `/about` | e2e (default build) | `pnpm exec playwright test tests/media-section.spec.ts` | ❌ Wave 0 `tests/media-section.spec.ts` |
| ENGAGE-03 | Populated list → renders items with accessible names/links | component (vitest, fixture prop) | `pnpm test:unit` | ❌ Wave 0 `src/lib/components/MediaSection.test.ts` |
| v1.0 regression | axe zero-violations **both modes all routes**, 3D boundary, SEO 5-route, hex/content/review/CI gates | full aggregate | `pnpm test:launch` | ✅ exists (re-run) |

### Sampling Rate
- **Per task commit:** the quick run above (fast, no full build churn where possible).
- **Per wave merge:** `pnpm test` (existing full suite: check, lint, tokens, content, build, split, review, e2e) **+** `pnpm test:form` **+** `pnpm test:unit`.
- **Phase gate:** `pnpm test:launch` (adds ci-gate, lhci, base-build SEO) green + the two new commands, before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `pnpm add -D vitest@4.1.10 @testing-library/svelte@5.4.2 jsdom@29.1.1` + `vitest.config.ts`
- [ ] `playwright.enabled.config.ts` — webServer builds with `env:{ PUBLIC_WEB3FORMS_KEY:'test-key', PREVIEW_PORT:'<free port>' }`, `testMatch:'**/*.enabled.spec.ts'`
- [ ] `.env` (committed `PUBLIC_WEB3FORMS_KEY=""`) + `.env.example`
- [ ] `tests/contact-form.spec.ts` (hidden state), `tests/contact-form.enabled.spec.ts` (visible/accessible/validation/honeypot/aria-live, network stubbed), `tests/media-section.spec.ts` (omitted), `src/lib/components/MediaSection.test.ts` (populated)
- [ ] `package.json` scripts `test:form` + `test:unit`, wired into `test`/`test:launch` aggregates
- [ ] `--danger`/`--success`/`--field-border` tokens in `tokens.css` (both modes, AAA-safe)
- [ ] Add `/contact/success/` to `tests/a11y.spec.ts` ROUTES so the no-JS landing gets axe coverage (does NOT go into the 5-route SEO gate — utility page)
- [ ] CI `verify` job: add `pnpm test:form` + `pnpm test:unit` steps

## Open Questions
1. **Dummy-key build actually renders the form under prerender?** — Known: `$env/static/public` bakes `process.env` overrides at build; the enabled config sets it, so yes. Recommendation: the enabled Playwright config's `webServer.command` = `pnpm build && pnpm preview …` with `env` set; verify the form appears in the built HTML in the first enabled spec.
2. **`/contact/success/` vs Web3Forms default thank-you page for the no-JS path** — Recommendation: create the on-brand prerendered success page (keeps no-JS submitters on-domain, accessible, mailto present). Cheap and higher-quality than dumping users on api.web3forms.com. If the planner wants zero new routes, drop the `redirect` field and accept the vendor page (documented fallback).
3. **Home vs About for the media section** — Recommendation: About (credibility fit + already axe-scanned). Trivially movable if design prefers Home.

## Sources

### Primary (HIGH)
- SvelteKit docs — `$env/static/public` / `$env/dynamic/public`, adapter-static prerendering: https://svelte.dev/docs/kit/adapter-static , https://svelte.dev/docs/kit/$env-static-public — dynamic-public-throws-under-prerender + static-requires-build-time-value.
- SvelteKit issue #11371 / #10008 — "Cannot read values from `$env/dynamic/*` while prerendering"; dynamic-public becomes static for prerendered pages: https://github.com/sveltejs/kit/issues/11371 , https://github.com/sveltejs/kit/issues/10008
- SvelteKit issue #10000 — no default-value mechanism for `$env/static/public` (must supply empty value): https://github.com/sveltejs/kit/issues/10000
- Web3Forms docs — endpoint, `access_key`, honeypot (`botcheck`), custom redirection (same-domain free, avoid urlencoded 301/CORS): https://docs.web3forms.com/ , https://docs.web3forms.com/getting-started/customizations/redirection , https://docs.web3forms.com/getting-started/customizations/spam-protection/spam-protection
- Web3Forms pricing — 250 free submissions/mo, no account: https://web3forms.com/pricing
- Repo files read: `tokens.css`, `site.ts`, `contact/+page.svelte`, `SiteHeader.svelte`, `SocialLinks.svelte`, `Seo.svelte`, `a11y.spec.ts`, `seo.spec.ts`, `content-routes.spec.ts`, `targets.spec.ts`, `playwright.config.ts`, `svelte.config.js`, all `scripts/check-*.mjs`, `package.json` — HIGH (direct read).
- `npm view` — vitest 4.1.10, @testing-library/svelte 5.4.2, jsdom 29.1.1 (verified 2026-07-06).

### Secondary (MEDIUM)
- Formspree free-plan limits (50/mo, account, branding): https://help.formspree.io/hc/en-us/articles/47605896654227-Account-limits , https://formspree.io/plans/
- Formspree vs Web3Forms free-tier comparisons (2026): https://splitforms.com/blog/formspree-vs-web3forms
- v1 FEATURES.md contact/CTA decision (mailto primary, no-CAPTCHA rationale, form as progressive enhancement).

## Metadata

**Confidence breakdown:**
- Backend choice + endpoint/format: HIGH — official vendor docs + verified free-tier numbers.
- Inert-config pattern (`$env/static/public` + committed default): HIGH — verified against SvelteKit docs + multiple issues confirming both failure modes.
- Form a11y patterns: HIGH — WCAG 2.2 + existing repo conventions (44px, tokens, visually-hidden, aria-live already established).
- Test mechanisms (enabled Playwright config + vitest branch test): MEDIUM-HIGH — standard, but the enabled-build-renders-form assumption is verified-once-in-first-spec (Open Q1).

**Research date:** 2026-07-06
**Valid until:** ~2026-08-05 (30 days; vendor free tiers and SvelteKit env behavior are stable but re-check limits before enabling live).
