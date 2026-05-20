## Why

Three small quality-of-life improvements that have accumulated: the `packages/` directory is vestigial and adds workspace noise, avatars render slightly non-circular due to missing shape enforcement, and general settings cards use an ad-hoc description pattern instead of the `Card.Description` component already used elsewhere.

## What Changes

- **Remove `packages/` directory**: delete the empty `packages/` folder, remove the `'packages/*'` entry from `pnpm-workspace.yaml`, and update root `CLAUDE.md` monorepo diagram to drop the `packages/` line.
- **Fix avatar shape**: enforce a full circle on `UserAvatar` so it renders correctly in all contexts (profile popover trigger buttons on mobile and desktop, account settings profile section).
- **Promote settings descriptions to `Card.Description`**: in `general-settings-page.tsx`, move the inline `<p className="text-sm text-muted">` description paragraphs from `Card.Content` into `Card.Header` as `<Card.Description>` — matching the pattern already used in `account-settings-page.tsx`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `monorepo-structure`: The "pnpm workspace declares apps and packages" requirement currently mandates `packages: ["apps/*", "packages/*"]`; this changes to `packages: ["apps/*"]` only, reflecting permanent removal of the `packages/` directory.

## Impact

- `pnpm-workspace.yaml` — remove `'packages/*'` line
- `packages/` directory — deleted
- `CLAUDE.md` (root) — update monorepo structure diagram
- `apps/app/src/auth/user-avatar.tsx` — add circle shape to `Avatar`
- `apps/app/src/settings/general-settings-page.tsx` — move description `<p>` tags into `Card.Description` in Theme, Language, and Data cards
