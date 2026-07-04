---
phase: 2
slug: mode-system-design-tokens
type: UI-SPEC
status: ready
created: 2026-07-04
source: ui-ux-pro-max (design-system) + computed WCAG contrast verification
requirements: [MODE-01, MODE-02, MODE-03, MODE-04, MODE-05, DS-01, DS-02]
---

# Phase 2 — UI Design Contract: Mode System & Design Tokens

> The visual + interaction contract for the dual-mode engine. Downstream planner/executor MUST
> implement tokens and the toggle exactly as specified. All color pairs below are **computed and
> WCAG-verified** (ratios shown); do not substitute un-verified colors.

---

## 1. Design language

- **Pattern:** Trust & Authority + Minimal (hero → content → CTA). Credibility-forward, calm, uncluttered.
- **Accessible mode:** flat, white, high-contrast, no motion, generous type — scope.org.uk lineage. The reference render.
- **Premium mode:** "Luminous depth" — deep near-black canvas, DID blue/orange used as *glowing accents*, soft glassmorphic surfaces, restrained motion. An enhancement, never a prerequisite for content.
- **Anti-patterns (do NOT do):** AI purple/pink gradients; emoji as icons (use inline SVG, Lucide geometry); low-contrast gray-on-gray; motion with no reduced-motion guard; hiding focus rings.

---

## 2. Typography

Self-host both families (no Google Fonts CDN call — performance + privacy; Accessible mode must stay light). Use `@fontsource` woff2 or local subset, `font-display: swap`, preload the two critical weights.

- **Headings:** **Lexend** (300–700). Chosen deliberately: Lexend is engineered to improve reading proficiency and reduce visual stress — on-theme for a disability-equity org.
- **Body/UI:** **Source Sans 3** (400/500/600/700). Highly legible, neutral, pairs cleanly with Lexend.
- **Fallback stack:** `Lexend, system-ui, sans-serif` / `"Source Sans 3", system-ui, -apple-system, sans-serif`.

### Type scale (fluid, rem)
Accessible mode uses a **larger base (18px)**; Premium uses 16px base. Same ratio (~1.25).

| Token | Accessible | Premium | Use |
|-------|-----------|---------|-----|
| `--fs-base` | 1.125rem (18px) | 1rem (16px) | body |
| `--fs-sm` | 1rem | 0.875rem | captions, meta |
| `--fs-lg` | 1.375rem | 1.25rem | lead paragraph |
| `--fs-h3` | 1.5rem | 1.5rem | subsection |
| `--fs-h2` | 2rem | 2.25rem | section |
| `--fs-h1` | 2.75rem | clamp(2.5rem, 6vw, 4rem) | hero |
| `--lh-body` | 1.7 | 1.6 | line-height (body ≥1.5) |
| `--lh-heading` | 1.2 | 1.15 | |
| `--measure` | 65ch | 70ch | max line length |

---

## 3. Color tokens (WCAG-verified)

**Contract:** semantic tokens only in components — never raw hex. Defined on `:root` (shared) with
`[data-mode="accessible"]` and `[data-mode="premium"]` overriding color roles. Ratios are computed
foreground-on-background; **every text pair is AAA (≥7:1)** unless marked.

### Accessible mode — bg `#FFFFFF`
| Token | Hex | On | Ratio | Grade |
|-------|-----|----|-------|-------|
| `--bg` | `#FFFFFF` | — | — | — |
| `--surface` | `#F8FAFC` | — | — | — |
| `--border` | `#D6DEE8` | — | — | — |
| `--text` | `#111111` | bg | 18.9:1 | AAA |
| `--text-muted` | `#404A56` | bg | 9.0:1 | AAA |
| `--primary` (blue link/heading) | `#0A4E8B` | bg | 8.5:1 | AAA |
| `--primary-hover` | `#08427A` | bg | 10.1:1 | AAA |
| `--on-primary` | `#FFFFFF` | `--primary` | 8.5:1 | AAA |
| `--accent` (orange text) | `#9A3412` | bg | 7.3:1 | AAA |
| `--on-accent` | `#FFFFFF` | `--accent` | 7.3:1 | AAA |
| `--focus-ring` | `#08427A` | — | (3px, ≥3:1 vs white) | — |

