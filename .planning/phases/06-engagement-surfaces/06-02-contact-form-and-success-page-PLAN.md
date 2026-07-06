---
phase: 06-engagement-surfaces
plan: 02
type: execute
wave: 2
depends_on: ["06-01"]
files_modified:
  - src/lib/components/ContactForm.svelte
  - src/routes/contact/+page.svelte
  - src/routes/contact/success/+page.svelte
  - tests/contact-form.spec.ts
  - tests/contact-form.enabled.spec.ts
  - tests/a11y.spec.ts
autonomous: true
requirements: [ENGAGE-01, ENGAGE-02]
user_setup:
  - service: web3forms
    why: "Receives contact-form submissions on a static host (no backend). Ships INERT until the key is set — non-blocking for this phase."
    env_vars:
      - name: PUBLIC_WEB3FORMS_KEY
        source: "Submit emanrimawi@gmail.com at https://web3forms.com (no account); the key is emailed to that address. Set as a repo Actions VARIABLE (not Secret) — it is public and forward-only."

must_haves:
  truths:
    - "With no key (default build), /contact renders NO <form>; the labeled mailto to emanrimawi@gmail.com remains present and primary (ENGAGE-02)."
    - "With a key (enabled build), /contact renders an accessible form: visible labels, autocomplete attrs, on-blur validation with aria-describedby-linked errors, submit focuses the first invalid field, aria-live announces sending/success/failure, honeypot present but invisible to AT, ≥44px targets, axe zero-violations incl wcag2aaa in BOTH modes (ENGAGE-01)."
    - "A no-JS submission lands on a prerendered, accessible, noindex /contact/success/ page that keeps the mailto present."
  artifacts:
    - path: "src/lib/components/ContactForm.svelte"
      provides: "Svelte 5 runes progressive-enhancement form (no-JS multipart POST + JSON fetch upgrade)"
      min_lines: 90
      contains: "$env/static/public"
    - path: "src/routes/contact/success/+page.svelte"
      provides: "Prerendered branded no-JS success landing, noindex, mailto present"
      contains: 'name="robots"'
    - path: "tests/contact-form.enabled.spec.ts"
      provides: "Enabled-build e2e: visible/accessible/validation/honeypot/aria-live + axe both modes"
      contains: "api.web3forms.com"
    - path: "tests/contact-form.spec.ts"
      provides: "Default-build e2e: form hidden, mailto primary"
      contains: "form"
  key_links:
    - from: "src/routes/contact/+page.svelte"
      to: "src/lib/components/ContactForm.svelte"
      via: "gated render on PUBLIC_WEB3FORMS_KEY.length"
      pattern: "formEnabled"
    - from: "src/lib/components/ContactForm.svelte"
      to: "https://api.web3forms.com/submit"
      via: "native multipart POST (no-JS) + JSON fetch (JS)"
      pattern: "api.web3forms.com/submit"
    - from: "tests/a11y.spec.ts"
      to: "/contact/success/"
      via: "added to ROUTES for axe coverage (excluded from SEO 5-route gate)"
      pattern: "/contact/success/"
---

<objective>
Build the accessible, progressively-enhanced contact form (ENGAGE-01), gate it on the inert key so it ships hidden with the mailto primary (ENGAGE-02), and add a branded prerendered success landing for no-JS submitters. Author both the default-build "hidden" spec and the enabled-build "visible & accessible" spec (RED-first: write the specs, then implement to green).

Purpose: Give visitors a real on-page way to reach Eman as an enhancement over the existing mailto, without ever showing a broken form and without regressing any v1.0 gate.
Output: `ContactForm.svelte`, a gated `/contact` page, `/contact/success/`, two e2e specs, and a one-line ROUTES addition to the axe suite.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/06-engagement-surfaces/06-RESEARCH.md
@.planning/phases/06-engagement-surfaces/06-VALIDATION.md
@src/routes/contact/+page.svelte
@src/lib/components/SocialLinks.svelte

