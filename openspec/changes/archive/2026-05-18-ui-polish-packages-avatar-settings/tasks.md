## 1. Remove packages/ directory

- [x] 1.1 Delete the empty `packages/` directory from the repository root
- [x] 1.2 Remove the `'packages/*'` line from `pnpm-workspace.yaml`
- [x] 1.3 Update root `CLAUDE.md` monorepo structure diagram: remove the `packages/` line and the "reserved for future shared libraries" note

## 2. Fix avatar circle shape

- [x] 2.1 Check HeroUI v3 Avatar docs via `mcp__heroui-react__get_component_docs` to confirm whether a `shape` prop exists (e.g. `shape="circle"`)
- [x] 2.2 Update `apps/app/src/auth/user-avatar.tsx` to enforce full-circle rendering — use the `shape` prop if available, otherwise add `rounded-full overflow-hidden` to the `Avatar` root `className`

## 3. Improve general settings card descriptions

- [x] 3.1 In `apps/app/src/settings/general-settings-page.tsx`, move the Theme card description `<p>` into `<Card.Description>` inside `<Card.Header>`, removing the custom `text-sm text-muted` class
- [x] 3.2 Move the Language card description `<p>` into `<Card.Description>` inside `<Card.Header>`, removing the custom `text-sm text-muted` class
- [x] 3.3 Move the Data card description `<p>` into `<Card.Description>` inside `<Card.Header>`, removing the custom `text-sm text-muted` class
