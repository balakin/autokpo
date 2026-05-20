## Context

The legal warning about document validity is currently embedded inside the `DownloadPdfButton` component. This limits its visibility and creates a coupling between the download functionality and the legal notice. The warning is also in Cyrillic script while the rest of the application uses Latin script.

Current state:

- `src/pdf/download-pdf-button.tsx` contains both the download button and the warning Alert
- Warning text is in Cyrillic: "Преузети документ је нацрт. Обавезно га потпишите и оверите печатом..."
- `src/working-layout/working-layout.tsx` imports and renders `DownloadPdfButton`

## Goals / Non-Goals

**Goals:**

- Extract the legal warning Alert from `DownloadPdfButton`
- Move the warning to `WorkingLayout` for better visibility
- Translate the warning text from Cyrillic to Latin script
- Simplify `DownloadPdfButton` to only handle download functionality

**Non-Goals:**

- Changing the warning text content (only script translation)
- Changing the Alert styling or behavior
- Modifying download functionality
- Adding new features or capabilities

## Decisions

**Decision 1: Move Alert to WorkingLayout instead of creating a new component**

- Rationale: The warning is a simple informational element that doesn't need reusability. Embedding it directly in `WorkingLayout` keeps the change minimal and avoids unnecessary abstraction.
- Alternative considered: Creating a separate `LegalWarning` component - rejected as over-engineering for a single static Alert.

**Decision 2: Remove Alert import from DownloadPdfButton, add to WorkingLayout**

- Rationale: This cleanly separates concerns - the button handles downloads, the layout handles page-level notices.
- The Alert component from HeroUI will be imported in `WorkingLayout` instead.

**Decision 3: Use Latin script transliteration**

- Original: "Преузети документ је нацрт. Обавезно га потпишите и оверите печатом (Члан 13, став 2 Правилника о пословним књигама)."
- Translated: "Preuzeti dokument je nacrt. Obavezno ga potpišite i overite pečatom (Član 13, stav 2 Pravilnika o poslovnim knjigama)."
- Rationale: Maintains consistency with the rest of the UI which uses Latin script (e.g., "Preuzmi PDF", "Nazad na knjige").

## Risks / Trade-offs

- [Risk] Layout shift when moving the Alert → [Mitigation] Keep the same flex container structure to maintain visual consistency
- [Risk] Import ordering lint errors → [Mitigation] Run `pnpm lint:fix` after changes to auto-fix import order

## Migration Plan

Not applicable - this is a client-side change with no data migration needed. The change is purely UI refactoring.