<interfaces>
<!-- Contracts the executor uses directly. Provided by 06-01 (Wave 1) and the existing repo. -->

From 06-01: `.env` exports `PUBLIC_WEB3FORMS_KEY` (empty by default → form hidden). Tokens `--danger`, `--success`, `--field-border` exist in both modes. `playwright.enabled.config.ts` builds with `PUBLIC_WEB3FORMS_KEY=test-key-web3forms-dummy` and runs `**/*.enabled.spec.ts`.

From src/lib/content/site.ts (read-only here — do NOT edit; owned by 06-03):
```ts
site.contact.email  // 'emanrimawi@gmail.com'
site.contact.ctaPhrase  // "Let's Connect"
site.founder  // 'Eman Rimawi'
site.org      // 'Diversity Includes Disability'
site.url      // 'https://wolfwdavid.github.io' (origin, no trailing slash)
```

Base-path: `import { base } from '$app/paths'` and `import { resolve } from '$app/paths'`. Internal links MUST use `resolve()` (never `href="/…"`); external/mailto use literal `href={…}` with an eslint-disable for `svelte/no-navigation-without-resolve` (see SocialLinks.svelte precedent).

Web3Forms POST contract (RESEARCH §Standard Stack):
- Endpoint `https://api.web3forms.com/submit`, method POST.
- Hidden `access_key` (the public key). Honeypot checkbox `botcheck`.
- No-JS: `enctype="multipart/form-data"` (NOT urlencoded — 301/CORS), hidden `redirect` = same-domain success URL.
- JS: `fetch` JSON `{ access_key, name, email, message, botcheck:false }` → `{ success, message }`.

a11y.spec.ts current ROUTES: `['/', '/about/', '/services/', '/contact/', '/accessibility/']`. Add `/contact/success/`. Do NOT touch `check-seo-meta.mjs` / `seo.spec.ts` (their 5-route arrays deliberately EXCLUDE the noindex utility page).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author the RED specs (default hidden + enabled accessible)</name>
  <read_first>tests/a11y.spec.ts, tests/content-routes.spec.ts, playwright.enabled.config.ts</read_first>
  <files>tests/contact-form.spec.ts, tests/contact-form.enabled.spec.ts</files>
  <action>
Write both specs FIRST (they fail until Task 2 builds the form). The default spec runs under the standard config (no key); the enabled spec runs only under `playwright.enabled.config.ts` (dummy key, network stubbed).

`tests/contact-form.spec.ts` (default build — ENGAGE-02: form hidden, mailto primary):
```ts
import { test, expect } from '@playwright/test';

// DEFAULT build has no PUBLIC_WEB3FORMS_KEY → the form must NOT render, and the labeled mailto
// must remain the primary contact method. Scope mailto assertion to <main> (the footer also
// renders a mailto site-wide).
test('no key → contact form is hidden', async ({ page }) => {
	await page.goto('/contact/');
	await expect(page.locator('form.cf')).toHaveCount(0);
});

test('no key → mailto stays primary in the contact main', async ({ page }) => {
	await page.goto('/contact/');
	const mail = page.locator('main a[href^="mailto:emanrimawi@gmail.com"]');
	await expect(mail).toHaveCount(1);
	await expect(mail).toBeVisible();
});
```

`tests/contact-form.enabled.spec.ts` (enabled build — ENGAGE-01). First assert the form actually prerenders with the dummy key (RESEARCH Open Q1), then cover a11y/validation/honeypot/aria-live/targets/axe. Stub the network so no real submission is made:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MODES = ['accessible', 'premium'] as const;

test('enabled build renders the form (dummy key baked at build)', async ({ page }) => {
	await page.goto('/contact/');
	await expect(page.locator('form.cf')).toBeVisible();
});

test('fields have visible labels + autocomplete attrs', async ({ page }) => {
	await page.goto('/contact/');
	await expect(page.getByLabel('Your name')).toHaveAttribute('autocomplete', 'name');
	await expect(page.getByLabel('Your email')).toHaveAttribute('autocomplete', 'email');
	await expect(page.getByLabel('Your message')).toBeVisible();
});

