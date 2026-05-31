## MODIFIED Requirements

### Requirement: Key ring cache stores encrypted profile only

The system SHALL cache only the encrypted key-ring profile locally. The cache SHALL contain encrypted key-ring metadata/ciphertext and active wrapper metadata/ciphertext, and SHALL NOT contain plaintext MEK, plaintext DEK, or plaintext key-ring JSON. The durable offline cache SHALL be the service-worker-cached `GET /api/e2ee/key-ring` response rather than `key_ring` and `wrapper` IndexedDB object stores.

The `cacheKeyRingProfile` helper SHALL update both the React Query cache for the active tab and the named service-worker runtime cache so the Workbox NetworkFirst fallback stays warm for offline use. The `keyRingProfileQueryOptions(userId)` factory SHALL scope the query key per authenticated user.

The E2EE IndexedDB database SHALL NOT maintain remote encrypted `key_ring` or password `wrapper` object stores. It SHALL keep only local unlock material such as `local_wrapper` records.

#### Scenario: Successful fetch or mutation seeds encrypted runtime cache

- **WHEN** the backend returns a successful key-ring profile response from `GET /api/e2ee/key-ring`
- **OR** a mutation (setup, unlock, password change) produces an updated key-ring profile
- **THEN** the app SHALL update the React Query key-ring cache via `cacheKeyRingProfile`
- **AND** the app SHALL seed the named key-ring service-worker runtime cache via `cacheKeyRingProfile`
- **AND** the app SHALL NOT write the encrypted key-ring record to a `key_ring` IndexedDB object store
- **AND** the app SHALL NOT write the password wrapper fields to a `wrapper` IndexedDB object store

#### Scenario: Network-unavailable unlock may use encrypted runtime cache

- **WHEN** the backend key-ring endpoint is unavailable due to offline or network failure
- **AND** a cached successful `GET /api/e2ee/key-ring` response exists in the service-worker key-ring runtime cache
- **THEN** the shared key-ring query (`networkMode: 'offlineFirst'`) SHALL receive the cached response from the service worker
- **AND** the user SHALL still provide the encryption password to unwrap the MEK if no LDK or PIN local wrapper is present

#### Scenario: Non-network backend results do not fall back to stale app IndexedDB cache

- **WHEN** the backend key-ring request returns an authentication, not-found, conflict, validation, or contract error
- **THEN** the system SHALL NOT use a removed local encrypted IndexedDB key-ring cache as a fallback for that result
- **AND** the encryption gate SHALL dispatch a `check-failed` or `check-missing` action rather than attempting to read stale local records

#### Scenario: Password wrapper is not persisted in IndexedDB after first unlock

- **WHEN** the user successfully unlocks encryption with a password
- **THEN** the system SHALL NOT persist the server password wrapper fields into a `wrapper` IndexedDB store
- **AND** subsequent offline unlock attempts SHALL obtain encrypted profile and wrapper data from the service-worker-cached key-ring GET response or fail if unavailable

### Requirement: Client refetches key-ring profile after password change

After a successful password change, the client SHALL refetch the key-ring profile through the shared key-ring fetch path (`queryClient.fetchQuery` with `staleTime: 0`) so the React Query cache and service-worker runtime cache observe the new active password wrapper. After successful mutations (setup, unlock with new profile), the client SHALL seed the key-ring cache via `cacheKeyRingProfile`.

#### Scenario: Successful change refreshes cached server wrapper

- **WHEN** the change-password endpoint returns success
- **THEN** the client SHALL request the latest key-ring profile
- **AND** the client SHALL update the shared key-ring query data from the fetched profile
- **AND** the service worker SHALL be able to update the named key-ring runtime cache from the successful GET response
- **AND** the client SHALL leave the local unlock wrapper unchanged

#### Scenario: Refetch failure uses existing error handling

- **WHEN** the change-password endpoint returns success
- **AND** the subsequent key-ring profile refetch fails
- **THEN** the client SHALL surface the error using the current key-ring fetch error handling
- **AND** a later unlock SHALL use the latest server password wrapper when the key-ring profile is fetched successfully

## ADDED Requirements

### Requirement: Key-ring fetches share a query cache

The encryption gate and unlock flows SHALL fetch the key-ring profile through a shared React Query query (`keyRingProfileQueryOptions(userId)`) so a recent successful gate check can be reused during unlock without a duplicate GET. The query SHALL use a bounded freshness window (five minutes), `networkMode: 'offlineFirst'`, and a userId-scoped query key (`['key-ring-profile', userId]`). The query preserves the service-worker NetworkFirst cache as the durable offline fallback after reload. After successful mutations, `cacheKeyRingProfile` SHALL update both the React Query cache and the named service-worker runtime cache.

#### Scenario: Unlock reuses recent gate key-ring fetch

- **WHEN** the encryption gate recently fetched the key-ring profile successfully
- **AND** the user submits the unlock form within the key-ring query freshness window
- **THEN** unlock SHALL use the cached query data without issuing a duplicate network GET

#### Scenario: Reloaded offline unlock uses service-worker cache

- **WHEN** the app reloads while offline
- **AND** the in-memory query cache is empty
- **AND** the service worker has a cached successful key-ring profile response
- **THEN** the shared key-ring fetch path SHALL be able to receive the cached response from the service worker
