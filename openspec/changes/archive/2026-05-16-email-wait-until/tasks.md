## 1. Thread ExecutionContext through auth layer

- [x] 1.1 Update `authHandler` in `worker/auth.ts` to accept `executionCtx: ExecutionContext` as a third parameter and pass it to `getAuth`
- [x] 1.2 Update `getAuth` in `worker/auth.ts` to accept and forward `executionCtx` to `getAuthOptions`
- [x] 1.3 Add `executionCtx: ExecutionContext` to `AuthOptionsInput` in `worker/auth-options.ts`
- [x] 1.4 Replace `await accountDeletedEmailConfig.sendEmail(...)` with `executionCtx.waitUntil(accountDeletedEmailConfig.sendEmail(...))` in `auth-options.ts`
- [x] 1.5 Replace `await emailOtpConfig.sendEmail(...)` with `executionCtx.waitUntil(emailOtpConfig.sendEmail(...))` in `auth-options.ts`
- [x] 1.6 Update `main.ts` to pass `c.executionCtx` to `authHandler`

## 2. Update tests

- [x] 2.1 Add a mock `ExecutionContext` (with a no-op `waitUntil`) to the test helpers or inline in `email-otp-auth.spec.ts`
- [x] 2.2 Pass the mock `executionCtx` wherever `authHandler` is called in the test file
- [x] 2.3 Run `cd apps/app && pnpm -s test --reporter=verbose` and confirm all tests pass
