## 1. Selector support for duplicate-year metadata

- [x] 1.1 Extend book-library selector output with duplicate-year metadata for rows (for example `isDuplicateYear` flag per row).
- [x] 1.2 Add a selector projection for warning summary items containing duplicated year and count.
- [x] 1.3 Add/adjust selector unit tests to cover single-year duplicates, multi-year duplicates, and no-duplicate cases.

## 2. Book library warning UI

- [x] 2.1 Render a persistent warning alert in `BookLibrary` when duplicate summary items exist.
- [x] 2.2 Render warning details as a bullet list with one item per duplicated year and count.
- [x] 2.3 Ensure warning copy tells users to keep one book per year and delete extras.

## 3. Per-row duplicate tagging

- [x] 3.1 Render a visible duplicate warning tag/chip next to the year for each duplicated row.
- [x] 3.2 Preserve existing row actions and chips (favorite, delete, incomplete) while adding duplicate tag behavior.

## 4. Validation and regression coverage

- [x] 4.1 Update `book-library` UI tests to assert alert visibility, bullet list content, and row-level duplicate tags.
- [x] 4.2 Verify unchanged behavior when no duplicates exist (no alert, no duplicate tags).
- [x] 4.3 Run package test suite for books-related tests and address failures.
