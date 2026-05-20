---
name: pr-description
description: Generate concise, well-structured GitHub pull request descriptions. Use this skill whenever the user wants to write, draft, or generate a PR description, pull request summary, or PR body — even if they just say "write a PR for this diff" or "help me describe my changes".
---

# PR Description Skill

Generate a concise GitHub-flavored PR description from available context: git diff, commit messages, and/or branch name.

## Output Format

Produce this exact markdown template — no more, no less. Keep each section tight.

```markdown
## What changed

<!-- 2-4 bullet points. Focus on WHAT, not HOW. -->

## Why

<!-- 1-3 sentences. The motivation, problem solved, or business reason. -->

## Breaking changes

<!-- Bullet list of breaking changes, or "None." if there are none. -->
```

## Rules

- **Concise over complete.** Omit filler. Every word earns its place.
- **What, not how.** Don't narrate implementation details unless they're user-facing.
- **Infer motivation** from branch name and commit messages when not explicit. Use phrasing like "Likely to…" only if genuinely uncertain.
- **Breaking changes** = anything that changes a public API, removes behavior, or requires a consumer to update. Default to "None." if nothing qualifies.
- **No title.** The PR title is separate; don't add one.
- **No extra sections.** Don't add "How to test", "Screenshots", or other sections unless the user explicitly asks.

## Input Handling

| Input available | What to do                                                           |
| --------------- | -------------------------------------------------------------------- |
| Git diff        | Primary source. Scan changed files and hunks for intent.             |
| Commit messages | Use for motivation and change summary.                               |
| Branch name     | Use to infer feature/fix type (e.g., `fix/`, `feat/`, `chore/`).     |
| Multiple inputs | Synthesize — commit messages often explain _why_, diff shows _what_. |

If the diff is large, focus on the highest-signal changes: new exports, deleted APIs, config changes, schema changes. Skip mechanical churn (formatting, generated files).
