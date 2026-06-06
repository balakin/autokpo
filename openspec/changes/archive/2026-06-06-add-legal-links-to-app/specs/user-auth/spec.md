## ADDED Requirements

### Requirement: Sign-in page shows Terms and Privacy notice

The `/sign-in` page SHALL display a concise localized notice near the sign-in actions stating that continuing to sign in accepts the Terms of Service and acknowledges the Privacy Policy. The notice SHALL include links to the locale-appropriate public Terms and Privacy documents on `https://autokpo.com`.

The notice SHALL NOT include the Cookies Policy link and SHALL NOT require a checkbox or persist acceptance state in this iteration.

#### Scenario: Signed-out user sees legal notice on sign-in page

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the sign-in card SHALL display localized text explaining that continuing to sign in accepts the Terms of Service and acknowledges the Privacy Policy
- **AND** the notice SHALL include a Terms of Service link
- **AND** the notice SHALL include a Privacy Policy link
- **AND** the notice SHALL NOT include a Cookies Policy link

#### Scenario: Sign-in legal notice uses active locale links

- **WHEN** the active app locale is changed on the sign-in page
- **THEN** the Terms and Privacy link labels SHALL be translated
- **AND** the Terms and Privacy hrefs SHALL point to the matching localized `https://autokpo.com` legal document routes

#### Scenario: Sign-in does not require explicit legal checkbox

- **WHEN** a signed-out user signs in with Google, GitHub, or email OTP
- **THEN** the auth flow SHALL proceed without requiring a Terms checkbox
- **AND** the app SHALL NOT store a Terms acceptance timestamp or version
