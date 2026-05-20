## 1. Sync State Store

- [x] 1.1 Extend `src/crdt/sync-state.ts` types, defaults, and serialization to include `lastSuccessfulSyncAt`
- [x] 1.2 Preserve `lastSuccessfulSyncAt` through `markDirty()` and `reset()`, and add tests for round-trip and reset behavior
- [x] 1.3 Add subscribe/notify support in `src/crdt/sync-state.ts` for same-tab writes and cross-tab `storage` events

## 2. Reactive Sync Metadata API

- [x] 2.1 Add a selector-based React hook for sync metadata using `useSyncExternalStoreWithSelector`
- [x] 2.2 Export the new hook from the CRDT public API and add tests proving selectors ignore unrelated sync-state changes

## 3. Sync Engine Timestamping

- [x] 3.1 Update pull success handling to stamp `lastSuccessfulSyncAt` on successful `200` and `304` pull responses
- [x] 3.2 Update contiguous push and contiguous compact success paths to stamp `lastSuccessfulSyncAt`

## 4. Settings UI

- [x] 4.1 Render last successful sync information in the Settings Data section using the new selector-based sync metadata hook
- [x] 4.2 Show an explicit empty state when no successful sync has happened yet and keep placeholder actions unchanged
- [x] 4.3 Add settings page tests for both populated and empty sync timestamp states

## 5. Sync Status Presentation Refinements

- [x] 5.1 Extract sync-status rendering and refresh cadence into a dedicated settings component
- [x] 5.2 Show localized relative time for syncs newer than one day and exact localized date/time for older syncs
- [x] 5.3 Recompute recent relative labels on bounded cadence (5s under one minute, then 30s until one day) and stop updates after one day
- [x] 5.4 Clamp small clock skew so the UI never shows future phrasing for last successful sync
