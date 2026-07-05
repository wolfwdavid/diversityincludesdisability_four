<script lang="ts">
	// SiteFooter — the persistent bottom landmark (A11Y-02). Labeled "Site" because a <footer>
	// nested inside <body> is only a landmark when distinguished; the label keeps it unambiguous
	// when a page also has article-level footers. Contents come entirely from site.ts (CONT-06):
	// a visible mailto contact, the named SocialLinks, an accessibility-statement link (consistent
	// placement, WCAG 3.2.6), and a copyright with the year computed at render (never hardcoded).
	import { resolve } from '$app/paths';
	import { site } from '$lib/content/site';
	import SocialLinks from '$lib/components/SocialLinks.svelte';

	const year = new Date().getFullYear();
</script>

<footer class="site-footer" aria-label="Site">
	<div class="site-footer__inner">
		<div class="site-footer__contact">
			<a class="site-footer__email" href={`mailto:${site.contact.email}`}>
				Email {site.founder}
			</a>
			<SocialLinks />
		</div>

		<nav class="site-footer__meta" aria-label="Footer">
			<a href={resolve('/accessibility')}>Accessibility statement</a>
		</nav>

		<p class="site-footer__copyright">© {year} {site.org}</p>
	</div>
</footer>

<style>
	.site-footer {
		border-top: 1px solid var(--border);
		background: var(--surface);
		padding: var(--space-6) var(--space-5);
	}
	.site-footer__inner {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		max-width: var(--measure);
		margin-inline: auto;
	}
	.site-footer__contact {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	/* mailto link — visible target box >=44px tall (A11Y-04). */
	.site-footer__email {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--primary);
		font-weight: 600;
		text-decoration: none;
	}
	.site-footer__email:hover {
		text-decoration: underline;
	}
	.site-footer__meta a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--text);
		text-decoration: underline;
	}
	.site-footer__meta a:hover {
		color: var(--primary);
	}
	.site-footer__copyright {
		margin: 0;
		color: var(--text-muted);
		font-size: var(--fs-sm);
	}
</style>
