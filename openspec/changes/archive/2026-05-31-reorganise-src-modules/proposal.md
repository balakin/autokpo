## Why

The `src/` root has accumulated 13 loose files with no consistent home — utilities, router wiring, error boundaries, and app bootstrap code all sit flat alongside `main.tsx`. This makes it unclear where new files belong and where to look for existing ones. Establishing explicit module boundaries and a flat-module convention enforces co-location and gives agents and developers a clear mental model going forward.

## What Changes

- Move `belgrade-date.ts` and `formatters.ts` into the existing `src/utils/` module
- Move `lazy-chunk-error-boundary.tsx` and `lazy-chunk-error.ts` into `src/utils/`
- Create new `src/router/` module containing: `router.tsx`, `app-routes.tsx`, `route-lazy-components.tsx`, `signed-in-app.tsx`, `signed-in-encryption-boundary.tsx`
- Delete `src/__tests__/` root folder; move its four test files into the owning module's `__tests__/` subfolder
- Update all import paths affected by the moves
- Add `src/router/index.ts` as the public entrypoint barrel for the router module
- Update `CLAUDE.md` and `AGENTS.md` to document the flat-module convention and ban `src/__tests__/`

## Capabilities

### New Capabilities

- `src-module-convention`: Flat-module structure rule for `src/` — each concern in its own folder, files flat within the folder, `__tests__/` as the one allowed subfolder, optional `index.ts` public entrypoint, `src/` root reserved for `index.css`, `main.tsx`, `constants.ts`, `vite-env.d.ts`

### Modified Capabilities

- `ai-agent-guidance`: Add the flat-module convention rule and the `src/__tests__/` ban to agent-facing docs (`CLAUDE.md` and `AGENTS.md`)

## Impact

- All consumers of `../../belgrade-date`, `../../formatters`, `../router`, etc. need import path updates (roughly 15–20 files)
- `main.tsx` import changes from `'./router'` to `'./router'` (same, via index barrel)
- No runtime behavior changes — pure file moves and import rewrites
- `vite.config.ts` alias for `tests/` may reference moved spec files — verify
- `tsconfig.tests.json` path aliases — verify they still resolve after moves
