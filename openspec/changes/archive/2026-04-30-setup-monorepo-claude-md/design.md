## Context

The monorepo migration (2026-04-30) moved the app into `apps/app/` as `@autokpo/app`. The root `CLAUDE.md` and `AGENTS.md` were not updated and still describe a flat repo: commands reference `pnpm dev`/`pnpm test` without turbo context, paths reference `src/` instead of `apps/app/src/`, and there is no `apps/app/CLAUDE.md`.

Claude Code loads `CLAUDE.md` files hierarchically: files above the cwd load at launch; subdirectory files load on demand when Claude reads files in that directory. This means root `CLAUDE.md` is always present and `apps/app/CLAUDE.md` loads automatically when working inside the app — no manual reference needed between them.

`AGENTS.md` is the equivalent file for OpenCode. Both files carry identical content and are maintained as manual duplicates (not symlinks) for maximum compatibility with each tool's loading mechanism.

## Goals / Non-Goals

**Goals:**

- Root `CLAUDE.md` covers what is true across the whole repo: monorepo layout, how to invoke tasks (turbo / `--filter`), root-level commands, Conventional Commits, Node/pnpm requirements, and abstract token-efficiency principles
- `apps/app/CLAUDE.md` covers everything specific to the app: description, scripts, module layout, and all coding conventions
- No content is duplicated between root and app files — Claude loads both when working inside the app
- `AGENTS.md` (root) mirrors root `CLAUDE.md`; `apps/app/AGENTS.md` mirrors `apps/app/CLAUDE.md`

**Non-Goals:**

- Symlinks between `CLAUDE.md` and `AGENTS.md` — kept as separate files for tool compatibility certainty
- `packages/` guidance — no shared packages exist yet, deferred
- CI or tooling changes — documentation only

## Decisions

### D1: Root CLAUDE.md holds abstract token-efficiency principles, not concrete app commands

**Decision**: Token-efficient command patterns live in root `CLAUDE.md` as tool-agnostic principles. App `CLAUDE.md` lists available scripts without repeating "how to run them efficiently."

**Rationale**: Principles (prefer JSON reporters, pipe to jq, scope with `--changed`) apply to any package in the repo. Keeping them at root avoids duplication when more apps are added.

### D2: Lint chain rule stated explicitly at root

**Decision**: Root `CLAUDE.md` explicitly states: `pnpm lint` and `pnpm lint:fix` are chained commands — never pipe them. For inspection, use `pnpm eslint` and `pnpm prettier` separately.

**Rationale**: AI agents repeatedly attempt to pipe the combined lint command, which fails. An explicit prohibition at the root (where lint commands are invoked) prevents this across all packages. Using `pnpm eslint` / `pnpm prettier` (not `pnpm exec eslint`) is cleaner and consistent with pnpm conventions.

### D3: App CLAUDE.md lists commands as runnable via --filter from root

**Decision**: `apps/app/CLAUDE.md` documents scripts with a note that they are invocable from root as `pnpm --filter @autokpo/app <script>`, without repeating the full invocation patterns.

**Rationale**: The root file already establishes the `--filter` pattern. The app file is the reference for what scripts exist and what they do; the root file is the reference for how to call them.

### D4: AGENTS.md duplicated manually, not symlinked

**Decision**: `AGENTS.md` and `apps/app/AGENTS.md` are kept as separate files with identical content to their `CLAUDE.md` counterparts. Updated together whenever guidance changes.

**Rationale**: Symlink behavior with tool-specific file loaders is uncertain. Duplication is a known quantity. The files are small and change infrequently, so sync overhead is acceptable.

## Risks / Trade-offs

- **Drift between CLAUDE.md and AGENTS.md**: Manual duplication means they can silently diverge. → Mitigated by always editing both in the same commit; no tooling required.
- **Drift between root and app CLAUDE.md**: If app-specific sections accumulate at root over time. → The split boundary is clearly defined in this design; enforced by convention.
- **On-demand loading of apps/app/CLAUDE.md**: Claude only loads it when it reads a file in `apps/app/`. When working purely at the root (editing root config files), app conventions won't be in context. → Acceptable: root-only work doesn't need app-specific rules.

## Migration Plan

1. Rewrite root `CLAUDE.md` — monorepo layout, turbo/filter invocation, root commands, Conventional Commits, Node/pnpm requirements, abstract token-efficiency principles
2. Create `apps/app/CLAUDE.md` — app description, scripts, module layout, all conventions (HeroUI, i18n, CRDT, Tailwind, React Compiler, icons)
3. Overwrite root `AGENTS.md` with same content as new root `CLAUDE.md`
4. Create `apps/app/AGENTS.md` with same content as `apps/app/CLAUDE.md`

No rollback needed — these are documentation files with no runtime impact.
