## ADDED Requirements

### Requirement: Signed-in user can permanently delete their account

The system SHALL allow a signed-in online user to permanently delete their own AutoKPO account from Account settings. Deletion SHALL remove the auth account, active sessions, server-synced CRDT data, and local user-specific browser data, and SHALL NOT require a separate email verification step.

#### Scenario: Confirmed deletion removes account and redirects

- **WHEN** a signed-in online user confirms account deletion with the required email confirmation
- **THEN** the system SHALL delete the signed-in Better Auth user directly
- **AND** the user's server-synced CRDT data SHALL be deleted
- **AND** the user's authenticated session SHALL be cleared
- **AND** the browser SHALL navigate to the signed-out goodbye page

#### Scenario: Deletion requires online state

- **WHEN** account deletion is requested while the browser is offline
- **THEN** the system SHALL NOT attempt the deletion request
- **AND** the UI SHALL communicate that account deletion requires internet access

### Requirement: Account deletion requires typed email confirmation

The account deletion confirmation modal SHALL display the current account email and require the user to type that email exactly before the destructive deletion action is enabled.

#### Scenario: Delete action disabled before email match

- **WHEN** the account deletion modal is open
- **AND** the typed confirmation value does not exactly match the current account email
- **THEN** the destructive delete action SHALL be disabled

#### Scenario: Delete action enabled after exact email match

- **WHEN** the account deletion modal is open
- **AND** the typed confirmation value exactly matches the current account email
- **THEN** the destructive delete action SHALL be enabled

#### Scenario: Modal explains permanence

- **WHEN** the account deletion modal is open
- **THEN** it SHALL explain that account deletion permanently removes the account and synchronized data
- **AND** it SHALL NOT present unsynchronized-change status as a separate warning condition

### Requirement: Deleted account sees signed-out goodbye page

The system SHALL provide a signed-out `/goodbye` page shown after successful account deletion. The page SHALL be available only in the signed-out route group and SHALL provide a concise completion message without offering account recovery.

#### Scenario: Deleted user lands on goodbye page

- **WHEN** account deletion succeeds
- **THEN** the browser SHALL navigate to `/goodbye`
- **AND** the page SHALL display a concise account-deleted message

#### Scenario: Signed-in user cannot view goodbye page

- **WHEN** a signed-in user navigates to `/goodbye`
- **THEN** the signed-out route guard SHALL redirect the user to `/dashboard`

### Requirement: Account deletion sends localized deleted-account email

The system SHALL send a localized email after account deletion to the deleted user's email address. The email SHALL state only that the AutoKPO account and synchronized data associated with that email address were permanently removed.

#### Scenario: Post-delete email is sent

- **WHEN** account deletion completes for a user with an email address
- **THEN** the worker SHALL send an account-deleted email to that email address

#### Scenario: Post-delete email uses preferred locale

- **WHEN** account deletion is requested with `X-Preferred-Locale: en`
- **THEN** the account-deleted email SHALL be translated using the English worker catalog

#### Scenario: Missing locale falls back to source locale

- **WHEN** account deletion is requested without a recognized `X-Preferred-Locale` header
- **THEN** the account-deleted email SHALL be sent in `sr-Latn`