test('honeypot is present but invisible to assistive tech', async ({ page }) => {
	await page.goto('/contact/');
	const hp = page.locator('input[name="botcheck"]');
	await expect(hp).toHaveCount(1);
	await expect(hp).toHaveAttribute('tabindex', '-1');
	// Wrapped in an aria-hidden container → out of the a11y tree.
	await expect(page.locator('[aria-hidden="true"] input[name="botcheck"]')).toHaveCount(1);
});

test('on-blur validation links errors via aria-describedby', async ({ page }) => {
	await page.goto('/contact/');
	const name = page.getByLabel('Your name');
	await name.focus();
	await name.blur();
	const err = page.locator('#cf-name-error');
	await expect(err).toBeVisible();
	await expect(name).toHaveAttribute('aria-describedby', 'cf-name-error');
	await expect(name).toHaveAttribute('aria-invalid', 'true');
});

test('submit with invalid fields moves focus to the first invalid field', async ({ page }) => {
	await page.goto('/contact/');
	await page.locator('form.cf button[type="submit"]').click();
	await expect(page.getByLabel('Your name')).toBeFocused();
});

test('successful submit announces via aria-live (network stubbed)', async ({ page }) => {
	await page.route('**/api.web3forms.com/**', (r) =>
		r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'ok' }) })
	);
	await page.goto('/contact/');
	await page.getByLabel('Your name').fill('Test Person');
	await page.getByLabel('Your email').fill('test@example.com');
	await page.getByLabel('Your message').fill('This is a message of sufficient length.');
	await page.locator('form.cf button[type="submit"]').click();
	await expect(page.locator('#cf-status')).toContainText(/sent|thank/i);
});

test('failed submit announces error with retry + mailto fallback (network stubbed)', async ({ page }) => {
	await page.route('**/api.web3forms.com/**', (r) =>
		r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'nope' }) })
	);
	await page.goto('/contact/');
	await page.getByLabel('Your name').fill('Test Person');
	await page.getByLabel('Your email').fill('test@example.com');
	await page.getByLabel('Your message').fill('This is a message of sufficient length.');
	await page.locator('form.cf button[type="submit"]').click();
	const status = page.locator('#cf-status');
	await expect(status).toContainText(/wrong|error/i);
	await expect(status.getByRole('button', { name: /retry/i })).toBeVisible();
	await expect(status.locator('a[href^="mailto:emanrimawi@gmail.com"]')).toBeVisible();
});

test('submit button + inputs are >=44px tall', async ({ page }) => {
	await page.goto('/contact/');
	for (const sel of ['#cf-name', '#cf-message', 'form.cf button[type="submit"]']) {
		const box = await page.locator(sel).boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	}
});

