## 1. Dependencies & Assets

- [x] 1.1 Add `@react-pdf/renderer` to `package.json` dependencies via pnpm
- [x] 1.2 Download PT Serif Regular TTF and place at `public/fonts/PTSerif-Regular.ttf`
- [x] 1.3 Download PT Serif Bold TTF and place at `public/fonts/PTSerif-Bold.ttf`

## 2. PDF Module Foundation

- [x] 2.1 Create `src/pdf/fonts.ts` that registers PT Serif Regular and Bold via `Font.register()`
- [x] 2.2 Create `src/pdf/styles.ts` with a shared `StyleSheet.create()` exporting reusable styles (page, cell, header, label, value)

## 3. PDF Component: Page Header

- [x] 3.1 Create `src/pdf/kpo-page-header.tsx` accepting `EntityProfile` props and rendering all six header fields
- [x] 3.2 Ensure the header renders labels in Serbian Cyrillic using the PT Serif font

## 4. PDF Component: Table Column Headers

- [x] 4.1 Create `src/pdf/kpo-table-header.tsx` rendering the two-level column header (group label + individual column labels)
- [x] 4.2 Apply column widths matching design decision D6: 8% / 32% / 18% / 18% / 24%

## 5. PDF Component: Entry Row

- [x] 5.1 Create `src/pdf/kpo-entry-row.tsx` accepting a `KpoEntry` and a row index and rendering columns 1–5 where column 5 is computed as `odProdajeProizvoda + odIzvrsenihUsluga`
- [x] 5.2 Apply the same column width percentages as the header

## 6. PDF Component: Totals Row

- [x] 6.1 Create `src/pdf/kpo-totals-row.tsx` accepting the full `KpoEntry[]` array and rendering the sum of columns 3, 4, and 5

## 7. PDF Component: Signature Block

- [x] 7.1 Create `src/pdf/kpo-signature.tsx` accepting an optional `Signature` and rendering the Саставио / Одговорно лице block; name fields render empty when no signature is provided

## 8. PDF Root Document

- [x] 8.1 Create `src/pdf/kpo-document.tsx` composing all components into a `<Document>` + `<Page>` tree in the order: page header, column headers, entry rows, totals row, signature block
- [x] 8.2 Add page number rendering to the document using `<Text render={({ pageNumber }) => ...} fixed />`

## 9. App Integration

- [x] 9.1 Add a "Preuzmi PDF" button to `src/app.tsx`
- [x] 9.2 Wire the button click to dynamically `import()` the pdf module, generate the PDF blob via `@react-pdf/renderer`'s `pdf()` API, and trigger a browser download as `kpo.pdf`
- [x] 9.3 Disable the button when `entityProfile` is not set
- [x] 9.4 Always render a persistent (non-dismissible) alert informing the user that the generated document is a draft that must be signed and stamped by the taxpayer themselves (Члан 13, став 2); the warning is unconditional because the browser opens the PDF in a new window

## 10. Tests

- [x] 10.1 Add test to `src/app.spec.tsx` asserting the "Preuzmi PDF" button is visible in the rendered app
- [x] 10.2 Add test asserting the button is disabled when no entity profile is currently saved
- [x] 10.3 Add test asserting the button is enabled when a valid entity profile is saved
- [x] 10.4 Add test asserting the legal compliance warning is always visible
- [x] 10.5 ~~Add test asserting the legal compliance warning can be dismissed~~ (removed — warning is persistent)
- [x] 10.6 Write a unit test for `kpo-entry-row.tsx` asserting that column 5 equals column 3 + column 4
- [x] 10.7 Write a unit test for `kpo-totals-row.tsx` asserting that each totals cell equals the arithmetic sum of all entry values for that column
