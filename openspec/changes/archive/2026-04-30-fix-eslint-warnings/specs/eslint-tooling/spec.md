## MODIFIED Requirements

### Requirement: React linting uses @eslint-react/eslint-plugin

The project SHALL use `@eslint-react/eslint-plugin` with the `recommended-type-checked` preset in place of `eslint-plugin-react` and `eslint-plugin-react-hooks`.

#### Scenario: ESLint passes with zero errors and zero warnings

- **WHEN** `pnpm eslint apps/app` is run
- **THEN** the command SHALL exit with code 0 and report zero errors and zero warnings
