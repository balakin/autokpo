## Why

The legal warning about document validity is currently embedded inside the `DownloadPdfButton` component, limiting its visibility. By extracting it to the `WorkingLayout` level, it becomes more prominent to users. Additionally, the warning text is currently in Cyrillic script ("Преузети документ је нацрт...") and should be translated to Latin script for consistency with the rest of the application UI.

## What Changes

- Extract the legal warning `Alert` component from `DownloadPdfButton` component
- Move the warning alert to `WorkingLayout` to display it more prominently
- Translate the warning text from Cyrillic to Latin script:
  - Current: "Преузети документ је нацрт. Обавезно га потпишите и оверите печатом (Члан 13, став 2 Правилника о пословним књигама)."
  - New: "Preuzeti dokument je nacrt. Obavezno ga potpišite i overite pečatom (Član 13, stav 2 Pravilnika o poslovnim knjigama)."
- Simplify `DownloadPdfButton` to only contain the download button functionality

## Capabilities

### New Capabilities

<!-- No new capabilities - this is UI refactoring only -->

### Modified Capabilities

<!-- No spec-level requirement changes - this is implementation refactoring -->

## Impact

- `src/pdf/download-pdf-button.tsx`: Remove Alert component and related imports
- `src/working-layout/working-layout.tsx`: Add Alert component with legal warning
