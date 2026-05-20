## Context

The repo uses a flat ESLint config (`eslint.config.ts`) at the monorepo root. Tailwind v4 is configured via `@tailwindcss/vite` with no `tailwind.config.js`; the CSS entry point is inside `apps/app/`. Prettier is used for formatting with no `prettier-plugin-tailwindcss`, so class ordering via ESLint is safe.

`eslint-plugin-better-tailwindcss` requires knowing the working directory to locate the Tailwind config. In a monorepo this is done via the `settings['better-tailwindcss'].cwd` option.

## Goals / Non-Goals

**Goals:**

- Surface canonical class violations, correctness issues, and shorthand opportunities as ESLint diagnostics.
- Support autofix via `eslint --fix`.
- Keep CI green — resolve any pre-existing autofixable violations as part of this change.

**Non-Goals:**

- Line-wrapping enforcement (`enforce-consistent-line-wrapping` is explicitly excluded — it conflicts with Prettier).
- Changing runtime behaviour, build output, or Prettier config.

## Decisions

**Rule severities: correctness = error, stylistic = warn**

Correctness rules (`no-unknown-classes`, `no-conflicting-classes`, `no-duplicate-classes`, `no-deprecated-classes`) flag objectively wrong or broken class usage — they should be errors. Stylistic rules are code-quality improvements with autofix; warnings keep CI unblocked on legacy files while still surfacing issues to agents and IDEs.

Alternatives considered: all-warn (too easy to ignore correctness issues), all-error (would require fixing every stylistic violation before merging anything — too disruptive).

**Scoped to `apps/app/**/\*.{ts,tsx}` only\*\*

The plugin must point at a Tailwind config. Only `apps/app/` uses Tailwind. Scoping avoids false positives in worker code or future packages that don't use Tailwind.

**`cwd: './apps/app'` in plugin settings**

The plugin uses `cwd` to locate the Tailwind CSS entry point. Without it, it cannot resolve class definitions in a monorepo.

**Skip `enforce-logical-properties` for now**

`enforce-logical-properties` converts physical properties (`ml-`, `mr-`, `mt-`, `mb-`) to logical ones (`ms-`, `me-`, `mt-`, `mb-`). This is a stronger opinion and has writing-mode implications. Leaving it out of the initial rollout keeps the change focused. Can be added separately.

## Risks / Trade-offs

Pre-existing violations in source files → Run `eslint --fix` as part of the implementation task to autofix everything resolvable before committing. Remaining warnings (non-autofixable) are acceptable at merge time.

`no-unknown-classes` startup cost (~1s) → One-time per lint run; acceptable for CI and local use.

`no-unknown-classes` false positives on dynamic class names → If the codebase uses runtime-composed class strings, this rule may flag them. Mitigated by the `selectors` config which targets known static patterns. Can add `ignore` patterns if needed.

## Migration Plan

1. Install `eslint-plugin-better-tailwindcss` as devDependency.
2. Add ESLint config block.
3. Run `pnpm eslint apps/app --fix` to autofix all resolvable violations.
4. Verify `pnpm eslint apps/app` exits clean (zero errors; warnings acceptable).
5. Commit everything together.
