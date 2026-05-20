## REMOVED Requirements

### Requirement: AGPL notice in authenticated sidebar

**Reason**: The AGPL notice and source link have been moved to the dedicated `/help` page (`help-page` capability), which is accessible from the sidebar via the "?" button. The sidebar footer is now reserved for the version badge and help navigation.

**Migration**: No user-facing migration needed. The notice remains visible in `AuthShell` (unauthenticated shell) and is now displayed on the `/help` page for authenticated users.
