## ADDED Requirements

### Requirement: Public auth path excludes signed-in app modules

The client bundle graph for signed-out authentication routes SHALL exclude signed-in-only application modules until the user is known to be authenticated. Signed-in-only modules include CRDT/Yjs initialization, the signed-in app shell, and signed-in route page modules. The eager route graph SHALL keep authentication providers, auth guards, signed-out route pages, lightweight lazy wrappers/fallbacks, and redirect logic needed to make the auth decision.

#### Scenario: Signed-out user opens sign-in route

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the app SHALL render the sign-in experience without loading the signed-in application shell chunk
- **AND** the app SHALL NOT initialize CRDT/Yjs state for a user

#### Scenario: Signed-out user opens protected route directly

- **WHEN** a signed-out user opens `/dashboard` directly
- **THEN** the auth gate SHALL redirect the user to `/sign-in`
- **AND** `SignedInGate` SHALL make the redirect decision without requiring the signed-in application shell chunk

### Requirement: Signed-in app shell loads after authentication

The system SHALL lazy-load the signed-in application shell only after auth state indicates a signed-in user. The signed-in loading path SHALL render through `SignedInGate`, a signed-in suspense boundary, and a lazy `SignedInApp` import. The lazy-loaded shell SHALL mount the existing CRDT provider and render the app shell layout for signed-in routes.

#### Scenario: Signed-in user opens protected route

- **WHEN** a signed-in user opens `/dashboard`
- **THEN** the system SHALL load the signed-in application shell
- **AND** the signed-in shell SHALL mount the CRDT provider for the authenticated user
- **AND** the dashboard route content SHALL render inside the app shell

### Requirement: Signed-in pages load as route chunks

The system SHALL split signed-in page modules from the eager public auth bundle and from the signed-in shell. Dashboard, book library, book-scoped UI, settings layout, general settings, and account settings SHALL be loaded through lazy route component imports.

#### Scenario: User navigates to a signed-in page

- **WHEN** a signed-in user navigates to a signed-in route
- **THEN** the system SHALL load the code for that route on demand
- **AND** unrelated signed-in page modules SHALL NOT be required before the selected route can render

### Requirement: Bundle analysis remains repeatable

The project SHALL provide a repeatable way to compare client chunk output before and after the split using the existing Vite bundle analysis flow. The implementation SHALL document the observed eager entry size reduction and emitted lazy shell/route chunks.

#### Scenario: Developer analyzes bundle output

- **WHEN** a developer runs the app bundle analysis command
- **THEN** the generated client analysis SHALL show a smaller eager `index` chunk than the pre-change baseline
- **AND** signed-in app shell or route code SHALL appear in one or more lazy JavaScript chunks

#### Scenario: Developer reviews implementation bundle evidence

- **WHEN** a developer reviews the recorded implementation notes
- **THEN** the notes SHALL include the pre-change eager entry baseline and current eager entry size
- **AND** the notes SHALL identify lazy chunks for the signed-in shell and signed-in route pages
