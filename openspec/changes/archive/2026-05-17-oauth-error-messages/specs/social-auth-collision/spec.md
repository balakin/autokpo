## MODIFIED Requirements

### Requirement: Unknown error codes still render the generic error fallback

When `OAuthCallback` receives an unrecognized error code (not `account_not_linked` or any Tier-1/Tier-2 code), the component SHALL display a generic localized failure message. The raw error code SHALL be rendered in small, muted text below the message (not as a prominent `Kod: <code>` line), so users can copy it for support purposes without it dominating the error card.

#### Scenario: Unknown error codes render generic message and small muted code

- **WHEN** `OAuthCallback` receives an `error` query param with any unrecognized code
- **THEN** the component displays a generic localized failure message
- **AND** the raw error code is rendered in small, muted text below the message
- **AND** the component shows the back-to-sign-in action pointing to `/sign-in`
