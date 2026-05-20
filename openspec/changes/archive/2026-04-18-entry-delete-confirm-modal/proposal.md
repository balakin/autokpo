## Why

Deleting an entry in the entries table currently uses a native `window.confirm` dialog, which is inconsistent with the rest of the app. The book library already uses HeroUI's `AlertDialog` for the same pattern, so the entries table should match.

## What Changes

- Replace the `window.confirm` call in `EntriesTable` with a HeroUI `AlertDialog` confirmation modal
- The delete button triggers the modal; deletion only proceeds when the user confirms
- The modal shows the entry date and description so the user knows what they're deleting

## Capabilities

### New Capabilities

- `entry-delete-confirm`: Confirmation modal (HeroUI `AlertDialog`) wrapping the delete action in the entries table

### Modified Capabilities

- `entry-management`: The delete interaction UX changes from `window.confirm` to an `AlertDialog` modal

## Impact

- `src/entries/entries-table.tsx` — replace `handleDelete` / `window.confirm` with `AlertDialog` usage
- No new dependencies; `AlertDialog` is already available from `@heroui/react` (used in `book-library.tsx`)
- Test for `EntriesTable` will need updating to interact with the modal instead of `window.confirm`
