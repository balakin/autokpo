## Context

`worker/` has grown without a structural convention: tests accumulate in a single root `__tests__/`, auth-related files sit loose at the root, `middleware/` is singular while the src side uses plural conventions, and `payload-limits.ts` carries a narrow name for what are shared constants. The `src/` side was recently reorganised under `src-module-convention`; this change applies the same discipline to `worker/`.

The worker is a Cloudflare Worker built with Hono. Its concerns are: entry point (`main.ts`), app wiring (`app/`), authentication (`auth/`), request middlewares (`middlewares/`), API routes (`routes/`), localisation (`i18n/` + `locales/`), shared constants (`constants.ts`), types (`context.ts`, `env.d.ts`), and the D1 database layer (`db/`).

## Goals / Non-Goals

**Goals:**

- One mental model for both `src/` and `worker/`: folder-per-concern, flat files, `__tests__` co-located
- All tests pass after the move (import path updates only)
- `CLAUDE.md` / `AGENTS.md` document the worker layout so agents follow it going forward

**Non-Goals:**

- No logic or behaviour changes — pure file moves and renames
- No changes to `worker/db/` (structural exception: migrations need nested folders)
- No introduction of barrel `index.ts` files

## Decisions

### Module boundaries

| Module         | Files                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `app/`         | `app.ts` (extracted from `main.ts`)                                                                                   |
| `auth/`        | `auth.ts`, `auth-options.ts`, `disposable-email-blocklist.ts`, `send-otp-email.tsx`, `send-account-deleted-email.tsx` |
| `i18n/`        | `i18n.ts`                                                                                                             |
| `locales/`     | `en.po`, `ru.po`, `sr-Latn.po` (sibling to `i18n/`, mirrors `src/locales/`)                                           |
| `middlewares/` | `auth.ts`, `csrf.ts`, `payload-limit.ts`, `rate-limit.ts`                                                             |
| `routes/`      | `e2ee.ts`, `exchange-rates.ts`, `sync.ts`                                                                             |
| worker root    | `main.ts`, `env.d.ts`, `context.ts`, `constants.ts`                                                                   |
| `db/`          | untouched                                                                                                             |

**Why extract `app/app.ts`?** `main.ts` is the Cloudflare Worker entry point (exports `default`). Mixing app-wiring logic in there makes it untestable in isolation. Extracting `app.ts` gives tests a clean import surface without touching the Worker export contract. `main.ts` becomes a one-liner: `export { default } from './app/app'` (or re-export pattern).

**Why keep `context.ts` and `constants.ts` at the root?** They are consumed by nearly every module (`context.ts` by all middlewares and routes; `constants.ts` by routes, middlewares, and even `db/schema/`). Placing them in any single module would create an awkward one-way dependency. Root-level placement is the same decision `src/` makes for `constants.ts`.

**Why `middlewares/` (plural)?** Matches `src/` naming style and natural English for a folder that holds multiple middleware files.

**Why rename `payload-limits.ts` → `constants.ts`?** The file holds size constants used across auth, routes, and DB schema — not just payload limits. The broader name matches the root `constants.ts` in `src/`.

### Test distribution

Each module gets a `__tests__/` subfolder. The current root `__tests__/` is dissolved:

| Old path                                       | New path                                            |
| ---------------------------------------------- | --------------------------------------------------- |
| `__tests__/main.spec.ts`                       | `app/__tests__/app.spec.ts`                         |
| `__tests__/csrf.spec.ts`                       | `middlewares/__tests__/csrf.spec.ts`                |
| `__tests__/disposable-email-blocklist.spec.ts` | `auth/__tests__/disposable-email-blocklist.spec.ts` |
| `__tests__/email-otp-auth.spec.ts`             | `auth/__tests__/email-otp-auth.spec.ts`             |
| `__tests__/e2ee.spec.ts`                       | `routes/__tests__/e2ee.spec.ts`                     |
| `__tests__/exchange-rates.spec.ts`             | `routes/__tests__/exchange-rates.spec.ts`           |
| `__tests__/sync.spec.ts`                       | `routes/__tests__/sync.spec.ts`                     |

`app.spec.ts` tests the assembled app (was `main.spec.ts`). Its import of `app` changes from `'../main'` to `'../app'` (or similar); test logic is unchanged.

## Risks / Trade-offs

- **Import path churn** → Every file in `worker/` needs its import paths updated. Mitigation: update and run `pnpm -s test --reporter=verbose` + `pnpm -s build` to verify before committing.
- **`db/schema/` imports `constants.ts`** → Path changes from `../../payload-limits` to `../../constants`. Low risk — straightforward find-and-replace.
- **Wrangler / build tooling** → `wrangler.jsonc` references the worker entry point. Verify it still points to `worker/main.ts` (unchanged). No `generate:worker-types` needed since `env.d.ts` is not moving.

## Open Questions

_(none — structure fully decided in explore mode)_
