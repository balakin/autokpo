## 1. Install dependency

- [x] 1.1 Add `eslint-plugin-better-tailwindcss` to root `package.json` devDependencies and run `pnpm install`

## 2. Configure ESLint

- [x] 2.1 Import `eslint-plugin-better-tailwindcss` in `eslint.config.ts`
- [x] 2.2 Add plugin settings block (`settings['better-tailwindcss'].cwd = './apps/app'`) scoped to `apps/app/**/*.{ts,tsx}`
- [x] 2.3 Add correctness rules as errors: `no-unknown-classes`, `no-conflicting-classes`, `no-duplicate-classes`, `no-deprecated-classes`
- [x] 2.4 Add stylistic rules as warnings: `enforce-canonical-classes`, `enforce-shorthand-classes`, `enforce-consistent-class-order`, `enforce-consistent-variant-order`, `enforce-consistent-variable-syntax`, `enforce-consistent-important-position`

## 3. Fix existing violations

- [x] 3.1 Run `pnpm eslint apps/app --fix` to autofix all resolvable violations in source files
- [x] 3.2 Run `pnpm eslint apps/app` and verify zero errors; investigate and resolve any remaining errors manually

## 4. Verify

- [x] 4.1 Run full test suite (`cd apps/app && pnpm -s test --reporter=verbose | tail -n 40`) and confirm no regressions
- [x] 4.2 Run build (`cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 20`) and confirm clean
