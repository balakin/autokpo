## Context

Three isolated cleanup items with no cross-cutting dependencies. Each touches a small, well-understood surface area. The avatar fix is the only one requiring a library API lookup before writing code (HeroUI v3 Avatar `shape` prop must be confirmed via MCP docs tool before implementation).

## Goals / Non-Goals

**Goals:**

- Remove the vestigial `packages/` workspace entry and directory.
- Make `UserAvatar` always render as a full circle regardless of call site.
- Align general settings card descriptions with the `Card.Description` pattern already established in account settings.

**Non-Goals:**

- No other visual changes to settings pages beyond the description placement.
- No changes to avatar size, colors, or fallback logic.
- No new workspace packages or shared libraries.

## Decisions

### Avatar: enforce circle at the component level, not the call site

Callers pass `className` for sizing but should not need to think about shape. The `UserAvatar` component is the right place to pin the circle — a single fix propagates to all three call sites. The implementation MUST consult `mcp__heroui-react__get_component_docs` for the `Avatar` component before writing code. If HeroUI v3 Avatar exposes a `shape` prop (e.g. `shape="circle"`), prefer that over a CSS class. If not, add `rounded-full overflow-hidden` via `className` on the `Avatar` root.

### Settings descriptions: move to `Card.Description`, remove inline `<p>` tags

The Theme, Language, and Data cards in `general-settings-page.tsx` currently put their description text as `<p className="text-sm text-muted">` inside `Card.Content`. Moving them to `<Card.Description>` inside `Card.Header` is purely structural — it uses the existing HeroUI compound component slot, which already styles the text consistently, so the custom `text-sm text-muted` class is no longer needed after the move.

### Packages removal: delete directory + single yaml line + CLAUDE.md diagram

The `packages/` directory is empty. No code imports from it, no turbo task references it explicitly. Three files need updating: `pnpm-workspace.yaml` (remove the `'packages/*'` entry), root `CLAUDE.md` (remove the `packages/` line from the monorepo diagram and the "reserved for future shared libraries" note), and the `packages/` directory itself.

## Risks / Trade-offs

- **Avatar shape prop availability**: HeroUI v3 is in beta; if `shape` doesn't exist, fall back to CSS. Either way the fix is trivial. → Mitigated by checking docs first.
- **pnpm workspace change**: Removing `'packages/*'` from `pnpm-workspace.yaml` won't break existing installs since the directory is empty and no package resolution currently uses it. → No mitigation needed beyond verifying the directory is empty before deletion.
