## Why

Flat-rate taxpayers (паушалци) are legally required to maintain a KPO book on the prescribed form and to sign and stamp it themselves at year-end. The application already supports entering all required data (entity profile, entries, signature), but cannot generate a PDF for printing — without this the user cannot fulfil their legal obligation.

## What Changes

- Add a PDF export button to the main application view
- Generate a multi-page PDF document conforming to the official KPO образац (Правилник, "Sl. glasnik RS" br. 140/2004)
- Each page repeats the entity profile header and column headers (образац requirements)
- Entries table flows across pages automatically
- Totals row (збир колона 3, 4, 5) appears below the last entry (Члан 13, став 1)
- Signature block (Саставио / Одговорно лице) appears once at the end, after the totals row (Члан 13, став 2)
- Page numbers appear on every page (Члан 4, став 2)
- PDF is generated client-side with no server dependency
- Add `@react-pdf/renderer` as a production dependency
- Add PT Serif (OFL) embedded as TTF for Cyrillic + Latin coverage

## Capabilities

### New Capabilities

- `pdf-export`: Generate and download a legally compliant KPO PDF document from the current application state (entity profile, entries, signature), conforming to the official КПО образац layout

### Modified Capabilities

_(none — existing specs do not change; EntriesContext, EntityProfileContext, and SignatureContext are already scoped for PDF consumption)_

## Impact

- New `src/pdf/` module with react-pdf document components
- PDF export button added to `src/app.tsx`
- New production dependency: `@react-pdf/renderer`
- Font file(s) added to `public/fonts/` (TTF, Cyrillic + Latin coverage)
- Lazy-loaded via dynamic `import()` to keep initial bundle size unaffected
- No changes to existing localStorage keys, schemas, or context APIs
