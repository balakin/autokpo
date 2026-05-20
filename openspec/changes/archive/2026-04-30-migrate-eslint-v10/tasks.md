## 1. Update Dependencies

- [x] 1.1 Bump `eslint` to `^10.2.1` in root `package.json`
- [x] 1.2 Bump `@eslint/js` to `^10.0.1` in root `package.json`
- [x] 1.3 Run `pnpm install` to refresh lockfile

## 2. Fix New Lint Errors

- [x] 2.1 Run `pnpm -s eslint` to identify all new errors from ESLint v10
- [x] 2.2 Fix `eslint:recommended` new rule errors (`no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`) — no errors found
- [x] 2.3 If error volume is unexpectedly high, document which rules were temporarily disabled and why — not applicable

## 3. Verify

- [x] 3.1 Confirm `pnpm -s eslint` passes with zero errors
- [x] 3.2 Confirm `pnpm -s test` passes (no runtime regressions) — 468 passed, 0 failed
- [x] 3.3 Confirm `pnpm -s build` passes (type-checking unaffected)
