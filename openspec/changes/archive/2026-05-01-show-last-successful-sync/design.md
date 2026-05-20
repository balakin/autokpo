## Context

The sync engine already keeps per-device server relationship metadata in `localStorage` under `autokpo:sync`. That state is intentionally outside the shared Yjs document because cursor and dirty tracking are local device concerns rather than replicated domain data.

Today the Settings page can trigger a manual sync, but it has no reactive way to read sync metadata. The only existing selector-based subscription surface in the app is `useYDoc(...)`, which is document-backed and not appropriate for side-channel sync state.

This change crosses the sync engine, sync-state store, and Settings UI. It also needs to behave correctly in the app's multi-tab model, where only the leader tab talks to the network while follower tabs still need fresh sync status in the UI.

## Goals / Non-Goals

**Goals:**

- Persist a per-device `lastSuccessfulSyncAt` value alongside existing sync metadata
- Update that timestamp only when sync is actually acknowledged: successful pull, contiguous push, and contiguous compact
- Expose sync metadata through a selector-based subscription API suitable for React UI
- Keep same-tab and cross-tab Settings views up to date without polling
- Render localized sync status text that is relative for recent syncs and exact date/time for older syncs
- Recompute relative labels on a bounded timer cadence and stop timer updates after one day

**Non-Goals:**

- Adding sync status into the shared Yjs document
- Defining a long-lived "sync in progress" or error state model for the UI
- Changing HTTP sync protocol behavior beyond stamping the new timestamp
- Introducing server-authored timestamps or clock reconciliation across devices

## Decisions

### Keep `lastSuccessfulSyncAt` in the existing `autokpo:sync` side-channel

The easiest and most coherent place for the timestamp is the existing sync-state JSON object in `localStorage`. The field is per-device transport metadata, just like `cursor`, `stateVector`, and `dirty`, so putting it into Yjs would incorrectly replicate it across devices and bloat document history.

Alternative considered: store the timestamp in the Y.Doc so all UI can read it with `useYDoc`. Rejected because this timestamp is not collaborative application state and would create needless replicated churn.

### Stamp only after successful pull or contiguous push/compact acknowledgement

`lastSuccessfulSyncAt` will represent the last time this device successfully synchronized with the server, not the last time a request started. The sync engine already has explicit success branches for pull and for the contiguous `prevHead === cursor` cases of push and compact, which makes those branches the authoritative write points.

Alternative considered: stamp when a request is fired or on any 2xx push/compact response. Rejected because gap-detected push/compact responses do not yet mean the local device has reconciled its view of server state.

### Use a selector-based external store backed by `sync-state.ts`

`sync-state.ts` will own a small subscribe/notify mechanism and expose a hook built on `useSyncExternalStoreWithSelector`. This matches the existing `useYDoc` pattern and lets UI select only `lastSuccessfulSyncAt` without re-rendering on unrelated sync metadata changes.

Alternative considered: read sync state ad hoc in Settings and rely on incidental rerenders. Rejected because the timestamp would become stale, especially in follower tabs.

### Notify through both in-memory listeners and the browser `storage` event

The store must notify same-tab subscribers immediately after `write()`, because the `storage` event does not fire in the same tab that performed `localStorage.setItem`. It must also bridge cross-tab writes through a shared `storage` listener so follower tabs update when the leader advances sync state.

Alternative considered: rely only on `storage`. Rejected because same-tab UI would not update after local writes.

### Isolate timestamp rendering + timer cadence in a dedicated component

`LastSuccessfulSyncStatus` encapsulates sync-status display logic so `SettingsPage` stays focused on layout/actions. The component reads only `lastSuccessfulSyncAt` through the selector hook, applies locale-aware formatting, and controls refresh cadence:

- `< 1 minute old` → recompute every 5 seconds
- `>= 1 minute and < 1 day old` → recompute every 30 seconds
- `>= 1 day old` → show exact localized date+time and stop timer updates

Alternative considered: keep formatting and timer logic inline in `SettingsPage`. Rejected because it tangles presentation concerns with page wiring and makes cadence behavior harder to test.

### Clamp minor clock skew to avoid future phrasing

Because `lastSuccessfulSyncAt` is client-authored, tiny clock drift or async ordering can briefly make `now < lastSuccessfulSyncAt`. Relative labels should never read as future sync (for example, "in less than a minute") for a past sync event, so relative formatting clamps comparison time to `max(now, lastSuccessfulSyncAt)`.

Alternative considered: show future phrasing when skew happens. Rejected because it is confusing in this informational context and does not reflect user intent.

### Preserve `lastSuccessfulSyncAt` across `reset()`

`reset()` is used for 410 recovery. It should clear cursor and state vector while preserving the historical last successful sync timestamp, because a failed recovery path does not erase the fact that the device synced successfully in the past.

Alternative considered: clear the timestamp on reset. Rejected because it would make the Settings UI misleadingly look like the device had never synced.

## Risks / Trade-offs

- **Client clock accuracy** → The timestamp is generated locally, so a device with a bad clock may show an inaccurate time. This is acceptable because the feature is informational and per-device.
- **Client clock drift at boundaries** → Minor local skew can affect exact-relative boundaries. Clamping avoids misleading future labels while preserving local-only semantics.
- **Frequent sync-state writes** → Cursor and dirty can change more often than the timestamp. Selector-based subscriptions mitigate unnecessary rerenders by letting Settings select only `lastSuccessfulSyncAt`.
- **Cross-tab listener lifecycle** → A custom subscription store adds browser listener management. Keeping all listener bookkeeping inside `sync-state.ts` limits this complexity to one module.
- **304 semantics** → A successful pull with no new records still counts as a successful server sync. This is intentional so the UI reflects recent contact even when nothing changed.

## Migration Plan

The new field is additive. Existing `autokpo:sync` payloads without `lastSuccessfulSyncAt` will be read as `null` and rewritten on the next successful sync. No data migration or server rollout is required.

## Open Questions

None.
