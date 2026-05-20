## MODIFIED Requirements

### Requirement: IndexedDB persistence and bootstrap order

The system SHALL await `y-indexeddb`'s `whenSynced` before mounting the React tree, so the first render reads from a fully hydrated Y.Doc and never flashes empty state. After `whenSynced` resolves, the system SHALL call `bootstrap(ydoc, initialLocale)` where `initialLocale` is the locale currently stored in `localStorage` (read by `CrdtProvider` before the doc is ready). `bootstrap()` SHALL seed `user.locale` with `initialLocale` only if the field is absent — existing accounts are unaffected.

#### Scenario: Hydration completes before render

- **WHEN** the application starts and IndexedDB contains prior Y.Doc state
- **THEN** the React tree mounts only after persistence has finished loading and the document reflects the persisted content on the first render

#### Scenario: Locale defaulted on first start from device language

- **WHEN** the Y.Doc has no `user.locale` value after IndexedDB has finished syncing
- **THEN** the system SHALL set `user.locale` to the `initialLocale` value passed to `bootstrap()`
- **AND** `initialLocale` SHALL be the locale stored in `localStorage` at mount time (which may reflect `navigator.language` for brand-new devices)

#### Scenario: Existing account locale is not overwritten

- **WHEN** the Y.Doc already has a `user.locale` value after IndexedDB has finished syncing
- **THEN** `bootstrap()` SHALL NOT modify `user.locale`
- **AND** `LocaleSynchronizer` SHALL sync the existing CRDT locale to `localStorage` on mount
