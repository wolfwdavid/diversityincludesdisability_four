import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import HarnessProbe from './HarnessProbe.svelte';

// Wave-0 scaffold: proves the vitest + jsdom + @testing-library/svelte harness itself is wired
// (Svelte 5 runes component renders in jsdom, queries resolve). Wave 2 replaces/augments this with
// the real MediaSection empty-vs-populated data-branch spec (tests/unit/MediaSection.spec.ts).
describe('component test harness', () => {
	it('runs in a jsdom DOM environment', () => {
		expect(typeof document).toBe('object');
		expect(document.createElement('div')).toBeTruthy();
	});

	it('renders a Svelte 5 runes component and reflects its prop', () => {
		const { getByTestId } = render(HarnessProbe, { props: { label: 'wired' } });
		expect(getByTestId('probe').textContent).toBe('wired');
	});
});
