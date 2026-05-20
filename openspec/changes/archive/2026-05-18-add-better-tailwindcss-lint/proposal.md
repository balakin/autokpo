## Why

Tailwind v4 introduces canonical class names (e.g. `break-words` → `wrap-break-word`, `[display:flex]` → `flex`) and the LSP already surfaces these as suggestions, but nothing enforces or autofixes them in CI or for AI agents. Adding `eslint-plugin-better-tailwindcss` brings those signals into ESLint — where they are visible in lint output, fixable with `--fix`, and enforced consistently.

## What Changes

- Add `eslint-plugin-better-tailwindcss` as a root devDependency.
- Add a new ESLint config block scoped to `apps/app/**/*.{ts,tsx}` with the plugin's safe rules (no `enforce-consistent-line-wrapping`, which conflicts with Prettier).
- **Correctness rules** (errors): `no-unknown-classes`, `no-conflicting-classes`, `no-duplicate-classes`, `no-deprecated-classes`.
- **Stylistic rules** (warnings): `enforce-canonical-classes`, `enforce-shorthand-classes`, `enforce-logical-properties`, `enforce-consistent-class-order`, `enforce-consistent-variant-order`, `enforce-consistent-variable-syntax`, `enforce-consistent-important-position`.

## Capabilities

### New Capabilities

- `tailwind-lint`: ESLint enforcement of Tailwind class correctness and canonicalization for the app source.

### Modified Capabilities

- `eslint-tooling`: The ESLint config gains a new rule block; the existing zero-errors-zero-warnings requirement must continue to hold after any autofixable violations are resolved.

## Impact

- `package.json` (root): new devDependency `eslint-plugin-better-tailwindcss`.
- `eslint.config.ts` (root): new config block for `apps/app/**/*.{ts,tsx}`.
- Existing source files in `apps/app/src/` may have autofixable violations that need to be resolved before CI is green.
- No runtime or build output changes — lint-only.
