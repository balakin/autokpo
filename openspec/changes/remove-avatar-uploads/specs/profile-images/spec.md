## ADDED Requirements

### Requirement: Avatar upload and import are permanently disabled

The system SHALL NOT provide avatar upload, OAuth import, or avatar image serving. The `UserAvatar` component SHALL render initials fallback only. Clicking or tapping the avatar in the account settings page SHALL show a toast notification indicating the feature is unavailable.

#### Scenario: Avatar always shows initials

- **WHEN** any authenticated user is displayed in the UI (profile popover, settings page, encryption profile popover)
- **THEN** the `UserAvatar` component SHALL render a colored initial based on the user's email
- **AND** the component SHALL NOT render an image

#### Scenario: Settings avatar shows disabled tooltip on hover

- **WHEN** a signed-in user hovers over the avatar in the account settings page
- **THEN** a tooltip SHALL appear with the message "Promena avatara trenutno nije dostupna"
- **AND** the avatar SHALL render initials (no image)

## REMOVED Requirements

### Requirement: Profile images are app-owned assets

**Reason**: R2 bucket and avatar storage are being removed to eliminate unbound Cloudflare billing risk.
**Migration**: No migration needed. Existing R2 objects will become inaccessible when the binding is removed; they can be manually deleted via Cloudflare dashboard.

### Requirement: User can upload a normalized profile image

**Reason**: Avatar upload endpoints and R2 storage are removed.
**Migration**: Users who previously had avatars will see initials fallback in the UI.

### Requirement: OAuth provider image import is best-effort initialization

**Reason**: OAuth avatar import flow and R2 storage are removed.
**Migration**: New OAuth sign-ups will have no image; `user.image` remains null.

### Requirement: Avatar import status controls client refresh

**Reason**: `imageStatus` field and polling logic are removed.
**Migration**: No polling occurs; auth client schema no longer includes `imageStatus`.

### Requirement: Old avatar objects are cleaned up best-effort

**Reason**: R2 binding is removed; no avatar objects exist to clean up.
**Migration**: Existing R2 objects are orphaned and should be manually deleted.

### Requirement: Avatar objects are served from R2

**Reason**: R2 binding and `/avatars/*` routes are removed.
**Migration**: Requests to `/avatars/*` will hit the SPA fallback (the worker no longer handles these paths).
