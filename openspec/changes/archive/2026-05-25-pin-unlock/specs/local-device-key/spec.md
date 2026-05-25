## MODIFIED Requirements

### Requirement: local_wrapper schema supports future PIN method

The `local_wrapper` IndexedDB object store SHALL use a `method` field to distinguish unlock methods. The store SHALL support `method: 'ldk'` and `method: 'pin'` records. At most one record SHALL exist per user at any time — setting a PIN wrapper replaces any existing LDK wrapper, and switching back to LDK replaces any existing PIN wrapper. The store keyPath SHALL remain `userId`.

#### Scenario: local_wrapper record has method field

- **WHEN** the system writes a `local_wrapper` record
- **THEN** the record SHALL include a `method` field set to either `'ldk'` or `'pin'`
- **AND** the store keyPath SHALL be `userId` enforcing at most one local wrapper per user

#### Scenario: At most one local wrapper per user

- **WHEN** the system writes a new local wrapper for a user
- **THEN** any previously stored `local_wrapper` for that user SHALL be overwritten
- **AND** the store SHALL contain exactly one record for that user
