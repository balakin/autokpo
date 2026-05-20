## Why

The KPO book is only useful when it contains ledger entries — without a way to add and view entries, the application cannot fulfill its core purpose. This is the second MVP capability after entity-profile.

## What Changes

- Add a KPO entries table that displays all recorded entries in the order they were added
- Add an "Add entry" form (modal or inline) with all required KPO row fields
- Support editing and deleting individual entries
- Persist entries to `localStorage` under `kpo:entries`
- Expose entries via React context for consumption by the PDF export module

## Capabilities

### New Capabilities

- `entry-management`: CRUD management of KPO ledger entries — add, view, edit, and delete individual rows in the KPO book table, with localStorage persistence and React context exposure

### Modified Capabilities

## Impact

- New `src/entries/` module (context, components, hooks)
- Adds `kpo:entries` localStorage key (JSON array)
- `EntriesContext` consumed by future `pdf-export` change
- New dependencies: `@internationalized/date` (HeroUI DatePicker requirement for `CalendarDate` / `DateValue` types), `react-currency-input-field` (currency input with string binding)
