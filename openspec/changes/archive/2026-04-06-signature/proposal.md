## Why

The official KPO template requires a signature block at the bottom of each book — "Sastavio" (compiled by) and "Odgovorno lice" (responsible person). Without this, a generated PDF would be incomplete and non-compliant.

## What Changes

- Add a `Signature` data model with two fields: `sastavioIme` and `odgovornoLiceIme`
- Add a signature form for entering and persisting these names
- Render the signature block at the bottom of the application view (and later in the PDF)
- Persist signature data to `localStorage` under `kpo:signature`

## Capabilities

### New Capabilities

- `signature`: Capture and persist the KPO signature block — "Sastavio" and "Odgovorno lice" names — and expose them via React context for PDF rendering

### Modified Capabilities

## Impact

- New `src/signatures/` module (schema, context, form component)
- Adds `kpo:signature` localStorage key (JSON object)
- `SignatureContext` consumed by future `pdf-export` change
- No new dependencies
