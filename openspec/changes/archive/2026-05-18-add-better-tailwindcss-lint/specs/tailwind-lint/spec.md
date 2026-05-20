## ADDED Requirements

### Requirement: Tailwind class correctness is enforced by ESLint

The project SHALL use `eslint-plugin-better-tailwindcss` to enforce Tailwind class correctness and canonicalization in all `apps/app/**/*.{ts,tsx}` files. The following rules SHALL be enabled:

- **Errors**: `no-unknown-classes`, `no-conflicting-classes`, `no-duplicate-classes`, `no-deprecated-classes`
- **Warnings**: `enforce-canonical-classes`, `enforce-shorthand-classes`, `enforce-consistent-class-order`, `enforce-consistent-variant-order`, `enforce-consistent-variable-syntax`, `enforce-consistent-important-position`

The rule `enforce-consistent-line-wrapping` SHALL NOT be enabled (conflicts with Prettier).

#### Scenario: Non-canonical class is flagged and autofixed

- **WHEN** a source file contains a non-canonical Tailwind class (e.g. `break-words`)
- **THEN** ESLint SHALL report a warning and `eslint --fix` SHALL replace it with its canonical form (e.g. `wrap-break-word`)

#### Scenario: Unknown class is flagged as an error

- **WHEN** a source file contains a Tailwind class that Tailwind does not recognise
- **THEN** ESLint SHALL report an error

#### Scenario: Duplicate class is flagged as an error

- **WHEN** a source file contains the same Tailwind class written more than once in the same string
- **THEN** ESLint SHALL report an error

#### Scenario: Conflicting classes are flagged as an error

- **WHEN** a source file contains two Tailwind classes that produce conflicting styles (e.g. `flex block`)
- **THEN** ESLint SHALL report an error

#### Scenario: Deprecated class is flagged as an error

- **WHEN** a source file contains a Tailwind v3 class that has been renamed or removed in v4
- **THEN** ESLint SHALL report an error

#### Scenario: Shorthand opportunity is flagged and autofixed

- **WHEN** a source file contains multiple longhand classes that can be expressed as a single shorthand (e.g. `pt-4 pr-4 pb-4 pl-4`)
- **THEN** ESLint SHALL report a warning and `eslint --fix` SHALL replace them with the shorthand form (e.g. `p-4`)
