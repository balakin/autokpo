## Why

The monorepo migration moved the app into `apps/app/` but left `CLAUDE.md` and `AGENTS.md` describing a flat single-package repo — commands, paths, and structure are all wrong for the current layout. AI coding agents working from root get incorrect guidance.

## What Changes

- Rewrite root `CLAUDE.md` with monorepo structure, turbo/filter invocation patterns, and abstract token-efficiency principles (JSON reporters, jq, lint chain rule)
- Create `apps/app/CLAUDE.md` with all app-specific content: description, scripts, module layout, and every convention (HeroUI, i18n, CRDT, Tailwind, React Compiler, icons)
- Rewrite root `AGENTS.md` to mirror root `CLAUDE.md` (duplicate, kept in sync manually)
- Create `apps/app/AGENTS.md` to mirror `apps/app/CLAUDE.md` (duplicate, kept in sync manually)

## Capabilities

### New Capabilities

- `ai-agent-guidance`: AI agent instruction files (`CLAUDE.md`, `AGENTS.md`) split across monorepo root and `apps/app/` — root covers monorepo structure and tooling patterns, app covers app-specific context and conventions

### Modified Capabilities

- `monorepo-structure`: No spec-level requirement changes — guidance files are a documentation concern, not a structural one

## Impact

- `CLAUDE.md` — rewritten (root, monorepo-aware)
- `AGENTS.md` — rewritten (root, mirrors CLAUDE.md)
- `apps/app/CLAUDE.md` — created (app-specific)
- `apps/app/AGENTS.md` — created (mirrors apps/app/CLAUDE.md)
- No code, config, or dependency changes
