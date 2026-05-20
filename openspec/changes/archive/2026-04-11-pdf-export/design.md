## Context

The KPO application is a fully client-side SPA (React + Vite, no backend). All data lives in `localStorage` and is exposed via three React contexts:

- `EntityProfileContext` — six KPO header fields (PIB, Obveznik, Firma-radnje, Sedište, Šifra poreskog obveznika, Šifra delatnosti)
- `EntriesContext` — array of `KpoEntry` objects (datumPrometa, opisPrometa, odProdajeProizvoda, odIzvrsenihUsluga)
- `SignatureContext` — Sastavlio and OdgovornoLice names

All three contexts were explicitly designed to feed a future PDF export module (see archived change proposals). No data model changes are needed — every field required by the official KPO образац is already present.

The PDF must conform to the official KPO form prescribed by Правилник о пословним књигама ("Sl. glasnik RS" br. 140/2004 i 44/2018).

## Goals / Non-Goals

**Goals:**

- Generate a legally compliant KPO PDF downloadable client-side
- Render entity profile header and column headers once at the top of the document
- Include page numbers on every page (Члан 4, став 2)
- Include totals row (збир кол. 3+4+5) after the last entry (Члан 13, став 1)
- Include signature block with Саставио / Одговорно лице lines once at the end (Члан 13, став 2)
- Lazy-load the PDF library to avoid impacting initial bundle size
- Support Cyrillic script for official form labels

**Non-Goals:**

- Server-side PDF generation
- PDF preview/viewer in the browser (download-only)
- Print CSS / window.print() alternative
- Attaching the generated PDF to any external system
- Any data input or editing within the PDF flow

## Decisions

### D1 — Library: `@react-pdf/renderer`

**Decision**: Use `@react-pdf/renderer` for PDF generation.

**Rationale**: Produces real vectorized PDFs (text-selectable, print-crisp). Fully declarative React component model fits the codebase. Multi-page headers are a first-class concern via `fixed` prop. No server required. The "separate component tree" tradeoff is appropriate here — the PDF layout is dictated by a government template, not the UI component library.

**Alternatives considered**:

- `html2canvas + jsPDF` — rasterized output, fails on modern CSS (Tailwind v4 + HeroUI CSS vars), not suitable for legal documents
- `window.print()` + CSS — inconsistent multi-page header behavior across browsers, unreliable for legal documents
- `pdfmake` — imperative document definition objects, not React-native, less ergonomic in this codebase

---

### D2 — Font: PT Serif (embedded TTF)

**Decision**: Embed PT Serif Regular + Bold TTF files (from Google Fonts, OFL license) served from `public/fonts/`.

**Rationale**: PT Serif has full Cyrillic + Latin Extended coverage. Serif style visually matches the official KPO template. OFL license permits embedding. react-pdf requires explicit font registration — system fonts are not available.

**Alternatives considered**:

- Roboto — sans-serif, doesn't match the official template's visual style
- Liberation Serif — metric-equivalent to Times New Roman, good match but less common in react-pdf usage

---

### D3 — Lazy loading

**Decision**: Dynamically import the entire `src/pdf/` module (including `@react-pdf/renderer`) on demand when the user clicks "Preuzmi PDF".

**Rationale**: `@react-pdf/renderer` adds ~900KB to the bundle. For a local SPA loaded once, this is acceptable after first interaction, but there's no reason to bloat the initial load. `React.lazy` + `Suspense` or a simple `import()` on button click achieves transparent lazy loading.

**Implementation**: The export button imports `{ pdf }` from `@react-pdf/renderer` and `KpoDocument` from `src/pdf/kpo-document.tsx` via dynamic import, calls `pdf(<KpoDocument .../>).toBlob()`, and triggers a browser download via a temporary `<a>` element.

---

### D4 — Page layout structure

**Decision**: Use a single `<Page>` with a flat flowing layout — header and column headers appear once at the top, followed by entries, totals, and signature block.

**Rationale**: The header and table header are rendered once at the top of the document. For typical KPO usage (up to a few hundred entries per year) this is sufficient and simpler to implement and maintain than repeating headers via the `fixed` prop.

