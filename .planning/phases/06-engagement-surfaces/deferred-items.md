# Deferred Items — Phase 06 Engagement Surfaces

Out-of-scope issues discovered during execution. NOT fixed by the discovering plan
(scope boundary: only auto-fix issues directly caused by the current task's changes).

## From 06-02 (contact-form-and-success-page)

- **`scripts/check-token-contrast.mjs` fails `prettier --check`** (formatting-only,
  whitespace). Introduced by 06-01 (`feat(06-01): add AAA-safe engagement tokens +
  computed contrast gate`, commit b5ec05c). Blocks the `pnpm lint` gate. Fix with
  `pnpm exec prettier --write scripts/check-token-contrast.mjs` during 06-04
  (integration drive-green). Not caused by 06-02's changes.
