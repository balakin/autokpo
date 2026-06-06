## MODIFIED Requirements

### Requirement: React linting uses @eslint-react/eslint-plugin

The project SHALL use `@eslint-react/eslint-plugin` with the `recommended-type-checked` preset in place of `eslint-plugin-react` and `eslint-plugin-react-hooks`. This configuration SHALL be defined in `apps/app/eslint.config.ts` (not in a root config file).

#### Scenario: ESLint passes with zero errors and zero warnings

- **WHEN** `pnpm lint` is run from within `apps/app` (or `pnpm turbo lint --filter=@autokpo/app`)
- **THEN** the command SHALL exit with code 0, report zero errors, and report zero warnings on files that have had all autofixable violations resolved
