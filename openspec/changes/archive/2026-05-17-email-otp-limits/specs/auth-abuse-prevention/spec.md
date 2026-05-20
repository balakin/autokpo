## ADDED Requirements

### Requirement: OTP resend reuses the existing code

When a user requests a resend before the current OTP has expired, the worker SHALL reuse the existing OTP rather than generating a new one. The existing OTP's expiry SHALL be extended from the moment of resend. At no point SHALL more than one valid OTP exist for a given email address.

#### Scenario: Resend returns the same OTP code

- **WHEN** a user requests a resend while a valid OTP already exists for their email
- **THEN** the same OTP code SHALL be sent (not a new one)
- **AND** the OTP's expiry SHALL be reset to the full expiry window from the time of resend

#### Scenario: Only one valid OTP exists after resend

- **WHEN** a user has received an OTP and then requests a resend
- **THEN** only one valid OTP SHALL exist for that email address
- **AND** the previously received code SHALL remain valid (it is the same code)

### Requirement: OTP verification is limited to 5 attempts

The worker SHALL track failed OTP verification attempts. After 5 consecutive failed attempts, the OTP SHALL be invalidated regardless of its remaining expiry time. The user MUST request a new OTP to continue.

#### Scenario: OTP is invalidated after 5 failed attempts

- **WHEN** a user submits an incorrect OTP 5 times for the same code
- **THEN** the OTP SHALL be invalidated
- **AND** subsequent verification attempts with any code SHALL fail until a new OTP is requested

#### Scenario: Correct OTP before attempt limit succeeds

- **WHEN** a user submits the correct OTP within the first 5 attempts
- **THEN** verification SHALL succeed normally

### Requirement: Frontend enforces a 60-second resend cooldown

The client SHALL prevent the user from requesting a resend for at least 60 seconds after the most recent OTP send. The resend action SHALL be unavailable (visually and functionally) during this cooldown period.

#### Scenario: Resend is blocked during cooldown

- **WHEN** an OTP has been sent within the last 60 seconds
- **THEN** the resend action SHALL be disabled
- **AND** the UI SHALL display the remaining cooldown time in seconds

#### Scenario: Resend becomes available after cooldown

- **WHEN** 60 seconds have elapsed since the last OTP send
- **THEN** the resend action SHALL become available to the user

### Requirement: OTP expires after 300 seconds

A sent OTP SHALL become invalid 300 seconds (5 minutes) after it was originally issued. A resend extends the expiry by 300 seconds from the time of resend.

#### Scenario: OTP rejected after expiry

- **WHEN** a user submits an OTP more than 300 seconds after it was issued (or last extended by resend)
- **THEN** verification SHALL fail with an expiry error

#### Scenario: Resend extends OTP expiry

- **WHEN** a user requests a resend of an existing OTP
- **THEN** the OTP's expiry SHALL be reset to 300 seconds from the time of resend
