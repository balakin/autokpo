## 1. Env Var Rename

- [x] 1.1 Rename `BETTER_AUTH_URL` to `APP_URL` in `wrangler.jsonc` (both default and production envs)
- [x] 1.2 Update `worker/auth.ts` to read `env.APP_URL`
- [x] 1.3 Regenerate `worker-configuration.d.ts` via `pnpm generate:worker-types`

## 2. CSRF Middleware

- [x] 2.1 Create `worker/csrf.ts` with origin-check middleware (skip safe methods; reject cookie-bearing mutations with absent/mismatched Origin)
- [x] 2.2 Wire `app.use('*', csrfMiddleware())` in `worker/main.ts`

## 3. Test Helpers

- [x] 3.1 Add `Origin: TEST_APP_URL` to `makeAuthHeaders` in `tests/worker/request-helpers.ts` so all authenticated test requests carry the expected origin
- [x] 3.2 Rename `TEST_BETTER_AUTH_URL` → `TEST_APP_URL` in `tests/worker/auth-helpers.ts` and update all import sites

## 4. Deploy

- [x] 4.1 Rename `BETTER_AUTH_URL` → `APP_URL` secret/var in Cloudflare Workers dashboard (or via `wrangler secret`) before deploying
