## Purpose

Define account session management behavior for viewing and revoking active authentication sessions from Account settings.

## Requirements

### Requirement: Account settings lists active sessions

The system SHALL allow a signed-in online user to view active authentication sessions for their account from Account settings. Each listed session SHALL display IP address, user agent, creation time, and expiration time when those values are available. The system SHALL provide clear fallback text for unavailable metadata and SHALL NOT display raw session tokens.

#### Scenario: User views active sessions

- **WHEN** a signed-in user opens Account settings while online
- **THEN** the system SHALL load active sessions for the current account
- **AND** the system SHALL display the sessions in the Account settings Sessions card

#### Scenario: Session metadata is shown safely

- **WHEN** the sessions list contains a session with IP address, user agent, creation time, and expiration time metadata
- **THEN** the system SHALL display that metadata for the session
- **AND** the system SHALL NOT display the session token

#### Scenario: Session metadata is unavailable

- **WHEN** the sessions list contains a session without IP address, user agent, creation time, or expiration time metadata
- **THEN** the system SHALL display fallback text for each unavailable value

### Requirement: Current session is identified and protected

The system SHALL identify the current authentication session in the sessions list. The current session SHALL appear before non-current sessions, SHALL be visually marked, and SHALL NOT provide an individual revoke action.

#### Scenario: Current session is marked

- **WHEN** the sessions list includes the current session
- **THEN** the system SHALL label that session as the current session
- **AND** the current session SHALL appear before non-current sessions

#### Scenario: Current session cannot be individually revoked

- **WHEN** the sessions list displays the current session
- **THEN** the system SHALL NOT show an action to revoke that individual session

### Requirement: User can revoke one non-current session

The system SHALL allow a signed-in online user to revoke a single non-current authentication session. The operation SHALL use the selected session internally without exposing its token in the UI. After successful revocation, the system SHALL refresh the displayed sessions.

#### Scenario: User revokes one other session

- **WHEN** the user activates the revoke action for a non-current session
- **AND** the revocation succeeds
- **THEN** the selected session SHALL be revoked
- **AND** the sessions list SHALL be refreshed

#### Scenario: Individual session revocation fails

- **WHEN** the user activates the revoke action for a non-current session
- **AND** the revocation fails
- **THEN** the system SHALL show an error message
- **AND** the system SHALL keep the sessions list available for retry or refresh

### Requirement: User can revoke all non-current sessions

The system SHALL allow a signed-in online user to revoke all authentication sessions except the current session. The action SHALL be unavailable when there are no non-current sessions. After successful revocation, the system SHALL refresh the displayed sessions.

#### Scenario: User revokes all other sessions

- **WHEN** the user activates the revoke-all-other-sessions action
- **AND** at least one non-current session exists
- **AND** the revocation succeeds
- **THEN** all non-current sessions SHALL be revoked
- **AND** the current session SHALL remain active
- **AND** the sessions list SHALL be refreshed

#### Scenario: No other sessions exist

- **WHEN** the sessions list contains only the current session
- **THEN** the system SHALL communicate that there are no other active sessions
- **AND** the revoke-all-other-sessions action SHALL NOT be displayed

#### Scenario: Revoke all other sessions fails

- **WHEN** the user activates the revoke-all-other-sessions action
- **AND** the revocation fails
- **THEN** the system SHALL show an error message
- **AND** the current session SHALL remain usable