### Premium mode — bg `#0A0E14`
| Token | Hex | On | Ratio | Grade |
|-------|-----|----|-------|-------|
| `--bg` | `#0A0E14` | — | — | — |
| `--surface` (glass) | `rgba(20,27,38,0.72)` (≈`#141B26` + blur) | — | — | — |
| `--border` | `rgba(120,140,170,0.22)` | — | — | — |
| `--text` | `#E6EDF5` | bg | 16.4:1 | AAA |
| `--text-secondary` | `#C3CEDC` | bg | 12.1:1 | AAA |
| `--text-muted` | `#9AA7B8` | bg 7.9 / glass 7.1 | | AAA |
| `--primary` (blue glow) | `#6FB4FF` | bg 8.9 / glass ~7.9 | | AAA |
| `--accent` (orange glow) | `#FF9E5E` | bg 9.5 / glass 8.5 | | AAA |
| `--on-primary` | `#0A0E14` | `#4DA3FF` btn | 7.4:1 | AAA |
| `--on-accent` | `#0A0E14` | `--accent` btn | 9.5:1 | AAA |
| `--focus-ring` | `#6FB4FF` | — | (3px, high contrast on dark) | — |
| `--glow` | `0 0 24px rgba(111,180,255,0.35)` | decorative only | — | — |

*Note: glow/shadow are decorative — never the sole signal. Orange/blue also carry an icon or text label wherever they convey state (`color-not-only`).*

### Spacing, radius, motion (shared `:root`)
| Token | Value | Notes |
|-------|-------|-------|
| `--space-1..8` | 4,8,12,16,24,32,48,64px | 4/8 rhythm |
| `--radius-sm/md/lg` | 6 / 12 / 20px | Premium cards use `--radius-lg` |
| `--shadow` | mode-specific | Accessible: subtle 1px border + faint shadow; Premium: glass blur + glow |
| `--dur` | 200ms | micro-interaction (150–300ms) |
| `--ease` | cubic-bezier(.2,.7,.2,1) | ease-out enter |
| **reduced-motion** | `@media (prefers-reduced-motion: reduce)` sets all `--dur: 0ms` and disables transitions/animations globally | MANDATORY |

---

## 4. Canonical CSS variable block (implement verbatim in `src/lib/styles/tokens.css`)

```css
:root {
  /* spacing / radius / motion — shared */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  --radius-sm:6px; --radius-md:12px; --radius-lg:20px;
  --dur:200ms; --ease:cubic-bezier(.2,.7,.2,1);
  --focus-width:3px; --focus-offset:2px;
  --font-heading:"Lexend",system-ui,sans-serif;
  --font-body:"Source Sans 3",system-ui,-apple-system,sans-serif;
  --measure:68ch;
}

[data-mode="accessible"] {
  color-scheme: light;
  --bg:#FFFFFF; --surface:#F8FAFC; --border:#D6DEE8;
  --text:#111111; --text-muted:#404A56;
  --primary:#0A4E8B; --primary-hover:#08427A; --on-primary:#FFFFFF;
  --accent:#9A3412; --on-accent:#FFFFFF;
  --focus-ring:#08427A;
  --shadow:0 1px 2px rgba(16,24,40,.08);
  --glow:none;
  --fs-base:1.125rem; --lh-body:1.7; --lh-heading:1.2;
  --fs-h1:2.75rem; --fs-h2:2rem; --fs-h3:1.5rem; --fs-lg:1.375rem; --fs-sm:1rem;
}

[data-mode="premium"] {
  color-scheme: dark;
  --bg:#0A0E14; --surface:rgba(20,27,38,.72); --border:rgba(120,140,170,.22);
  --text:#E6EDF5; --text-secondary:#C3CEDC; --text-muted:#9AA7B8;
  --primary:#6FB4FF; --primary-solid:#4DA3FF; --on-primary:#0A0E14;
  --accent:#FF9E5E; --on-accent:#0A0E14;
  --focus-ring:#6FB4FF;
  --shadow:0 8px 32px rgba(0,0,0,.45);
  --glow:0 0 24px rgba(111,180,255,.35);
  --fs-base:1rem; --lh-body:1.6; --lh-heading:1.15;
  --fs-h1:clamp(2.5rem,6vw,4rem); --fs-h2:2.25rem; --fs-h3:1.5rem; --fs-lg:1.25rem; --fs-sm:.875rem;
}

*:focus-visible {
  outline:var(--focus-width) solid var(--focus-ring);
  outline-offset:var(--focus-offset);
  border-radius:2px;
}

@media (prefers-reduced-motion: reduce){
  :root{ --dur:0ms; }
  *,*::before,*::after{ animation-duration:0ms!important; animation-iteration-count:1!important; transition-duration:0ms!important; scroll-behavior:auto!important; }
}
```

