## 1. Move Legal Warning to Working Layout

- [x] 1.1 Add Alert import to `src/working-layout/working-layout.tsx`
- [x] 1.2 Add legal warning Alert component to `WorkingLayout` in the sidebar section
- [x] 1.3 Use Latin script text: "Preuzeti dokument je nacrt. Obavezno ga potpišite i overite pečatom (Član 13, stav 2 Pravilnika o poslovnim knjigama)."

## 2. Simplify DownloadPdfButton

- [x] 2.1 Remove Alert import from `src/pdf/download-pdf-button.tsx`
- [x] 2.2 Remove Alert component JSX from `DownloadPdfButton`
- [x] 2.3 Remove wrapping `div` with flex gap since only Button remains
- [x] 2.4 Run `pnpm lint:fix` to fix import ordering

## 3. Verify Changes

- [x] 3.1 Verify TypeScript compiles without errors (`pnpm build`)
- [x] 3.2 Verify lint passes (`pnpm lint`)
- [x] 3.3 Verify warning displays correctly in the working layout (test updated)
- [x] 3.4 Verify button still works and PDF download functions properly (all 16 tests pass)
