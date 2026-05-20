## Context

The current PDF table header implementation embeds column numbers within the label text using newline characters (e.g., `"Редни{'\n'}број{'\n'}1"`). The official Serbian tax authority format requires column numbers to appear on a dedicated row below the column labels.

Current implementation (kpo-table-header.tsx):

- Uses `{'\n'}` to stack labels and numbers vertically within single Text components
- Numbers are part of the same text block as labels

Target format (from PDF example):

- Row 1: Main section headers (spanning multiple columns, e.g., "PRIHOD OD DELATNOSTI")
- Row 2: Individual column labels (without numbers)
- Row 3: Column numbers (1, 2, 3, 4, 5) on their own row

## Goals / Non-Goals

**Goals:**

- Restructure the table header to have column numbers on a separate row
- Maintain exact visual fidelity with the official Serbian tax document format
- Preserve existing column widths and layout proportions
- Ensure proper border rendering between header rows

**Non-Goals:**

- No changes to data rows (KpoEntryRow) or totals row
- No changes to page header, signature block, or other document sections
- No changes to font styles or sizes (except structural adjustments)
- No new features beyond header layout adjustment

## Decisions

### Header Row Structure

**Decision:** Use a 3-row header structure with explicit row containers.

**Structure:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Редни │ Датум и │    ПРИХОД ОД ДЕЛАТНОСТИ     │    СВЕГА           │
│ број  │ опис    │                             │  ПРИХОДИ           │  ← Row 1
│       │         ├──────────────┬──────────────┤  ОД ДЕЛАТНОСТИ     │
│       │         │ Од продаје   │ Од извршених │  (3 + 4)           │  ← Row 2
├───────┼─────────┼──────────────┼──────────────┼────────────────────┤
│   1   │    2    │      3       │       4      │         5          │  ← Row 3
└──────────────────────────────────────────────────────────────────────┘
```

**Note:** Column 5 header MUST include the "(3 + 4)" notation as shown in the official format.

**Rationale:** This matches the exact layout shown in the PDF example, with numbers clearly separated on their own row.

### Implementation Approach

**Decision:** Modify `KpoTableHeader` component to render three distinct rows instead of nested groups with embedded newlines.

**Changes needed:**

1. Create `tableHeadRow` for Row 1 (spanning headers)
2. Create `tableHeadRow` for Row 2 (sub-headers without numbers)
3. Create `tableHeadRow` for Row 3 (column numbers only)
4. Update styles to handle row-specific borders:
   - Row 1: Bottom border on cells that span down
   - Row 2: Bottom border on all cells
   - Row 3: No bottom border (outer tableRow handles it)

**Rationale:** This approach is cleaner than using newlines and gives precise control over each row's layout and borders.

### Border Handling

**Decision:** Use `borderBottom` styles strategically to create the visual separation between rows.

**Strategy:**

- Row 1 cells that span to Row 2 will have no bottom border
- Row 1 cells that end at Row 1 will have bottom border
- Row 2 will have bottom border on all cells (separating from numbers row)
- Row 3 will have no bottom border (container handles it)

**Rationale:** This creates the grid appearance shown in the PDF while maintaining semantic structure.

## Risks / Trade-offs

| Risk                                    | Mitigation                                            |
| --------------------------------------- | ----------------------------------------------------- |
| Layout shift breaking existing PDFs     | Maintain exact column widths (8%, 32%, 18%, 18%, 24%) |
| Border rendering issues with @react-pdf | Test visually; adjust border widths if needed         |
| Row height changes affecting page fit   | Keep padding minimal; test with many entries          |

## Migration Plan

No migration needed - this is a visual change to the PDF output format. Existing data and saved entries remain compatible.

Testing approach:

1. Visual comparison with PDF example image
2. Verify column alignment with data rows
3. Test with edge cases (empty entries, long descriptions)

## Open Questions

None - the PDF example image provides clear requirements for the layout.