for (const m of MODES) {
	test(`axe: zero violations on /contact with the form in ${m} mode`, async ({ page }) => {
		await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
		await page.goto('/contact/');
		await expect(page.locator('html')).toHaveAttribute('data-mode', m);
		await expect(page.locator('form.cf')).toBeVisible();
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(violations).toEqual([]);
	});
}
```
  </action>
  <verify>
    <automated>grep -q "form.cf" tests/contact-form.spec.ts && grep -q "api.web3forms.com" tests/contact-form.enabled.spec.ts && grep -q "wcag2aaa" tests/contact-form.enabled.spec.ts</automated>
  </verify>
  <done>Both spec files exist with the assertions above. They are expected to FAIL until Task 2 (RED).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build ContactForm.svelte and gate it into the contact page</name>
  <read_first>src/routes/contact/+page.svelte, src/lib/components/SocialLinks.svelte, src/lib/styles/tokens.css</read_first>
  <behavior>
    - No key → contact page renders no form; mailto present (contact-form.spec.ts).
    - Key present → form visible; labels+autocomplete; honeypot aria-hidden/tabindex=-1; on-blur errors via aria-describedby; submit-invalid focuses first invalid; aria-live announces sending/ok/error; error offers Retry + mailto; ≥44px; axe clean both modes (contact-form.enabled.spec.ts).
  </behavior>
  <files>src/lib/components/ContactForm.svelte, src/routes/contact/+page.svelte</files>
  <action>
Create `src/lib/components/ContactForm.svelte` (Svelte 5 runes; token-only styling; progressive enhancement per RESEARCH Patterns 2 & 3). Note `submitForm(e: Event)` so the Retry button (a MouseEvent) can reuse it:
```svelte
<script lang="ts">
	import { base } from '$app/paths';
	import { site } from '$lib/content/site';

	let { accessKey }: { accessKey: string } = $props();
	const ENDPOINT = 'https://api.web3forms.com/submit';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let touched = $state({ name: false, email: false, message: false });
	let status = $state<'idle' | 'sending' | 'ok' | 'error'>('idle');

	const errors = $derived({
		name: touched.name && !name.trim() ? 'Enter your name.' : '',
		email:
			touched.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
				? 'Enter a valid email address.'
				: '',
		message:
			touched.message && message.trim().length < 10
				? 'Enter a message of at least 10 characters.'
				: ''
	});

	function firstErrorId(): string | null {
		if (errors.name) return 'cf-name';
		if (errors.email) return 'cf-email';
		if (errors.message) return 'cf-message';
		return null;
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		if (status === 'sending') return;
		touched = { name: true, email: true, message: true };
		const bad = firstErrorId();
		if (bad) {
			document.getElementById(bad)?.focus();
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
		} catch {
			status = 'error';
		}
	}
</script>

<form
	class="cf"
	action={ENDPOINT}
	method="POST"
	enctype="multipart/form-data"
	onsubmit={submitForm}
