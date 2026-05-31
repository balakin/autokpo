## MODIFIED Requirements

### Requirement: LDK is deleted on logout

The system SHALL delete the `local_wrapper` record for the authenticated user from IndexedDB on logout. The E2EE IndexedDB database SHALL NOT contain remote `wrapper` or `key_ring` records to preserve on logout; encrypted key-ring/profile fallback is handled by protected service-worker runtime caches.

#### Scenario: Logout removes local_wrapper

- **WHEN** the user logs out
- **THEN** the system SHALL delete the `local_wrapper` record for that userId from IndexedDB
- **AND** a later authenticated session SHALL require the encryption password before auto-unlock is restored

#### Scenario: Next session after logout requires password

- **WHEN** the user logs in after a previous logout
- **AND** no `local_wrapper` exists for that user
- **THEN** the system SHALL show the password unlock screen
- **AND** after successful password unlock SHALL generate a new LDK and store a new `local_wrapper`
