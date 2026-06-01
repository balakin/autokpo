## 1. Rename and move root-level files

- [x] 1.1 Rename `worker/payload-limits.ts` → `worker/constants.ts`
- [x] 1.2 Update all imports of `payload-limits` across `worker/` and `worker/db/schema/` to point to `constants`
- [x] 1.3 Move `worker/i18n.ts` → `worker/i18n/i18n.ts` and update its imports

## 2. Rename middleware/ → middlewares/

- [x] 2.1 Rename `worker/middleware/` → `worker/middlewares/`
- [x] 2.2 Update all imports of `./middleware/` or `../middleware/` throughout `worker/` to `./middlewares/` / `../middlewares/`

## 3. Create auth/ module

- [x] 3.1 Create `worker/auth/` and move `auth.ts`, `auth-options.ts`, `disposable-email-blocklist.ts`, `send-otp-email.tsx`, `send-account-deleted-email.tsx` into it
- [x] 3.2 Update intra-auth imports (files within `auth/` that import each other)
- [x] 3.3 Update all imports of these files from outside `auth/` (routes, middlewares, db, main)

## 4. Create app/ module and slim down main.ts

- [x] 4.1 Create `worker/app/app.ts` containing the Hono app assembly (routes + middleware wiring) extracted from `main.ts`
- [x] 4.2 Rewrite `worker/main.ts` to be a thin re-export of the app from `./app/app`
- [x] 4.3 Update imports inside `app/app.ts` to use new module paths (`./auth/`, `./middlewares/`, `./routes/`, `./constants`, `./context`)

## 5. Distribute tests into module **tests**/ folders

- [x] 5.1 Move `worker/__tests__/main.spec.ts` → `worker/app/__tests__/app.spec.ts` and update imports
- [x] 5.2 Move `worker/__tests__/csrf.spec.ts` → `worker/middlewares/__tests__/csrf.spec.ts` and update imports
- [x] 5.3 Move `worker/__tests__/disposable-email-blocklist.spec.ts` → `worker/auth/__tests__/disposable-email-blocklist.spec.ts` and update imports
- [x] 5.4 Move `worker/__tests__/email-otp-auth.spec.ts` → `worker/auth/__tests__/email-otp-auth.spec.ts` and update imports
- [x] 5.5 Move `worker/__tests__/e2ee.spec.ts` → `worker/routes/__tests__/e2ee.spec.ts` and update imports
- [x] 5.6 Move `worker/__tests__/exchange-rates.spec.ts` → `worker/routes/__tests__/exchange-rates.spec.ts` and update imports
- [x] 5.7 Move `worker/__tests__/sync.spec.ts` → `worker/routes/__tests__/sync.spec.ts` and update imports
- [x] 5.8 Delete the now-empty `worker/__tests__/` directory

## 6. Verify

- [x] 6.1 Run `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120` — all tests pass
- [x] 6.2 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40` — no type errors

## 7. Update agent guidance

- [x] 7.1 Add a worker module layout section to `apps/app/CLAUDE.md` documenting the convention (root reserved for `main.ts`/`env.d.ts`/`context.ts`/`constants.ts`, `db/` exception, `__tests__` co-located, `middlewares/` plural)
- [x] 7.2 Apply the same update to `apps/app/AGENTS.md`
