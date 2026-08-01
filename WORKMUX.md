# Workmux in this repo

[workmux](https://github.com/raine/workmux) gives each coding agent its own git worktree +
tmux window. Agent and sandbox settings are machine-wide (`~/.config/workmux/config.yaml`);
`.workmux.yaml` here carries only `files.copy` and the pane layout.

## `files.copy`

New worktrees are clean checkouts, so gitignored local state has to be copied in:

- `apps/app/.env`, `apps/app/.dev.vars`, `apps/website/.env` — env
- `apps/app/.wrangler` — local D1 state, so a fresh worktree needs no `pnpm db:migrate:local`
- `.mcp.json`, `opencode.jsonc` — MCP servers for claude-code / opencode; without them the
  agent starts with none

`workmux sync-files` re-applies these to a worktree created before the config changed.

## Notes

- Run `pnpm install` in the second (shell) pane. workmux `post_create` hooks run on the
  **host**, outside any sandbox, and this repo builds native deps (`sharp`, `workerd`,
  `esbuild`, `unrs-resolver`) that must match the environment running them.
- Under a sandbox with a bind-mounted worktree, pnpm moves its store next to the project at
  `~/autokpo__worktrees/.pnpm-store` — that's what the `.pnpm-store/` line in `.gitignore`
  is for. No pnpm configuration needed.
- Do not add a `sandbox:` block to `.workmux.yaml`. The merge is shallow at the top level,
  so it clobbers the global one.
