## 1. Root CLAUDE.md

- [x] 1.1 Rewrite root `CLAUDE.md`: monorepo layout section (`apps/app/` = `@autokpo/app`, `packages/` empty), Node 24 + pnpm 10 requirement, Conventional Commits
- [x] 1.2 Add root commands section: `turbo run build/dev/test/lint/lint:fix`, `pnpm --filter @autokpo/app <script>` pattern, root-only commands (`pnpm lint`, `pnpm lint:fix` run eslint + prettier at root)
- [x] 1.3 Add abstract token-efficiency principles: prefix `pnpm` with `-s`, JSON reporters + jq, `--changed` for vitest iteration, `pnpm eslint`/`pnpm prettier` for individual inspection, never pipe `pnpm lint` or `pnpm lint:fix`
- [x] 1.4 Add context-efficient reading note (delegate broad searches to Explore subagent)

## 2. apps/app/CLAUDE.md

- [x] 2.1 Create `apps/app/CLAUDE.md`: app description (AutoKPO, Yjs, Cloudflare Worker, D1)
- [x] 2.2 Add app scripts section with one-line descriptions and note that scripts run via `pnpm --filter @autokpo/app <script>` from root; include Wrangler and D1 migration notes
- [x] 2.3 Add architecture section: openspec reference, module layout (`src/crdt/`, `worker/db/`, `worker/routes/sync.ts`)
- [x] 2.4 Add all coding conventions: imports, import aliases, Tailwind v4, tailwind-variants, React Compiler, tests, HeroUI v3 (with MCP lookup requirement), library docs (Context7), i18n (Trans vs t, pluralization), CRDT/Yjs patterns, icons

## 3. Duplicate to AGENTS.md files

- [x] 3.1 Overwrite root `AGENTS.md` with identical content to new root `CLAUDE.md`
- [x] 3.2 Create `apps/app/AGENTS.md` with identical content to `apps/app/CLAUDE.md`
