## 1. Implementation

- [x] 1.1 In `src/entries/entries-table.tsx`, import `AlertDialog` from `@heroui/react`
- [x] 1.2 Remove the `handleDelete` function and the `window.confirm` call
- [x] 1.3 Wrap the delete `Button` in each row with an `AlertDialog` (trigger + backdrop + dialog), matching the pattern in `src/books/book-library.tsx`
- [x] 1.4 Display the entry date (`formatDate(entry.datumPrometa)`) and description (`entry.opisPrometa`) in the `AlertDialog.Body`
- [x] 1.5 Move the `dispatch({ type: 'DELETE_ENTRY', id })` call into the confirm button's `onPress` inside the dialog

## 2. Tests

- [x] 2.1 Update `src/entries/__tests__/entries-table.spec.tsx` — remove `window.confirm` spies
- [x] 2.2 Add test: pressing the delete button opens the confirmation modal (assert dialog heading is visible)
- [x] 2.3 Update test: confirming in the modal removes the entry from the table
- [x] 2.4 Update test: cancelling in the modal leaves the entry in the table
