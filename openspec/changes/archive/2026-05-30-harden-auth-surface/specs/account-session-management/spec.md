## MODIFIED Requirements

### Requirement: Account settings lists active sessions

The system SHALL allow a signed-in online user to view active authentication sessions for their account from Account settings. Each listed session SHALL display IP address, user agent, creation time, and expiration time when those values are available. Session metadata displayed in Account settings SHALL come from bounded or normalized persisted values. The system SHALL provide clear fallback text for unavailable metadata and SHALL NOT display raw session tokens.

#### Scenario: User views active sessions

- **WHEN** a signed-in user opens Account settings while online
- **THEN** the system SHALL load active sessions for the current account
- **AND** the system SHALL display the sessions in the Account settings Sessions card

#### Scenario: Session metadata is shown safely

- **WHEN** the sessions list contains a session with IP address, user agent, creation time, and expiration time metadata
- **THEN** the system SHALL display that metadata for the session
- **AND** the system SHALL NOT display the session token
- **AND** the user agent and IP address values SHALL already be bounded or normalized before display

#### Scenario: Session metadata is unavailable

- **WHEN** the sessions list contains a session without IP address, user agent, creation time, or expiration time metadata
- **THEN** the system SHALL display fallback text for each unavailable value
