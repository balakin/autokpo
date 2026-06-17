# @autokpo/eslint-config

Shared, flat-config ESLint preset for the AutoKPO monorepo. Internal and private — not published to npm.

## What it provides

A single `base` config (`@autokpo/eslint-config/base`) for TypeScript and TSX files. It composes:

- `@eslint/js` recommended rules
- `typescript-eslint` `recommendedTypeChecked` (type-aware linting via `projectService`)
- `eslint-plugin-import-x` recommended rules, plus enforced import ordering, deduplication, and `newline-after-import`
- `eslint-config-prettier` — re-exported so consumers can disable formatting rules last

It also enforces a few project conventions: alphabetized, newline-separated import groups (`cloudflare:*` treated as external), `consistent-type-imports` / `consistent-type-exports`, and `no-unused-vars` with `^_` ignore patterns. Declaration files (`*.d.ts`) relax the type-import and empty-object-type rules.

For convenience the package also re-exports the underlying building blocks (`js`, `tseslint`, `importX`, `eslintConfigPrettier`) so consumer configs can extend the base with package-specific rules.

## Usage

Add it as a workspace dependency:

```jsonc
// package.json
{
  "devDependencies": {
    "@autokpo/eslint-config": "workspace:*",
  },
}
```

Then extend it from a flat `eslint.config.ts`:

```ts
import baseConfig, { eslintConfigPrettier } from '@autokpo/eslint-config/base';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...baseConfig,
  // ...package-specific overrides...
  eslintConfigPrettier, // keep last to disable formatting-related rules
]);
```

`@autokpo/app` and `@autokpo/website` both build their configs on top of this base — see their `eslint.config.ts` files for full examples.

## License

[GNU Affero General Public License v3.0](../../LICENSE) (AGPL-3.0).
