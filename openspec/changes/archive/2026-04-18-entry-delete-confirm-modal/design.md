## Context

The entries table uses a native `window.confirm` dialog to confirm entry deletion. This is inconsistent with the rest of the app — the book library already uses HeroUI's `AlertDialog` component for the same pattern, providing a polished, accessible modal confirmation flow. The goal is to align the entry delete confirmation with the established pattern.

## Goals / Non-Goals

**Goals:**

- Replace `window.confirm` in `EntriesTable` with HeroUI `AlertDialog`
- Show the entry date and description in the dialog body so the user knows what they are deleting
- Update the existing test to work with the new modal flow

**Non-Goals:**

- Changes to the delete reducer logic
- Any other entry actions (edit, add)
- Changes to book library delete (already uses `AlertDialog`)

## Decisions

### Use HeroUI `AlertDialog` directly in `EntriesTable`

The `BookRow` component wraps the delete button with `AlertDialog` inline. The same approach applies here: wrap each row's delete `Button` with `AlertDialog` directly in `EntriesTable`. No new component abstraction is needed — this is a self-contained, one-off usage.

**Alternative considered**: Extract a shared `DeleteConfirmDialog` wrapper. Rejected — over-engineering for two independent usages in different modules.

### Remove `handleDelete` function

The `window.confirm` gated `handleDelete` function is replaced by the `AlertDialog` trigger + confirm button. The dispatch call moves directly into the `onPress` of the confirm button, consistent with how `BookRow` handles it.

### Show entry context in dialog body

Display `formatDate(entry.datumPrometa)` and `entry.opisPrometa` in the dialog body so the user can confirm they're deleting the right entry. This mirrors the book library showing the book year and entry count.

## Risks / Trade-offs

- **Testing complexity**: `window.confirm` is easy to mock; `AlertDialog` requires the test to click through the modal. Existing entry deletion tests must be updated. → Mitigate by following the book library test pattern if one exists.