>
	<input type="hidden" name="access_key" value={accessKey} />
	<!-- No-JS submitters redirect to our own prerendered success page (same-domain, free tier). -->
	<input type="hidden" name="redirect" value={`${site.url}${base}/contact/success/`} />

	<!-- a11y-safe honeypot: off-screen, out of tab order, hidden from AT. Never `required`. -->
	<div class="cf-hp" aria-hidden="true">
		<label>
			Leave this field empty
			<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" />
		</label>
	</div>

	<div class="cf-field">
		<label for="cf-name">Your name</label>
		<input
			id="cf-name"
			name="name"
			type="text"
			autocomplete="name"
			bind:value={name}
			onblur={() => (touched = { ...touched, name: true })}
			aria-invalid={!!errors.name}
			aria-describedby={errors.name ? 'cf-name-error' : undefined}
		/>
		{#if errors.name}
			<p id="cf-name-error" class="cf-error" role="alert"><span aria-hidden="true">⚠ </span>Error: {errors.name}</p>
		{/if}
	</div>

	<div class="cf-field">
		<label for="cf-email">Your email</label>
		<input
			id="cf-email"
			name="email"
			type="email"
			inputmode="email"
			autocomplete="email"
			bind:value={email}
			onblur={() => (touched = { ...touched, email: true })}
			aria-invalid={!!errors.email}
			aria-describedby={errors.email ? 'cf-email-error' : undefined}
		/>
		{#if errors.email}
			<p id="cf-email-error" class="cf-error" role="alert"><span aria-hidden="true">⚠ </span>Error: {errors.email}</p>
		{/if}
	</div>

	<div class="cf-field">
		<label for="cf-message">Your message</label>
		<textarea
			id="cf-message"
			name="message"
			rows="5"
			bind:value={message}
			onblur={() => (touched = { ...touched, message: true })}
			aria-invalid={!!errors.message}
			aria-describedby={errors.message ? 'cf-message-error' : undefined}
		></textarea>
		{#if errors.message}
			<p id="cf-message-error" class="cf-error" role="alert"><span aria-hidden="true">⚠ </span>Error: {errors.message}</p>
		{/if}
	</div>

	<button type="submit" class="cf-submit" aria-disabled={status === 'sending'}>
		{status === 'sending' ? 'Sending…' : 'Send message'}
	</button>

	<p
		id="cf-status"
		class="cf-status"
		class:cf-status--ok={status === 'ok'}
		class:cf-status--error={status === 'error'}
		role={status === 'error' ? 'alert' : 'status'}
		aria-live={status === 'error' ? 'assertive' : 'polite'}
	>
		{#if status === 'sending'}Sending your message…
		{:else if status === 'ok'}Message sent — thank you. {site.founder} will be in touch.
		{:else if status === 'error'}
			Something went wrong.
			<button type="button" class="cf-retry" onclick={submitForm}>Retry</button>
			or email <a href={`mailto:${site.contact.email}`}>{site.founder}</a> directly.
		{/if}
	</p>
</form>

<style>
	.cf { display: flex; flex-direction: column; gap: var(--space-4); max-width: 44ch; }
	.cf-field { display: flex; flex-direction: column; gap: var(--space-2); }
	.cf label { font-weight: 600; }
	.cf input,
	.cf textarea {
		min-height: 44px;
		padding: var(--space-2) var(--space-3);
		font: inherit;
		color: var(--text);
		background: var(--bg);
		border: 2px solid var(--field-border);
		border-radius: var(--radius-sm);
	}
	.cf input[aria-invalid='true'],
	.cf textarea[aria-invalid='true'] { border-color: var(--danger); }
	.cf-error { margin: 0; color: var(--danger); font-weight: 600; }
	.cf-submit {
		align-self: flex-start;
		min-height: 44px;
		padding: var(--space-2) var(--space-5);
		font: inherit;
		font-weight: 600;
		color: var(--on-primary);
		background: var(--primary);
		border: 0;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.cf-submit[aria-disabled='true'] { opacity: 0.7; cursor: progress; }
	.cf-status { margin: 0; min-height: 1.5em; }
	.cf-status--ok { color: var(--success); font-weight: 600; }
	.cf-status--error { color: var(--danger); font-weight: 600; }
	.cf-retry {
		min-height: 44px;
		padding: var(--space-1) var(--space-4);
		font: inherit;
		color: var(--on-primary);
		background: var(--primary);
		border: 0;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	/* off-screen honeypot — NOT display:none (bots skip it); aria-hidden wrapper keeps it out of AT */
	.cf-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
</style>
```

Edit `src/routes/contact/+page.svelte`: import the key + component, gate on a non-empty key, render the form as a titled section between the primary mailto and the social heading (mailto stays FIRST/primary → ENGAGE-02). Add to the `<script>`:
```ts
import { PUBLIC_WEB3FORMS_KEY } from '$env/static/public';
import ContactForm from '$lib/components/ContactForm.svelte';
const formEnabled = PUBLIC_WEB3FORMS_KEY.length > 0;
```
Then, after the existing `<p class="contact__primary">…</p>` block and before the `<h2 class="contact__social-heading">`, insert:
```svelte
{#if formEnabled}
	<section class="contact__form" aria-labelledby="contact-form-h">
		<h2 id="contact-form-h">Send a message</h2>
		<ContactForm accessKey={PUBLIC_WEB3FORMS_KEY} />
	</section>
{/if}
```
Do not remove or reorder the mailto. Verify RED→GREEN:
```bash
pnpm check && pnpm lint
pnpm exec playwright test tests/contact-form.spec.ts            # default: hidden → GREEN
pnpm test:e2e:enabled                                            # enabled: visible/accessible → GREEN
```
  </action>
  <verify>
    <automated>pnpm check && pnpm exec playwright test tests/contact-form.spec.ts && pnpm test:e2e:enabled</automated>
  </verify>
  <done>Default build hides the form (mailto primary); enabled build renders an accessible form passing all enabled specs incl. axe wcag2aaa in both modes; `pnpm check` + `pnpm lint` clean.</done>
</task>

<task type="auto">
  <name>Task 3: Branded no-JS success page + axe coverage</name>
  <read_first>src/routes/about/+page.svelte, src/lib/components/Seo.svelte, tests/a11y.spec.ts, scripts/check-content-source.mjs</read_first>
  <files>src/routes/contact/success/+page.svelte, tests/a11y.spec.ts</files>
  <action>
Create `src/routes/contact/success/+page.svelte` — the prerendered landing for no-JS submitters (Web3Forms redirects here). It imports `content/site` (satisfies the content-source gate), keeps the mailto present, uses `resolve()` for the internal back-link (base-path safe), and is `noindex` (utility page, deliberately excluded from the SEO 5-route gate):
```svelte
<!-- /contact/success — no-JS submission landing (Web3Forms redirect target). Prerendered + noindex
     utility page: intentionally NOT in the 5-route SEO/seo.spec gate arrays (it is not a marketing
     route). Added to tests/a11y.spec.ts ROUTES so axe still scans it in both modes. -->
<script lang="ts">
	import { site } from '$lib/content/site';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Message sent · {site.org}</title>
	<meta name="description" content="Your message to Diversity Includes Disability was sent." />
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="success">
	<h1>Message sent</h1>
	<p>Thank you for reaching out to {site.org}. {site.founder} will get back to you.</p>
	<p>
		Prefer email? <a href={`mailto:${site.contact.email}`}>Email {site.founder}</a>
		at {site.contact.email}.
	</p>
	<p><a class="success__back" href={resolve('/contact')}>Back to Contact</a></p>
</section>

<style>
	.success {
		max-width: var(--measure);
		margin-inline: auto;
		padding: var(--space-7) var(--space-5);
	}
	.success h1 { font-size: var(--fs-h1); margin: 0 0 var(--space-5); }
	.success p { font-size: var(--fs-lg); margin: 0 0 var(--space-5); }
	.success__back {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		border-radius: var(--radius-sm);
	}
</style>
```

Add the route to the axe suite. In `tests/a11y.spec.ts` change the ROUTES line to include the success page:
```ts
const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/', '/contact/success/'] as const;
```
(Leave `check-seo-meta.mjs` and `seo.spec.ts` at 5 routes — the noindex utility page is deliberately outside the SEO gate.)

Verify it prerenders (entries:['*'] auto-discovers it) and passes axe + all source gates:
```bash
pnpm build && test -f build/contact/success/index.html
pnpm exec playwright test tests/a11y.spec.ts
pnpm test:content && pnpm test:review
```
  </action>
  <verify>
    <automated>pnpm build && test -f build/contact/success/index.html && grep -q "/contact/success/" tests/a11y.spec.ts && pnpm test:content && pnpm test:review && pnpm exec playwright test tests/a11y.spec.ts</automated>
  </verify>
  <done>`/contact/success/` prerenders to `build/contact/success/index.html`, carries `robots noindex`, keeps the mailto, passes axe in both modes, and passes content-source + review-marker gates. SEO 5-route gate untouched.</done>
</task>

</tasks>

<verification>
- `pnpm exec playwright test tests/contact-form.spec.ts` (default): form hidden, mailto primary — GREEN.
- `pnpm test:e2e:enabled`: form visible/accessible/validation/honeypot/aria-live/≥44px + axe both modes — GREEN.
- `pnpm exec playwright test tests/a11y.spec.ts`: all 6 routes (incl `/contact/success/`) clean both modes.
- `pnpm check`, `pnpm lint`, `pnpm test:content`, `pnpm test:review`, `pnpm test:tokens` — GREEN.
- `check-seo-meta.mjs` / `seo.spec.ts` unchanged (5 routes) — no SEO regression.
</verification>

<success_criteria>
- ENGAGE-01: accessible progressive-enhancement form proven by the enabled suite.
- ENGAGE-02: no-key build hides the form; mailto remains primary; build green with env unset.
- No-JS submitters land on an accessible, noindex, on-brand success page.
- Every existing gate stays green; route-sensitive gates handled deliberately.
</success_criteria>

<output>
After completion, create `.planning/phases/06-engagement-surfaces/06-02-SUMMARY.md`.
</output>
