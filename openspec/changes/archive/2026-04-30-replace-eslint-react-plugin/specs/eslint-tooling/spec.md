## ADDED Requirements

### Requirement: React linting uses @eslint-react/eslint-plugin

The project SHALL use `@eslint-react/eslint-plugin` with the `recommended-type-checked` preset in place of `eslint-plugin-react` and `eslint-plugin-react-hooks`.

#### Scenario: ESLint passes after replacement

- **WHEN** `pnpm eslint apps/app` is run after the dependency swap
- **THEN** the command exits with code 0 and reports zero errors
