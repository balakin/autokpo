## 1. Move utility files into src/utils/

- [x] 1.1 Move `src/belgrade-date.ts` → `src/utils/belgrade-date.ts`
- [x] 1.2 Move `src/formatters.ts` → `src/utils/formatters.ts`
- [x] 1.3 Move `src/lazy-chunk-error-boundary.tsx` → `src/utils/lazy-chunk-error-boundary.tsx`
- [x] 1.4 Move `src/lazy-chunk-error.ts` → `src/utils/lazy-chunk-error.ts`
- [x] 1.5 Update all import paths across the codebase that referenced the moved utility files

## 2. Move utility tests into src/utils/**tests**/

- [x] 2.1 Move `src/__tests__/belgrade-date.spec.ts` → `src/utils/__tests__/belgrade-date.spec.ts`
- [x] 2.2 Move `src/__tests__/formatters.spec.ts` → `src/utils/__tests__/formatters.spec.ts`
- [x] 2.3 Move `src/__tests__/lazy-chunk-error-boundary.spec.tsx` → `src/utils/__tests__/lazy-chunk-error-boundary.spec.tsx`
- [x] 2.4 Update import paths inside the moved test files to reflect new locations

## 3. Create src/router/ module

- [x] 3.1 Create `src/router/` directory and move `src/router.tsx` → `src/router/router.tsx`
- [x] 3.2 Move `src/app-routes.tsx` → `src/router/app-routes.tsx`
- [x] 3.3 Move `src/route-lazy-components.tsx` → `src/router/route-lazy-components.tsx`
- [x] 3.4 Move `src/signed-in-app.tsx` → `src/router/signed-in-app.tsx`
- [x] 3.5 Move `src/signed-in-encryption-boundary.tsx` → `src/router/signed-in-encryption-boundary.tsx`
- [x] 3.6 Update relative imports inside all moved router files to reference each other at the new paths
- [x] 3.7 Create `src/router/index.ts` that re-exports `createRouter` and `appRoutes`

## 4. Move router tests and clean up root **tests**

- [x] 4.1 Move `src/__tests__/router.spec.tsx` → `src/router/__tests__/router.spec.tsx`
- [x] 4.2 Update import paths inside the moved router test file
- [x] 4.3 Delete the now-empty `src/__tests__/` directory

## 5. Update guidance docs

- [x] 5.1 Add the flat-module convention section to `apps/app/CLAUDE.md` (module folder per concern, flat files, `__tests__/` exception, optional `index.ts`, `src/` root reservation, no `src/__tests__/`)
- [x] 5.2 Update `apps/app/AGENTS.md` to be identical to the updated `CLAUDE.md`

## 6. Verify

- [x] 6.1 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:'` — expect no errors
- [x] 6.2 Run `cd apps/app && pnpm -s test --reporter=verbose | tail -n 60` — expect all tests pass
