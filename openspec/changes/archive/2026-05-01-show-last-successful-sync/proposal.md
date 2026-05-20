## Why

The Settings page can trigger manual sync, but it does not show when the last successful sync happened. Users need a visible sync timestamp so they can tell whether this device has recently contacted the server.

## What Changes

- Extend the CRDT sync metadata side-channel to persist a per-device `lastSuccessfulSyncAt` timestamp alongside cursor, state vector, and dirty state
- Update the sync engine to stamp `lastSuccessfulSyncAt` when a pull succeeds and when a push or compact succeeds contiguously with the current cursor
- Expose sync metadata through a selector-based subscription hook so UI can react to sync-state changes without polling
- Show the last successful sync time in the Settings page's Data section under the action buttons with adaptive formatting
- Keep relative labels fresh with lightweight client-side recalculation and stop updates once the timestamp becomes older than one day

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crdt-store`: Sync state side-channel requirements expand to include a persisted `lastSuccessfulSyncAt` field and reactive subscription semantics for UI consumers
- `settings`: Data section displays a localized last successful sync status with adaptive refresh and fallback exact date/time formatting

## Impact

- `apps/app/src/crdt/sync-state.ts` — extend stored sync metadata and add subscription support for same-tab and cross-tab updates
- `apps/app/src/crdt/use-sync-engine.ts` — stamp `lastSuccessfulSyncAt` on successful pull and contiguous push/compact acknowledgements
- `apps/app/src/crdt/` public API — add a selector-based hook for reading sync metadata from React
- `apps/app/src/settings/settings-page.tsx` — render a dedicated sync-status component in the Data section
- `apps/app/src/settings/last-successful-sync-status.tsx` — own formatting + timer cadence for sync timestamp display
- `apps/app/src/crdt/__tests__/*` and `apps/app/src/settings/__tests__/*` — cover timestamp persistence, notifications, and settings rendering