---

## 5. Mode toggle control (MODE-01, MODE-05)

**Semantics:** a real `<button type="button" aria-pressed>` labeled group in the header — NOT a div, NOT CSS-only. One button that toggles, with text + icon so it never relies on color/shape alone.

```html
<button type="button" class="mode-toggle"
        aria-pressed="false"            <!-- true when Premium is active -->
        aria-label="Switch to Premium visual mode">
  <svg aria-hidden="true" ...></svg>
  <span class="mode-toggle__label">Premium</span>
</button>
<!-- visually-hidden live region, in layout, updated on switch -->
<p class="visually-hidden" role="status" aria-live="polite" id="mode-announcer"></p>
```

Requirements the control MUST satisfy:
- **Target size ≥ 44×44px** (exceeds SC 2.5.8's 24px floor; comfortable touch). Visible label, not icon-only.
- **Focus:** uses the global `:focus-visible` ring (3px, mode-appropriate color, ≥3:1).
- **State:** `aria-pressed` reflects current mode; label + icon change ("Accessible" ⇄ "Premium").
- **Announce (MODE-05):** on switch, set `#mode-announcer` textContent to e.g. "Premium visual mode on" / "Accessible mode on" via `aria-live="polite"`. Do NOT move focus; preserve scroll.
- **Keyboard:** Enter/Space activate (native button behavior — do not reimplement).
- **`.visually-hidden`** utility: clip-rect pattern, not `display:none` (must stay in a11y tree).

---

## 6. Mode state engine (MODE-02, MODE-03, MODE-04, DS-02)

- **Single source of truth:** `data-mode` attribute on `<html>`. All theming flows from it (DS-02: one accessible DOM, CSS-driven modes — no duplicated markup).
- **Persistence:** localStorage key `did-mode` = `"accessible" | "premium"`.
- **No-flash (MODE-03):** a **render-blocking inline script in `app.html` `<head>`** sets `document.documentElement.dataset.mode` BEFORE first paint, reading: stored choice → else OS signal.
- **OS auto-select (MODE-04):** when no stored choice, default to **Accessible** if `matchMedia('(prefers-reduced-motion: reduce)').matches` OR `matchMedia('(prefers-contrast: more)').matches`; else Premium.
- **Rune store** (`src/lib/stores/mode.svelte.ts`): initializes FROM the attribute (never re-reads flash), owns writes (updates attribute + localStorage + announcer). Use Svelte 5 runes; avoid destructuring that loses reactivity.

Inline head script (implement verbatim, minified in app.html):
```html
<script>
try{
 var k='did-mode',s=localStorage.getItem(k),m;
 if(s==='accessible'||s==='premium'){m=s}
 else{var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,
        hc=matchMedia('(prefers-contrast: more)').matches;
      m=(rm||hc)?'accessible':'premium'}
 document.documentElement.dataset.mode=m;
}catch(e){document.documentElement.dataset.mode='accessible'}
</script>
```
(Accessible is the safe fallback in the catch — degrade toward the guaranteed-usable render.)

---

## 7. Acceptance (visual/interaction) — feeds plan-checker & verifier
- [ ] `tokens.css` defines all tokens above; components reference vars, zero raw hex (grep).
- [ ] `[data-mode]` swap restyles the page with **no layout shift** and no flash on reload.
- [ ] Toggle is a native `<button aria-pressed>`, ≥44px, visible focus, label+icon, announces via `aria-live`.
- [ ] Reduced-motion / prefers-contrast auto-selects Accessible when no stored choice.
- [ ] Every text token pair verified ≥7:1 (AAA) — automated axe scan clean in both modes.
- [ ] Fonts self-hosted (no request to fonts.googleapis.com in the network log).
```
