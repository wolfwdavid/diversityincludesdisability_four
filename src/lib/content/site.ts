// Single source of truth for ALL site copy (CONT-06). No copy is hardcoded in page markup.
// [REVIEW] markers are CODE COMMENTS ONLY — never rendered. The TypeScript compiler strips them,
// and the check-review-markers.mjs build gate fails if the string "[REVIEW" ever reaches build/**/*.html.
//
// Content authenticity rule (LOCKED): this is a real activist's professional site. We invent NO
// credentials, quotes, statistics, dates, client names, or biographical claims. Everything here is
// drawn from the verified public facts in 03-CONTEXT.md. Anything requiring Eman's real words is a
// [REVIEW] comment beside a true-but-generic placeholder, or an `undefined` optional the page omits.

export interface ServiceItem {
	slug: string;
	title: string;
	summary: string; // one-line, for the Home service cards
	body: string; // fuller paragraph, for the /services page
}

export interface SocialItem {
	name: string; // display name, e.g. "Facebook"
	label: string; // accessible name, e.g. "Diversity Includes Disability on Facebook"
	href: string; // "#" placeholder until the real handle is confirmed
	icon: 'facebook' | 'x' | 'linkedin' | 'instagram';
}

export const site = {
	org: 'Diversity Includes Disability',
	tagline: 'Diversity Includes Disability',
	founder: 'Eman Rimawi',
	contact: {
		email: 'emanrimawi@gmail.com',
		ctaPhrase: "Let's Connect"
	},
	home: {
		heroHeadline: 'Diversity Includes Disability',
		heroSubhead:
			'Intersectional disability equity, inclusion, and representation — training, consulting, and speaking that move organizations from awareness to action.',
		mission:
			'Disability belongs in every conversation about diversity. Diversity Includes Disability partners with organizations, institutions, and audiences to build accessibility and belonging into the way they work — not as an afterthought, but as a foundation.',
		founderRole: 'Founder & Lead Consultant', // [REVIEW: confirm title]
		founderPositioning:
			'Eman Rimawi leads Diversity Includes Disability, partnering with organizations to build accessibility and belonging into how they work.' // [REVIEW: bio specifics — confirm with Eman]
	},
	about: {
		heading: 'About Eman Rimawi',
		para1:
			'Diversity Includes Disability works with organizations, institutions, and audiences to make disability a central part of every diversity, equity, and inclusion conversation — moving partners from awareness to durable, accessible practice.',
		// [REVIEW: Eman's personal story / lived experience / credentials — to be provided]
		para2Placeholder:
			'Diversity Includes Disability is grounded in intersectional advocacy: the understanding that disability overlaps with race, gender, and every other part of who we are, and that inclusion only works when it accounts for the whole person.',
		para3:
			'The approach is intersectional, lived-experience-informed, and action-oriented — practical partnership that turns commitments into accessible, everyday practice rather than one-time statements.',
		pullQuote: undefined as string | undefined // [REVIEW: real quote from Eman — render only if provided]
	},
	servicesIntro:
		'Diversity Includes Disability partners with organizations across trainings, consulting, representation, and speaking — meeting each partner where they are and building toward durable, accessible practice.',
	services: [
		{
			slug: 'trainings',
			title: 'Trainings & Facilitation',
			summary:
				'Interactive sessions that move teams, leadership, and institutions from awareness to applied disability-inclusion practice.',
			body: 'Interactive sessions on intersectional disability equity and inclusion for teams, leadership, and institutions — from foundational awareness to applied practice.'
		},
		{
			slug: 'consulting',
			title: 'Disability Consulting',
			summary:
				'Advisory partnership to embed accessibility and disability inclusion into policy, programs, and culture.',
			body: 'Advisory partnership to embed accessibility and disability inclusion into policy, programs, events, and culture.'
		},
		{
			slug: 'modeling',
			title: 'Modeling for Representation',
			summary:
				'Authentic disability representation in campaigns and media — real people, not stereotypes.',
			body: 'Authentic disability representation in campaigns and media that reflects real people, not stereotypes.'
		},
		{
			slug: 'speaking',
			title: 'Speaking & Panels',
			summary:
				'Keynotes, panels, and moderated conversations on disability, equity, and belonging.',
			body: 'Keynotes, panels, and moderated conversations on disability, equity, and belonging for conferences and organizations.'
		}
	] satisfies ServiceItem[],
	contactIntro:
		'Reach out about trainings, consulting, modeling, or speaking engagements — or just to start a conversation about building disability equity into your work.',
	social: [
		{ name: 'Facebook', label: 'Diversity Includes Disability on Facebook', href: '#', icon: 'facebook' }, // [REVIEW: confirm handle/URL]
		{ name: 'X', label: 'Diversity Includes Disability on X (Twitter)', href: '#', icon: 'x' }, // [REVIEW: confirm handle/URL]
		{ name: 'LinkedIn', label: 'Diversity Includes Disability on LinkedIn', href: '#', icon: 'linkedin' }, // [REVIEW: confirm handle/URL]
		{ name: 'Instagram', label: 'Diversity Includes Disability on Instagram', href: '#', icon: 'instagram' } // [REVIEW: confirm handle/URL]
	] satisfies SocialItem[],
	a11yStatement: {
		conformanceTarget:
			'WCAG 2.2 Level AA as the floor, targeting Level AAA where feasible in Accessible mode.',
		knownIssues: [
			'The Premium 3D hero is not yet shipped; the Accessible static poster is the current hero in both modes.',
			'Social profile links are pending confirmation.'
		] as string[],
		feedbackEmail: 'emanrimawi@gmail.com',
		reviewCadence: 'Reviewed at least every six months.',
		lastReviewed: '2026-07' // [REVIEW: keep current]
	}
} as const;
