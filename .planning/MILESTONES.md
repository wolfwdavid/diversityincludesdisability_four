# Milestones

## v1.0 — Dual-Mode Site (SHIPPED 2026-07-05)

**Goal:** A modern, premium SvelteKit site for Diversity Includes Disability with two togglable,
persistent experiences — Premium 3D (Threlte) and Accessible (scope.org.uk-caliber, WCAG 2.2 AA+/AAA) —
live on GitHub Pages.

**Shipped (5 phases, 32/32 requirements):**
1. Foundation & Deploy Proof — static SvelteKit live under `/diversityincludesdisability_four/` (base-path/.nojekyll/404-SPA proven)
2. Mode System & Design Tokens — persistent `aria-pressed` toggle, no-flash pre-paint theming, OS-signal auto-select, AAA token contract, self-hosted Lexend + Source Sans 3
3. Accessible Experience — 5 pages of faithful DID content, one CSS-driven semantic DOM, skip links, APG nav, keyboard-complete (57 e2e)
4. Premium 3D — lazy Threlte hero (procedural particles + echo rings), zero WebGL in the Accessible bundle (grep-proven), dispose-safe, poster fallback
5. Launch Hardening — SEO/OG meta (absolute base-path URLs, 1200×630 card), fail-closed CI gate (axe both modes + Lighthouse a11y ≥ 0.95) → deploy (guarded retry) → live smoke

**Live:** https://wolfwdavid.github.io/diversityincludesdisability_four/
**Final state:** ~70 Playwright/axe e2e green; full CI pipeline verify→build→deploy→smoke green.
**Known debt carried forward:** four `[REVIEW]` content placeholders (bio, pull-quote, social URLs, founder title) — disclosed in the site's Accessibility Statement.

---

## v1.1 — Real Content & Reach (CURRENT)

**Goal:** Replace placeholder content with Eman's real words, extend engagement surfaces
(contact form, podcast section), and cut over to the real domain — with human-gated work cleanly
separated from build work that can proceed now.
