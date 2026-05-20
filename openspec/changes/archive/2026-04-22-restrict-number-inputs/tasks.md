## 1. Inline digit restrictions

- [x] 1.1 Add `digitsOnly` to `src/formatters.ts`, update three digit fields in `src/entity-profiles/entity-profile-form.tsx` with `inputMode="numeric"`, `maxLength`, and digit-stripping `onChange`.
- [x] 1.2 Verify existing entity-profile tests still pass.

## 2. Polish & Verify

- [x] 2.1 Run `pnpm -s lint:fix` and resolve any remaining lint/type errors.
- [x] 2.2 Run full test suite (`pnpm -s test`) and confirm all tests pass.
- [x] 2.3 Run `pnpm -s build` and confirm the production build succeeds.
