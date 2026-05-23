# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Monorepo structure

Turborepo + pnpm workspace monorepo. Requires **Node 24**.

```
apps/
  app/      — @autokpo/app  (React PWA + Cloudflare Worker)
```

App-specific guidance lives in `apps/app/CLAUDE.md`.

## Commands

Prefer running commands directly inside the package (`cd apps/app && pnpm -s <script>`). Two root turbo commands exist for regression checks (e.g. after updating shared dependencies) — bare calls only, piping to `head` / `tail` is fine:

```bash
pnpm build    # turbo run build
pnpm test     # turbo run test
```

Turbo's TUI breaks pipes and swallows flags — never pass extra params to these. All other root scripts (`lint`, `lint:fix`, `dev`, `i18n:extract`, `generate:worker-types`, `check:worker-types`, `db:*`, `prepare`) are for CI/CD, Husky, and developers — do not invoke them.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint.

## Token-efficient command patterns

Always prefix `pnpm` with `-s` when running directly — lifecycle logs otherwise break parsers. For tests in this repo, use Vitest's verbose reporter; Wrangler emits warnings to stdout and breaks JSON parsing.

**Tests** — tests are written in Vitest. Use verbose reporter (`cd apps/app && pnpm -s test --reporter=verbose`). For large/full runs, pipe to `tail` to keep output manageable. Use direct verbose output without piping only for scoped runs (one or several files) or targeted `-t <name>` checks.

```bash
cd apps/app && pnpm -s test --reporter=verbose --changed | tail -n 120

# narrow to a file or test name
cd apps/app && pnpm -s test src/foo/foo.spec.ts -t 'test name' --reporter=verbose

# full run (trim output)
cd apps/app && pnpm -s test --reporter=verbose | tail -n 120
```

**Build / typecheck** — filter errors directly:

```bash
cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40
```

**Lint** — run ESLint and Prettier directly, never via `pnpm lint` / `pnpm lint:fix` (those are chain commands for CI/developers). Run from the repo root — not `cd apps/app` — so root configs are picked up, with path scoped to the package or file:

```bash
pnpm -s eslint apps/app --fix --format=json | jq '[.[] | select(.errorCount > 0) | {file: .filePath, errors: [.messages[] | select(.severity == 2) | {line, col: .column, rule: .ruleId, msg: .message}]}]'
pnpm -s prettier --write --log-level=error apps/app
```

**Git** — overview first, then targeted:

- `git status -s`, `git diff --stat`, `git log --oneline -n 20`
- `git diff --name-only` → targeted `git diff <file>`
- `git log -L :symbolName:path/to/file.ts` for a single symbol's history

## Context-efficient reading

For questions that would take more than 3 searches or span several unrelated files ("how is X wired up?", "which components use this hook?"), delegate to the `Explore` subagent so raw search output stays out of the main context.
