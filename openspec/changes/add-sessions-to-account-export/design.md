## Context

Account export (`account-export` spec) assembles a JSON file client-side using the auth client — no dedicated server endpoint. Account session management (`account-session-management` spec) already fetches active sessions from the same auth client to display and revoke them in Account settings. The sessions data is therefore available on the client without any new API work.

## Goals / Non-Goals

**Goals:**

- Add a `sessions` array to the exported JSON, containing the same session metadata already surfaced in Account settings (IP, user agent, creation time, expiration time, current-session flag)
- Bump `schemaVersion` from `1` to `2` to signal the new field

**Non-Goals:**

- Exposing raw session tokens in the export
- Changing how sessions are fetched or what the server stores
- Altering the existing export UI beyond the data content

## Decisions

### Reuse the existing sessions fetch

The session management UI already calls the auth client to list sessions. The export handler can call the same function/hook to retrieve sessions at export time rather than introducing a separate API call.

**Alternative considered**: A dedicated export endpoint that returns a combined payload in one round-trip. Rejected — the existing client-side assembly pattern works fine and avoids new server code for a low-frequency export action.

### Session entry shape mirrors the display model

Each entry in `sessions` will contain: `ipAddress`, `userAgent`, `createdAt`, `expiresAt`, `isCurrent`. Fields that are unavailable SHALL be `null`, consistent with how the existing `account.createdAt` field behaves.

**Alternative considered**: Exporting raw DB rows. Rejected — tokens must never appear in the export, and the display model is already normalized/bounded.

### schemaVersion bump to 2

Consumers parsing `schemaVersion: 1` files should not break on encountering the new field (additive change), but bumping makes version detection unambiguous for tooling or future migrations.

## Risks / Trade-offs

- [Sessions fetch adds a second async call at export time] → Mitigation: run concurrently with other auth-client calls; the export is already an async user action, added latency is negligible.
- [Large session count could bloat the export file] → Mitigation: no cap needed at this stage — active session counts are inherently small (bounded by device/browser count per user).

## Migration Plan

No server-side or database migration required. The change is limited to the client-side export assembly function and the updated spec. Old exports (schemaVersion 1) remain valid; new exports will carry schemaVersion 2.
