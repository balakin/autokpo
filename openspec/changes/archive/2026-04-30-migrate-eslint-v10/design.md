## Context

We are on ESLint v9.39.4 with a flat-config setup (`eslint.config.ts`). All plugins already support ESLint v10. The upgrade path is straightforward because:

- We already use flat config (v10 drops `.eslintrc` entirely)
- Node 24 and Jiti ^2.6.1 already satisfy v10 requirements
- No `eslint-env` comments or legacy patterns exist in the codebase

`@eslint-react/eslint-plugin` stays on v4.2.3, which already supports ESLint ^10. No plugin changes needed.

## Goals / Non-Goals

**Goals:**

- Upgrade ESLint and related packages to latest stable versions
- Keep the lint config valid and functional
- Fix or suppress any new lint errors introduced by the upgrade
- Maintain zero-downtime — this is a dev-time change only

**Non-Goals:**

- Restructuring the lint config architecture
- Adding new lint rules beyond what the upgraded presets provide
- Changing Prettier configuration
- Modifying CI/CD workflows

## Decisions

### Keep `@eslint-react` on v4.2.3

- **Rationale**: v4.2.3 already declares `eslint: ^10.0.0` peer support. v5.6.4 was released only hours ago and is too fresh for production use.
- **Alternative**: Bump to v5.6.4. Rejected — too recent, unnecessary risk.

### Fix new lint errors rather than disable new rules

- **Rationale**: The new ESLint v10 `eslint:recommended` rules (`no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`) are reasonable defaults. Fixing the code is better than suppressing.
- **Alternative**: Disable all new rules in config. Rejected — we'd lose the value of the upgrade.

## Risks / Trade-offs

| Risk                             | Mitigation                                                          |
| -------------------------------- | ------------------------------------------------------------------- |
| New lint errors block CI         | Run `pnpm lint` locally after upgrade; fix errors before committing |
| Plugin version incompatibilities | Verified `@eslint-react` v4.2.3 declares `eslint: ^10` support      |

## Migration Plan

1. Update `package.json` devDependencies (`eslint`, `@eslint/js`)
2. Run `pnpm install` to refresh lockfile
3. Run `pnpm lint` to discover new errors
4. Fix new errors across codebase
5. Verify `pnpm lint` passes
6. Verify `pnpm test` still passes (no runtime impact expected)
