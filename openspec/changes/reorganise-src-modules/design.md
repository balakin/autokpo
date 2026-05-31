## Context

`apps/app/src/` currently has 13 loose files at the root alongside `main.tsx`. These include utilities (`belgrade-date.ts`, `formatters.ts`), router wiring (`router.tsx`, `app-routes.tsx`, `route-lazy-components.tsx`), app bootstrap wrappers (`signed-in-app.tsx`, `signed-in-encryption-boundary.tsx`), and an error boundary for lazy chunks (`lazy-chunk-error-boundary.tsx`, `lazy-chunk-error.ts`). Tests for these files live in a `src/__tests__/` root folder, which is inconsistent with every other module in the codebase (which co-locate tests in `<module>/__tests__/`).

The `src/utils/` module already exists and already follows the flat + `__tests__/` pattern. The convention just needs to be extended, codified, and applied to the remaining root files.

## Goals / Non-Goals

**Goals:**

- Move all loose root files (except `index.css`, `main.tsx`, `constants.ts`, `vite-env.d.ts`) into named modules
- Extend `src/utils/` with the utility and error boundary files
- Create `src/router/` as a new module for all routing wiring and app bootstrap
- Delete `src/__tests__/` and redistribute its tests to owning modules
- Add `src/router/index.ts` as a public barrel so `main.tsx` imports from `'./router'`
- Codify the flat-module convention in `CLAUDE.md` and `AGENTS.md`

**Non-Goals:**

- Restructuring existing modules (`crdt/`, `auth/`, `books/`, etc.)
- Adding new functionality
- Changing any runtime behavior

## Decisions

### `lazy-chunk-error-boundary` goes in `utils/`, not `router/`

The error boundary and its helper are generic infrastructure — they detect chunk-load failures and render a recovery UI. They have no router-specific imports and could theoretically be reused outside routing contexts. Placing them in `utils/` keeps `router/` focused on routing logic and avoids polluting it with UI infrastructure.

**Alternative considered**: put in `router/` since that's the only caller today. Rejected because the pattern is generic and `utils/` already has a test infrastructure in place.

### `signed-in-app.tsx` and `signed-in-encryption-boundary.tsx` go in `router/`

Both files are thin wrappers used exclusively inside `app-routes.tsx` to compose auth, encryption, and crdt contexts around the route tree. They have no independent use outside of routing. Keeping them in `router/` keeps the route tree self-contained.

**Alternative considered**: a separate `bootstrap/` module. Rejected as over-engineering for two files.

### `router/index.ts` as the public entrypoint barrel

`main.tsx` needs `createRouter`. An `index.ts` barrel exports just the public surface (`createRouter`, `appRoutes`) and keeps internal files (`signed-in-app.tsx`, etc.) as implementation details. This follows the convention that modules can have an optional `index.ts`.

### `src/__tests__/` is deleted, not migrated to a new home

The root test folder is an anti-pattern — tests should live next to the code they test. All four test files map cleanly to owning modules (`belgrade-date.spec.ts` → `utils/__tests__/`, `formatters.spec.ts` → `utils/__tests__/`, `router.spec.tsx` → `router/__tests__/`, `lazy-chunk-error-boundary.spec.tsx` → `utils/__tests__/`).

## Risks / Trade-offs

- **Import churn** — roughly 15–20 files need import path updates. Risk: missed import causes build error. Mitigation: run `pnpm -s build` after all moves to catch any stragglers via TypeScript errors.
- **Test alias resolution** — `tsconfig.tests.json` and `vite.config.ts` define `src/` and `tests/` aliases. Moved test files still resolve via the `src/` alias, so no config changes expected. Mitigation: run the full test suite after moves.
- **`vite-env.d.ts` at root** — leaving this at the root is intentional; it's a Vite ambient declaration, not a module file, and has no tests.

## Migration Plan

1. Move utility files into `src/utils/` and update their imports across the codebase
2. Move utility tests from `src/__tests__/` into `src/utils/__tests__/`
3. Create `src/router/` and move router + bootstrap files there
4. Create `src/router/index.ts` barrel
5. Move router tests from `src/__tests__/` into `src/router/__tests__/`
6. Delete `src/__tests__/`
7. Update `CLAUDE.md` and `AGENTS.md` with the flat-module convention
8. Run build + full test suite to verify

No rollback strategy needed — this is a pure refactor with no data or API changes.