```
<Page>
  <KpoPageHeader />         ← ПИБ, Обвезник, etc. + "КПО" label (once)
  <KpoTableHeader />        ← column labels (Редни број, Датум...) (once)
  <KpoPageNumber />         ← page number (Члан 4, став 2) fixed

  {entries.map(entry => <KpoEntryRow />)}
  <KpoTotalsRow />          ← збир кол. 3+4+5 (Члан 13, став 1)
  <KpoSignature />          ← Саставио / Одговорно лице
</Page>
```

---

### D5 — `svega` (column 5) — computed, not stored

**Decision**: Compute `svega = odProdajeProizvoda + odIzvrsenihUsluga` at render time in the PDF component.

**Rationale**: Consistent with how the entries table already renders it. No schema change needed. The law (Члан 7, став 2, тачка 4) defines column 5 as "збир износа из кол. 3 и 4" — it is definitionally derived.

---

### D6 — Column widths

**Decision**: Fixed percentage widths matching the official template proportions:

| Column | Label        | Width |
| ------ | ------------ | ----- |
| 1      | Редни број   | 8%    |
| 2      | Датум и опис | 32%   |
| 3      | Од продаје   | 18%   |
| 4      | Од услуга    | 18%   |
| 5      | Свега        | 24%   |

**Rationale**: react-pdf has no `colspan` — the nested "ПРИХОД ОД ДЕЛАТНОСТИ" spanning header over columns 3+4 must be built from nested `<View>` flexbox. Fixed percentages ensure columns align between the header and data rows.

---

### D7 — Module structure

**Decision**: New `src/pdf/` module, isolated from UI components:

```
src/pdf/
  kpo-document.tsx      ← <Document><Page> root, font registration
  kpo-page-header.tsx   ← entity profile block (fixed)
  kpo-table-header.tsx  ← column labels with nested "ПРИХОД ОД ДЕЛАТНОСТИ"
  kpo-entry-row.tsx     ← single entry row
  kpo-totals-row.tsx    ← year-end totals (збир свих колона)
  kpo-signature.tsx     ← Саставио / Одговорно лице
  fonts.ts              ← Font.register() calls
  styles.ts             ← shared StyleSheet definitions
```

**Rationale**: Mirrors the existing pattern of feature-scoped modules (`src/entries/`, `src/signatures/`). Keeps react-pdf imports isolated, which is essential for lazy loading to work correctly.

### D8 — Persistent legal compliance warning

**Decision**: Always display a non-dismissible HeroUI `Alert` below the download button with the following text (Serbian):

> Преузети документ је нацрт. Обавезно га потпишите и оверите печатом (Члан 13, став 2 Правилника о пословним књигама).

**Rationale**: Члан 13, став 2 of Правилник о пословним књигама requires the taxpayer to sign and stamp the closed book themselves. A purely digital PDF without a physical signature and stamp has no standalone legal validity. Users unfamiliar with the regulation may mistakenly consider the downloaded file sufficient. This warning prevents that misunderstanding. The warning is shown unconditionally because the browser opens the PDF in a new window, making a post-download state change invisible to the user.

**Implementation**: The `Alert` is rendered unconditionally inside `DownloadPdfButton` — no state flag needed.

---

## Risks / Trade-offs

- **Font loading in tests** — react-pdf font registration is a side effect that may fail or warn in Vitest/jsdom. Mitigation: mock `@react-pdf/renderer` in test setup or skip font registration in test environment.
- **react-pdf API stability** — library has had breaking changes between major versions. Mitigation: pin to a specific minor version, document the version in design.
- **Cyrillic rendering** — if PT Serif TTF files are not correctly registered with react-pdf's `Font.register`, Cyrillic characters silently fall back to empty glyphs. Mitigation: verify in a spike before implementation; add a smoke test that checks the PDF blob is non-empty.
- **Page number in `fixed` block** — react-pdf's `render` prop for dynamic page numbers works inside `fixed` views but requires the `<Text render={...} />` pattern, not a plain `<Text>` child. Mitigation: document and test explicitly.

## Open Questions

_(none — all key decisions made during exploration)_
