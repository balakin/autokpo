## MODIFIED Requirements

### Requirement: Key ring cache stores encrypted profile only

The system SHALL cache only the encrypted key-ring profile locally. The cache SHALL contain encrypted key-ring metadata/ciphertext and active wrapper metadata/ciphertext, and SHALL NOT contain plaintext MEK, plaintext DEK, or plaintext key-ring JSON. The durable offline cache SHALL be the service-worker-cached `GET /api/e2ee/key-ring` response rather than `key_ring` and `wrapper` IndexedDB object stores.

The E2EE IndexedDB database SHALL NOT maintain remote encrypted `key_ring` or password `wrapper` object stores. It SHALL keep only local unlock material such as `local_wrapper` records.

#### Scenario: Successful fetch updates encrypted runtime cache

- **WHEN** the backend returns a successful key-ring profile response from `GET /api/e2ee/key-ring`
- **THEN** the service worker SHALL be able to store the encrypted key-ring profile response in the named key-ring runtime cache
- **AND** the app SHALL NOT write the encrypted key-ring record to a `key_ring` IndexedDB object store
- **AND** the app SHALL NOT write the password wrapper fields to a `wrapper` IndexedDB object store

#### Scenario: Network-unavailable unlock may use encrypted runtime cache

- **WHEN** the backend key-ring endpoint is unavailable due to offline or network failure
- **AND** a cached successful `GET /api/e2ee/key-ring` response exists in the service-worker key-ring runtime cache
- **THEN** the system MAY use the cached encrypted profile for unlock
- **AND** the user SHALL still provide the encryption password to unwrap the MEK if no LDK or PIN local wrapper is present

#### Scenario: Non-network backend results do not fall back to stale app IndexedDB cache

- **WHEN** the backend key-ring request returns an authentication, not-found, conflict, validation, or contract error
- **THEN** the system SHALL NOT use a removed local encrypted IndexedDB key-ring cache as a fallback for that result

#### Scenario: Password wrapper is not persisted in IndexedDB after first unlock

- **WHEN** the user successfully unlocks encryption with a password
- **THEN** the system SHALL NOT persist the server password wrapper fields into a `wrapper` IndexedDB store
- **AND** subsequent offline unlock attempts SHALL obtain encrypted profile and wrapper data from the service-worker-cached key-ring GET response or fail if unavailable

### Requirement: Client refetches key-ring profile after password change

After a successful password change, the client SHALL refetch the key-ring profile through the shared key-ring fetch path so the React Query cache and service-worker runtime cache observe the new active password wrapper.

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

The encryption gate and unlock flows SHALL fetch the key-ring profile through a shared React Query query so a recent successful gate check can be reused during unlock without a duplicate GET. The query SHALL use a bounded freshness window, such as five minutes, and SHALL preserve the service-worker NetworkFirst cache as the durable offline fallback after reload.

#### Scenario: Unlock reuses recent gate key-ring fetch

- **WHEN** the encryption gate recently fetched the key-ring profile successfully
- **AND** the user submits the unlock form within the key-ring query freshness window
- **THEN** unlock SHALL use the cached query data without issuing a duplicate network GET

#### Scenario: Reloaded offline unlock uses service-worker cache

- **WHEN** the app reloads while offline
- **AND** the in-memory query cache is empty
- **AND** the service worker has a cached successful key-ring profile response
- **THEN** the shared key-ring fetch path SHALL be able to receive the cached response from the service worker
