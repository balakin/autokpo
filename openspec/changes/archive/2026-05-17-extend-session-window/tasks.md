## 1. Extend Session Window

- [x] 1.1 In `apps/app/worker/auth-options.ts`, add `expiresIn: 60 * 24 * 60 * 60` and `updateAge: 7 * 24 * 60 * 60` to the `session` config object

## 2. Remove SignedOutCleaner

- [x] 2.1 Delete `apps/app/src/auth/signed-out-cleaner.tsx`
- [x] 2.2 Delete `apps/app/src/auth/__tests__/signed-out-cleaner.spec.tsx`
- [x] 2.3 Remove the `SignedOutCleaner` import and JSX usage from `apps/app/src/router.tsx`

## 3. Verify

- [x] 3.1 Run `cd apps/app && pnpm -s test --reporter=verbose --changed | tail -n 60` — confirm no regressions
- [x] 3.2 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 20` — confirm clean build
