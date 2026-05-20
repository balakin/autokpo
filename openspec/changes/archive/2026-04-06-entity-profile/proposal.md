## Why

KPO book is a mandatory legal document for паушал (flat-rate) taxpayers in Serbia. Before any income entries can be recorded, the book must identify the legal entity: PIB, full name, business trading name, registered address, taxpayer code, and activity code. These fields appear on every page header of the official KPO template. Without them the generated PDF is legally incomplete.

## What Changes

- Introduce an **entity profile form** as the first step of the KPO book constructor
- The profile captures all six legally required header fields
- Profile data persists in `localStorage` so the user does not re-enter it on reload
- Profile data is injected into every exported PDF page header

## Capabilities

### New Capabilities

- `entity-profile`: Capture, validate, and persist the six KPO header fields (PIB, Obveznik, Firma-radnje, Sedište, Šifra poreskog obveznika, Šifra delatnosti); inject them into the PDF export

### Modified Capabilities

_(none — this is the first capability)_

## Impact

- New React component: `EntityProfileForm`
- New `localStorage` key: `kpo:entity-profile`
- PDF export must read entity profile to render the header section
