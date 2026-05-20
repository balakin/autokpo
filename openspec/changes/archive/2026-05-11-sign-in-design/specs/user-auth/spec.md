## MODIFIED Requirements

### Requirement: Auth entry offers Google, GitHub, and email OTP sign-in methods

The system SHALL present Google sign-in, GitHub sign-in, and an email input on the `/sign-in` route. Submitting a valid email address SHALL send an OTP and navigate the user to the `/sign-in/code` route to complete verification.

The `/sign-in` and `/sign-in/code` routes SHALL present these methods inside `AuthShell` — a full-screen page with a gradient/grid background, a header with compact locale and theme selectors, and a centered sign-in card that follows the signed-in app design system. The `/sign-in` page SHALL show Google before GitHub and visually separate OAuth from email OTP with an `or` divider.

#### Scenario: Signed-out user sees all auth methods

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the screen SHALL display a Google sign-in action
- **AND** the screen SHALL display a GitHub sign-in action after Google
- **AND** the screen SHALL display an email input with an action to request a one-time code
- **AND** the email sign-in section SHALL be visually separated from OAuth actions by an `or` divider

#### Scenario: Google sign-in button triggers Google OAuth

- **WHEN** a signed-out user activates the Google sign-in action
- **THEN** `signIn('google')` SHALL be called

#### Scenario: GitHub sign-in button triggers GitHub OAuth

- **WHEN** a signed-out user activates the GitHub sign-in action
- **THEN** `signIn('github')` SHALL be called

#### Scenario: Email submission navigates to code-entry route

- **WHEN** a signed-out user submits a valid email address on `/sign-in`
- **THEN** the system SHALL request an OTP for that email
- **AND** the browser SHALL navigate to `/sign-in/code` where the user enters the received code
- **AND** the submitted email address SHALL be carried to `/sign-in/code` via `AuthEmailProvider` context

#### Scenario: /sign-in/code shows a masked email address

- **WHEN** a user lands on `/sign-in/code` after submitting an email
- **THEN** the page SHALL display a masked version of the email (e.g., `d***@example.com`) rather than the full address

#### Scenario: Accessing `/sign-in/code` without a prior email redirects to `/sign-in`

- **WHEN** a user opens `/sign-in/code` without an email address stored in `AuthEmailProvider`
- **THEN** the screen SHALL redirect the user to `/sign-in`
