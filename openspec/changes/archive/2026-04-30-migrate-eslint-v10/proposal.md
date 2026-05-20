## Why

ESLint v10 has been released (latest: 10.2.1). We are currently on v9.39.4. All plugins in our config already declare ESLint v10 compatibility, and our flat-config setup makes us well-positioned for the upgrade. Migrating now keeps us current and avoids accumulating technical debt.

## What Changes

- **BREAKING** Bump `eslint` from `^9.39.4` to `^10.2.1`
- **BREAKING** Bump `@eslint/js` from `^9.39.4` to `^10.0.1`
- Fix new lint errors from ESLint v10's 3 new `eslint:recommended` rules: `no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`

## Capabilities

### New Capabilities

None. This is a toolchain upgrade with no new product capabilities.

### Modified Capabilities

None. No spec-level behavior changes.

## Impact

- **Dependencies**: Root `package.json` devDependencies only (`eslint`, `@eslint/js`)
- **Config**: No changes needed
- **Source code**: Potential fixes for new lint errors across the codebase
- **CI**: No workflow changes; `pnpm lint` continues to work
- **Node.js**: Already on Node 24, which satisfies ESLint v10 requirements (>=20.19 or >=22.13 or >=24)
- **Jiti**: Already on `^2.6.1`, which satisfies ESLint v10 requirements (>=2.2.0)
