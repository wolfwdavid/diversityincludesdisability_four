import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MediaSection from '$lib/components/MediaSection.svelte';

const fixture = [
	{
		title: 'On Disability Justice',
		description: 'A conversation about intersectional advocacy.',
		url: 'https://example.com/ep1',
		platform: 'Example FM'
	}
];

describe('MediaSection', () => {
	it('renders nothing when the list is empty', () => {
		const { container } = render(MediaSection, { props: { items: [] } });
		expect(container.querySelector('section.media')).toBeNull();
		expect(screen.queryByRole('heading', { name: /media/i })).toBeNull();
	});

	it('renders items with accessible link names + descriptions when populated', () => {
		render(MediaSection, { props: { items: fixture } });
		expect(screen.getByRole('heading', { name: /media/i })).toBeTruthy();
		const link = screen.getByRole('link', { name: /On Disability Justice/i });
		expect(link.getAttribute('href')).toBe('https://example.com/ep1');
		expect(screen.getByText(/intersectional advocacy/i)).toBeTruthy();
	});
});
