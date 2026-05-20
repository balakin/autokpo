## Context

AutoKPO is a local-first PWA. All app content (books, entries, profiles, signatures) lives in a Yjs `Y.Doc` persisted to IndexedDB, synced to Cloudflare D1 as opaque binary blobs. Account metadata (name, email, OAuth provider) lives in D1 tables managed by better-auth.

The general settings page already has a disabled "Izvezi podatke" button in the "Podaci" card. The account settings page shows account profile and active sessions when online.

## Goals / Non-Goals

**Goals:**

- Make state export work offline (reads Y.Doc directly, no network)
- Make account export work online (fetches from auth client)
- Remove two placeholder buttons that will not be implemented
- Produce machine-readable JSON files that satisfy GDPR portability requirements

**Non-Goals:**

- Import / restore from export file
- Server-side export endpoint
- Encrypting or signing the export file
- Exporting CRDT binary blobs (raw Yjs wire format is not machine-readable)
- Exporting session history or IP addresses

## Decisions

### Decision: Client-side only — no new server endpoint

Account data for the export can be assembled entirely from `authClient.getSession()` (name, email, emailVerified, image, createdAt) and `authClient.listAccounts()` (OAuth providers). A dedicated server endpoint would add complexity with no benefit, since the auth client already exposes this data.

**Alternative considered**: `GET /api/account/export` returning a server-assembled JSON. Rejected — extra code path, requires auth middleware, and the auth client already covers the data.

### Decision: State export reads the live Y.Doc snapshot

The Y.Doc is fully hydrated by the time any settings UI renders (the app only mounts after `whenReady` resolves). Calling `.toJSON()` on the relevant Y.Maps/Y.Arrays produces a plain-JS snapshot synchronously — no async, no IndexedDB reads.

**Alternative considered**: Re-opening IndexedDB directly. Rejected — the live doc is authoritative and already in memory; reading IndexedDB separately would be redundant and could race with in-flight writes.

### Decision: Shared download helper, two separate export functions

A small `src/settings/export.ts` module provides:

1. `downloadJson(filename, data)` — creates a Blob, a temporary object URL, clicks a hidden `<a>`, then revokes the URL
2. `buildStateExport(ydoc)` — reads books, entries, profiles, signatures, locale from the Y.Doc and returns the export object
3. `buildAccountExport()` — calls authClient, assembles the account export object

The UI components call these functions on button press. No React state needed beyond the mutation's pending flag.

**Alternative considered**: Inline the logic in the components. Rejected — export logic is non-trivial and should be independently testable.

### Decision: Remove "Uvezi podatke" and "Obriši sve podatke" buttons

These buttons are `isDisabled` placeholders with no planned implementation timeline. Keeping them creates false affordance. They are removed entirely rather than kept with a tooltip.

### Decision: Account export card placement in account settings

New "Vaši podaci" card is appended after the sessions card. Account deletion is already in the profile card; grouping export near the bottom (after sessions) separates casual data-access from destructive actions.

## Risks / Trade-offs

- **Large Y.Doc snapshot** → The export is generated synchronously on the main thread. For users with many years of entries this could block briefly. Mitigation: acceptable for a one-time action; no spinner needed given typical data sizes (entries are small structs).
- **`authClient.listAccounts()` shape** → The auth client response shape may vary. Mitigation: extract provider IDs defensively, fall back to empty array if parsing fails.
- **Clock skew in filename** → Date in filename uses `new Date()` local time. Mitigation: acceptable; no precision guarantee needed.
