## ADDED Requirements

### Requirement: Auth-gated application shell

The system SHALL resolve session state before mounting the signed-in application subtree. While session state is unknown, the application SHALL render a loading experience. When no session exists, the application SHALL render a signed-out entry page that does not mount the CRDT runtime or signed-in routes. When a session exists, the application SHALL mount the signed-in subtree.

#### Scenario: Signed-out boot renders auth entry only

- **WHEN** the application boots and the resolved session is absent
- **THEN** the application renders the signed-out entry page
- **AND** it SHALL NOT mount the CRDT runtime, sync engine, or signed-in router subtree

#### Scenario: Signed-in boot mounts application after session resolution

- **WHEN** the application boots and the resolved session contains a user id
- **THEN** the application renders the signed-in subtree for that user

### Requirement: Session state and auth actions

The system SHALL expose auth state through an `AuthProvider` that provides `loading`, `signed_out`, and `signed_in` statuses, the current `userId`, and `signIn()` / `logout()` actions. Auth state SHALL act as the top-level kill switch for the signed-in subtree.

#### Scenario: Sign-in transitions into signed-in state

- **WHEN** `signIn()` succeeds
- **THEN** the auth state becomes `signed_in`
- **AND** the provider exposes a non-null `userId`

#### Scenario: Signed-out state unmounts the signed-in subtree

- **WHEN** auth state changes from `signed_in` to `signed_out`
- **THEN** the signed-in subtree unmounts in every healthy tab
- **AND** the tab stops signed-in runtime activity through React lifecycle cleanup

### Requirement: Mock session source before backend auth exists

Until backend session endpoints are implemented, the system SHALL emulate session fetch, sign-in, and logout with asynchronous operations that wait about 250 milliseconds and persist a signed-in marker in `localStorage`.

#### Scenario: Mock session fetch resolves signed-out state

- **WHEN** the mock session check completes and no signed-in marker exists
- **THEN** the provider exposes `signed_out`

#### Scenario: Mock sign-in stores the signed-in marker

- **WHEN** the mock sign-in action succeeds
- **THEN** the system writes the signed-in marker to `localStorage`
- **AND** subsequent session checks resolve to `signed_in`

#### Scenario: Mock logout removes the signed-in marker

- **WHEN** the mock logout action succeeds
- **THEN** the system removes or resets the signed-in marker in `localStorage`
- **AND** subsequent session checks resolve to `signed_out`
