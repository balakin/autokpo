## ADDED Requirements

### Requirement: Session and key-ring queries are persisted to IndexedDB

The application SHALL persist the `session` and `key-ring-profile` React Query cache entries to a dedicated IndexedDB store on every cache update. Persisted data SHALL be restored into the query cache on page load before any query fetches are attempted. The persisted cache SHALL be considered valid for up to 60 days (matching the server session lifetime); data older than 60 days SHALL be discarded on restore.

Only the `session` and `key-ring-profile` queries SHALL be included in the persisted cache. No other queries SHALL be serialised to IndexedDB by the persistence layer.

#### Scenario: Restored data is available before network

- **WHEN** the page loads while the browser is offline
- **AND** valid persisted session and key-ring data exist in IndexedDB (age < 60 days)
- **THEN** the application SHALL restore both queries from IndexedDB before any `queryFn` is called
- **AND** components SHALL receive `status: 'success'` with the restored data immediately

#### Scenario: Offline query is paused, not failed

- **WHEN** the page loads while the browser is offline
- **AND** valid persisted data has been restored
- **THEN** each persisted query SHALL have `fetchStatus: 'paused'` (background refetch suspended)
- **AND** the query SHALL NOT transition to `status: 'error'`

#### Scenario: Background refetch updates persisted cache when online

- **WHEN** the browser is online
- **AND** a persisted query's data is stale
- **THEN** the query SHALL refetch from the network
- **AND** on success, the persisted cache in IndexedDB SHALL be updated automatically

#### Scenario: Expired persisted data is discarded

- **WHEN** the page loads
- **AND** the persisted cache entry is older than 60 days
- **THEN** the persisted data SHALL be discarded
- **AND** queries SHALL behave as if no persisted cache exists (normal online/offline behaviour applies)

#### Scenario: IDB unavailable falls back gracefully

- **WHEN** IndexedDB is unavailable (e.g. private browsing restrictions)
- **THEN** the application SHALL start without persisted data
- **AND** queries SHALL behave with normal online/offline semantics (no crash, no error boundary triggered)

### Requirement: Persisted cache is cleared on sign-out and account deletion

The application SHALL delete the persisted IndexedDB cache entry as part of the sign-out and account deletion cleanup flows. After deletion, no persisted query data from the previous user SHALL be restored on subsequent page loads.

#### Scenario: Sign-out clears persisted cache

- **WHEN** a signed-in user completes logout successfully
- **THEN** the application SHALL delete the persisted cache from IndexedDB
- **AND** a subsequent page reload SHALL find no persisted data to restore

#### Scenario: Account deletion clears persisted cache

- **WHEN** a signed-in user deletes their account
- **THEN** the application SHALL delete the persisted cache from IndexedDB

#### Scenario: IDB clear failure does not block sign-out

- **WHEN** the IndexedDB delete operation fails during sign-out
- **THEN** the sign-out flow SHALL complete (in-memory cache is cleared, session broadcast is sent)
- **AND** the failure SHALL NOT surface as a user-visible error

### Requirement: In-memory retention matches session lifetime

The `gcTime` for both the `session` and `key-ring-profile` queries SHALL be set to 60 days. This ensures in-memory data is not garbage-collected between component unmounts during normal app usage, consistent with the server session lifetime.

#### Scenario: Persisted queries are not prematurely garbage-collected

- **WHEN** the session or key-ring query has no active subscribers
- **THEN** the in-memory cache entry SHALL remain for at least 60 days before automatic GC

### Requirement: Network mode reflects persistence-based offline strategy

The `session` and `key-ring-profile` queries SHALL use the default `networkMode` (`'online'`). These queries SHALL NOT use `networkMode: 'offlineFirst'`.

#### Scenario: Offline refetch is paused, not attempted

- **WHEN** the browser is offline
- **AND** a persisted query would otherwise refetch (stale data, window focus, etc.)
- **THEN** the refetch SHALL be paused (`fetchStatus: 'paused'`) rather than attempted
- **AND** the refetch SHALL resume automatically when the browser comes back online
