// WCAG contrast gate for the Phase-6 engagement tokens (RESEARCH Pitfall 5).
// --danger/--success are text → >=7:1 (AAA); --field-border is a UI boundary → >=3:1.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/lib/styles/tokens.css', 'utf8');
const block = (mode) => {
	const m = css.match(new RegExp(`\\[data-mode='${mode}'\\]\\s*\\{([\\s\\S]*?)\\}`));
	if (!m) throw new Error(`no ${mode} block`);
	return m[1];
};
const tok = (body, name) => {
	const m = body.match(new RegExp(`--${name}:\\s*([^;]+);`));
	return m ? m[1].trim() : null;
};
const hexToRgb = (h) => {
	h = h.replace('#', '');
	if (h.length === 3)
		h = h
			.split('')
			.map((c) => c + c)
			.join('');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (rgb) => {
	const a = rgb.map((v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const ratio = (h1, h2) => {
	const l1 = lum(hexToRgb(h1)),
		l2 = lum(hexToRgb(h2));
	const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (hi + 0.05) / (lo + 0.05);
};

const fails = [];
for (const mode of ['accessible', 'premium']) {
	const b = block(mode);
	const bg = tok(b, 'bg');
	for (const [name, min] of [
		['danger', 7],
		['success', 7],
		['field-border', 3]
	]) {
		const val = tok(b, name);
		if (!val) {
			fails.push(`${mode}: --${name} missing`);
			continue;
		}
		if (!val.startsWith('#')) {
			fails.push(`${mode}: --${name} must be hex (got ${val})`);
			continue;
		}
		const r = ratio(val, bg);
		if (r < min)
			fails.push(`${mode}: --${name} (${val}) on --bg (${bg}) = ${r.toFixed(2)}:1 < ${min}:1`);
		else console.log(`OK ${mode} --${name} ${val} on ${bg} = ${r.toFixed(2)}:1 (>=${min})`);
	}
}
if (fails.length) {
	console.error('CONTRAST FAIL:\n' + fails.join('\n'));
	process.exit(1);
}
console.log('CONTRAST OK: engagement tokens meet WCAG thresholds in both modes');
