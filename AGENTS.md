Guidance for AI coding agents working in this repository.

## Monorepo structure

Turborepo + pnpm workspace monorepo. Requires **Node 24**.

```
apps/
  app/      — @autokpo/app             (React PWA + Cloudflare Worker)
  website/  — @autokpo/website         (Astro public website)
packages/
  eslint-config/ — @autokpo/eslint-config  (shared ESLint preset)
```

App-specific guidance lives in `apps/app/AGENTS.md`. Each package's `README.md` covers its own setup, env vars, and deployment.

## Commands

Prefer running commands directly inside the target package (`cd apps/app && pnpm -s <script>`, `cd apps/website && pnpm -s <script>`). Two root turbo commands exist for repo-wide regression checks (e.g. after updating shared dependencies) — bare calls only, piping to `head` / `tail` is fine:

```bash
pnpm build    # turbo run build
pnpm test     # turbo run test
```

Turbo's TUI breaks pipes and swallows flags — never pass extra params to these. All other root scripts (`lint`, `lint:fix`, `format`, `format:fix`, `dev`, `i18n:extract`, `generate:worker-types`, `check:worker-types`, `auth:generate`, `db:*`, `prepare`) are for CI/CD, Husky, and developers — do not invoke them.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint.

## Token-efficient command patterns

Always prefix `pnpm` with `-s` when running directly — lifecycle logs otherwise break parsers. For tests in this repo, use Vitest's verbose reporter; Wrangler emits warnings to stdout and breaks JSON parsing.

**Tests** — Vitest, always `--reporter=verbose`. Run scoped without piping; pipe full/changed runs to `tail`.

```bash
# scoped: a file, or a test name
cd apps/app && pnpm -s test src/foo/foo.spec.ts -t 'test name' --reporter=verbose

# full or changed-file run (trim output)
cd apps/app && pnpm -s test --reporter=verbose --changed | tail -n 120
```

**Build / typecheck** — filter errors directly:

```bash
cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40
```

**Lint** — run ESLint and Prettier directly, never via `pnpm lint` / `pnpm lint:fix` (those are chain commands for CI/developers).

ESLint config is per-package (`apps/app/eslint.config.ts`, `apps/website/eslint.config.ts`, both extending `@autokpo/eslint-config`). Flat config resolves from the current directory, so run ESLint **from inside the package**:

```bash
cd apps/app && pnpm -s eslint . --fix --format=json | jq '[.[] | select(.errorCount > 0) | {file: .filePath, errors: [.messages[] | select(.severity == 2) | {line, col: .column, rule: .ruleId, msg: .message}]}]'
```

Prettier uses a single root config (`.prettierrc`), so run it **from the repo root** with the path scoped to the package or file:

```bash
pnpm -s prettier --write --log-level=error apps/app
```
