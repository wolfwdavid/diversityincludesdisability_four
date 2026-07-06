<!-- /contact (CONT-04 + CONT-05) — "Let's Connect": a labeled, visible mailto to the founder plus the
     named SocialLinks list. No backend/form (locked decision). Single <h1>; all copy from site.ts. The
     mailto link text is real words ("Email Eman Rimawi"), never a bare icon, and the address is also
     shown as visible text nearby so the accessible name is unambiguous. -->
<script lang="ts">
	import { PUBLIC_WEB3FORMS_KEY } from '$env/static/public';
	import { site } from '$lib/content/site';
	import Seo from '$lib/components/Seo.svelte';
	import SocialLinks from '$lib/components/SocialLinks.svelte';
	import ContactForm from '$lib/components/ContactForm.svelte';
	const formEnabled = PUBLIC_WEB3FORMS_KEY.length > 0; // '' → false → inert (ENGAGE-02)
</script>

<Seo title={site.seo.contact.title} description={site.seo.contact.description} path="/contact/" />

<section class="contact">
	<h1>{site.contact.ctaPhrase}</h1>
	<p class="contact__intro">{site.contactIntro}</p>

	<p class="contact__primary">
		<a class="contact__mailto" href={`mailto:${site.contact.email}`}>Email {site.founder}</a>
		<span class="contact__address">{site.contact.email}</span>
	</p>

	{#if formEnabled}
		<section class="contact__form" aria-labelledby="contact-form-h">
			<h2 id="contact-form-h">{site.contactForm.heading}</h2>
			<ContactForm accessKey={PUBLIC_WEB3FORMS_KEY} />
		</section>
	{/if}

	<h2 class="contact__social-heading">Follow Diversity Includes Disability</h2>
	<SocialLinks />
</section>

<style>
	.contact {
		max-width: var(--measure);
		margin-inline: auto;
		padding: var(--space-7) var(--space-5);
	}
	.contact h1 {
		font-size: var(--fs-h1);
		margin: 0 0 var(--space-5);
	}
	.contact__intro {
		font-size: var(--fs-lg);
		margin: 0 0 var(--space-6);
	}
	.contact__primary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
		margin: 0 0 var(--space-7);
	}
	/* mailto target >=44px tall (A11Y-04) */
	.contact__mailto {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: var(--space-2) var(--space-5);
		background: var(--primary);
		color: var(--on-primary);
		font-weight: 600;
		text-decoration: none;
		border-radius: var(--radius-sm);
	}
	.contact__mailto:hover {
		background: var(--primary-hover, var(--primary));
	}
	.contact__address {
		color: var(--text-muted);
		font-size: var(--fs-lg);
	}
	.contact__form {
		margin: 0 0 var(--space-7);
	}
	.contact__form h2 {
		font-size: var(--fs-h2);
		margin: 0 0 var(--space-4);
	}
	.contact__social-heading {
		font-size: var(--fs-h2);
		margin: 0 0 var(--space-4);
	}
</style>
