## Why

The `worker/` folder grew organically and no longer follows a consistent layout: all tests sit in a single root `__tests__/`, files are scattered at the root instead of grouped by concern, and `middleware/` uses the wrong plural form. The `src/` reorganisation (see `src-module-convention`) established a clean pattern — worker should mirror it so the codebase has one mental model for both halves of the app.

## What Changes

- **Rename** `middleware/` → `middlewares/`
- **Rename** `payload-limits.ts` → `constants.ts` (update all import paths)
- **Move** `i18n.ts` → `i18n/i18n.ts`; `locales/` stays as a sibling folder at the worker root (mirrors `src/locales/`)
- **Move** auth-related root files → `auth/` module: `auth.ts`, `auth-options.ts`, `disposable-email-blocklist.ts`, `send-otp-email.tsx`, `send-account-deleted-email.tsx`
- **Extract** app assembly out of `main.ts` → new `app/app.ts` module; `main.ts` becomes a thin re-export
- **Scatter** `worker/__tests__/` → each module's own `__tests__/` subfolder
- **Update** all import paths inside `worker/` (and any `src/` files that import from `worker/`)
- **Update** `apps/app/CLAUDE.md` and `apps/app/AGENTS.md` to document the worker module layout convention
- `db/` is **untouched** (exception — it has its own nested structure for migrations and schema)
- `env.d.ts`, `context.ts`, `constants.ts`, and `main.ts` remain at the `worker/` root

## Capabilities

### New Capabilities

- `worker-module-convention`: Rules for organising the `worker/` directory — one concern per folder, flat files, `__tests__` co-located, root reserved for `main.ts` / `env.d.ts` / `context.ts` / `constants.ts`, `db/` is the one structural exception.

### Modified Capabilities

_(none — no requirement or behaviour changes, pure structural refactor)_

## Impact

- All files under `worker/` except `db/` are moved or renamed
- Import paths updated throughout `worker/`; any `src/` imports from `worker/` updated too
- `CLAUDE.md` and `AGENTS.md` gain a worker module layout section
- No runtime behaviour changes; all existing tests continue to pass (path updates only)
