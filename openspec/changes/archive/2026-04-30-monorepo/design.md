## Context

AutoKPO is currently a single-package pnpm project with a Vite React PWA frontend and a Cloudflare Worker backend co-located in `worker/`. The project uses `pnpm-workspace.yaml` (with config only, no `packages:` declarations). All source, config, and tooling live at the repository root. The goal is to restructure into a Turborepo monorepo so that future projects (website, email templates, shared packages) can be added without disrupting the existing app.

Current directory layout (root-level):

- `src/` — React app
- `worker/` — Cloudflare Worker (built via `@cloudflare/vite-plugin`)
- `tests/` — Test helpers
- `scripts/` — `run-tests.ts`
- Config files: `vite.config.ts`, `vitest.*.config.ts`, `wrangler.jsonc`, `drizzle.config.ts`, `lingui.config.ts`, `tsconfig.json` + project refs, `eslint.config.ts`, `commitlint.config.ts`

## Goals / Non-Goals

**Goals:**

- Establish Turborepo + pnpm workspace monorepo infrastructure
- Move the entire existing app into `apps/app/` as `@autokpo/app` with zero internal code changes (only path adjustments in config files)
- Keep root-level tooling (ESLint, commitlint, Husky, Prettier) working from the repository root
- Enable adding future apps (`apps/website`, `apps/emails`) and packages (`packages/ui`, `packages/config-eslint`) without restructuring again
- Verify that `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm dev` all work from root via turbo delegation

**Non-Goals:**

- Splitting the Cloudflare Worker into a separate `apps/api/` package (it stays inside `apps/app/`)
- Extracting shared packages (`packages/ui`, `packages/config-*`) — left for future changes
- Creating any new apps (website, emails) — left for future changes
- Changing the app's internal architecture, dependencies, or build pipeline

## Decisions

### D1: Turborepo for task orchestration

**Decision**: Use Turborepo as the monorepo task runner.

**Rationale**: Turborepo provides caching, parallel execution, and dependency-aware task ordering out of the box. It's the canonical choice for pnpm workspaces. Alternatives: Nx (heavier, more opinionated), raw pnpm scripts (no caching, manual orchestration).

### D2: `apps/` + `packages/` workspace layout

**Decision**: Use `apps/app/` for the existing application, `packages/` (empty) for future shared code, root remains the orchestrator.

```
apps/app/      — @autokpo/app (existing app, moved as-is)
packages/       — future shared libs (empty for now)
```

**Rationale**: Canonical Turborepo structure. Clear separation between deployable apps and shared libraries. Adding new apps/packages is additive.

### D3: App moves as a unit — no internal restructuring

**Decision**: Move `src/`, `worker/`, `tests/`, `public/`, `scripts/`, and all app-specific config files into `apps/app/` without changing internal code. Only config paths (import references, relative paths) change.

**Rationale**: Minimizes risk. The app works today; restructuring internals can happen incrementally later.

### D4: Root `tsconfig.json` for root config files only

**Decision**: Create a new standalone root `tsconfig.json` that covers only `eslint.config.ts` and `commitlint.config.ts`. No project references at root. The app's project-reference chain moves to `apps/app/tsconfig.json`.

**Rationale**: Root config files need type-checking in the editor. The app's build happens inside `apps/app/` via its own project references. Keeping them separate avoids cross-contamination and means `tsc -b` only runs in the app workspace.

### D5: ESLint config stays at root with adjusted globs

**Decision**: `eslint.config.ts` remains at root. File globs update from `src/**` to `apps/app/src/**`.

**Rationale**: ESLint with project-wide rules (import ordering, Yjs restrictions) applies across the whole repo. When shared packages exist, they'll pick up the same base config. Moving it to `apps/app/` would mean duplicating or creating a shared eslint config prematurely.

### D6: Package naming — `@autokpo/app`

**Decision**: The app package is named `@autokpo/app`.

**Rationale**: Scoped names are standard for monorepos. `autokpo` matches the repo name. Future packages would follow `@autokpo/ui`, `@autokpo/config-eslint`, etc.

### D7: Root `package.json` — minimal orchestrator

**Decision**: Root `package.json` keeps only root-level dev dependencies and scripts that delegate to `turbo run`.

Root devDependencies: `turbo`, `eslint` + plugins, `prettier` + `eslint-config-prettier`, `@commitlint/*`, `husky`, `lint-staged`, `typescript`, `typescript-eslint`, `jiti`

App devDependencies and dependencies: everything else moves to `apps/app/package.json`.

**Rationale**: Clean separation. Root doesn't need React, Vite, Vitest, or any app-specific dependency.

### D8: Husky hooks use `turbo run`

**Decision**: Pre-commit and pre-push hooks use `turbo run` for app-specific tasks (`i18n:extract`, `check:worker-types`, `build`, `test`).

Pre-commit:

```
pnpm lint-staged
turbo run i18n:extract
git add apps/app/src/locales/
turbo run check:worker-types
```

Pre-push: unchanged (`pnpm build && pnpm test` delegates through root scripts).

**Rationale**: Consistent with the monorepo model. Turbo handles task routing to the correct package.

## Risks / Trade-offs

- **Git history clarity**: `git mv` preserves history but makes file-level diffs more verbose (path prefix changes on every line). → Acceptable trade-off; `git log --follow` still works per-file.
- **ESLint config coupling**: Root eslint config references `apps/app/src/**` paths, creating a dependency on the app's location. → Mitigated by extracting to `packages/config-eslint` when a second consumer appears.
- **CI/CD changes**: GitHub Actions must now run `pnpm install` from root; commands like `pnpm build` delegate via turbo. → Turbo caches build outputs, potentially making CI faster.
- **Wrangler path assumptions**: `wrangler.jsonc` uses `./worker/main.ts` and `./worker/db/migrations` — these remain valid since the file moves with the app. → No change needed.
- **Vitest path aliases**: `vitest.app.config.ts` and `vitest.worker.config.ts` use `fileURLToPath(new URL(...))` — these remain valid as relative paths from within `apps/app/`. → No change needed.
- **Lingui `<rootDir>`**: `lingui.config.ts` uses `<rootDir>/src/locales/{locale}` — `<rootDir>` resolves to the package root, which becomes `apps/app/`. → No change needed.

## Migration Plan

1. Create `apps/app/` and `packages/` directories
2. `git mv` all app files/dirs into `apps/app/`
3. Create root `tsconfig.json` (eslint + commitlint only)
4. Create root `turbo.json` with task pipeline
5. Split `package.json` — root gets orchestrator deps, `apps/app/` gets all app deps
6. Update `pnpm-workspace.yaml` with `packages: ["apps/*", "packages/*"]`
7. Update `eslint.config.ts` globs
8. Update Husky pre-commit hook
9. Add `.turbo/` to `.gitignore`
10. `pnpm install` to regenerate lockfile
11. Verify: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm dev`

**Rollback**: Reverse the `git mv` operations, restore original `package.json`, remove `turbo.json`, remove root `tsconfig.json`, restore `pnpm-workspace.yaml`. Everything is reversible since no internal app code changes.
