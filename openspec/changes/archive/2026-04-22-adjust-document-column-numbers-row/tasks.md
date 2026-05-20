## 1. Component Refactoring

- [x] 1.1 Refactor KpoTableHeader to use three-row structure (Row 1: main headers, Row 2: sub-headers, Row 3: column numbers)
- [x] 1.2 Remove embedded newline characters and numbers from label Text components (e.g., change `"Редни{'\n'}број{'\n'}1"` to `"Редни број"`), but **preserve the "(3 + 4)" notation** in column 5 header
- [x] 1.3 Add dedicated row for column numbers (1, 2, 3, 4, 5) with proper alignment
- [x] 1.4 Implement proper border handling between header rows (Row 1→Row 2, Row 2→Row 3)

## 2. Style Updates

- [x] 2.1 Update styles.ts to support multi-row header layout if needed
- [x] 2.2 Ensure column widths remain consistent (8%, 32%, 18%, 18%, 24%)
- [x] 2.3 Verify border rendering creates proper grid appearance

## 3. Code Quality

- [x] 3.1 Run full test suite to ensure no regressions
- [x] 3.2 Run lint and typecheck to ensure code quality

## 4. Manual Verification

- [x] 4.1 Generate test PDF and visually compare with example image
- [x] 4.2 Verify column alignment between headers and data rows
- [x] 4.3 Test with edge cases (empty entries, many entries)
