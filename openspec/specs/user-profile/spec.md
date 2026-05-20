## Purpose

Define authenticated user profile avatar, profile panel, account-settings navigation, and sign-out safety behavior.

## Requirements

### Requirement: Profile avatar button appears in the top bar

The system SHALL render a profile avatar button as the rightmost element of the top bar, outside the `TopBarActionsSlot` portal target. The button SHALL always be visible regardless of the current route and SHALL never be displaced by contextual page actions.

#### Scenario: Profile button visible on all routes

- **WHEN** a signed-in user navigates to any route
- **THEN** the profile avatar button SHALL be visible at the right end of the top bar

#### Scenario: Profile button stays rightmost when page actions are present

- **WHEN** a page renders contextual actions via `TopBarActionsSlot`
- **THEN** those actions SHALL appear to the left of the profile button
- **AND** the profile button SHALL remain the rightmost element

### Requirement: Avatar displays provider image or initials fallback

The profile button SHALL display the user's app-owned profile image when available, or an initials-based avatar when the image is null or fails to load. The profile button SHALL NOT render OAuth provider image URLs directly.

#### Scenario: User sees their app-owned profile image

- **WHEN** the authenticated user has a non-null app-owned `image` in the session
- **THEN** the avatar SHALL render the image URL

#### Scenario: Email OTP user sees initials avatar

- **WHEN** the authenticated user has a null `image` in the session
- **THEN** the avatar SHALL render a circle with the first character of the email address uppercased

#### Scenario: Initials avatar color is deterministic

- **WHEN** the initials avatar is rendered for a given user
- **THEN** the background color SHALL be derived from the user ID
- **AND** the same user SHALL always see the same color across sessions

#### Scenario: Image load failure falls back to initials

- **WHEN** the avatar `<img>` fails to load
- **THEN** the avatar SHALL fall back to the initials circle

#### Scenario: Provider image URL is ignored by avatar rendering

- **WHEN** OAuth avatar import is pending
- **THEN** the profile avatar SHALL NOT render a Google or GitHub provider image URL

### Requirement: Profile panel shows identity, status, and sign-out

Clicking the profile avatar button SHALL open a profile panel containing three sections: identity, sync/online status, and a sign-out action. On desktop, this panel SHALL be a popover anchored to the avatar button. On mobile, this panel SHALL be a drawer.

#### Scenario: Popover opens on avatar click

- **WHEN** the user clicks the profile avatar button
- **THEN** a popover SHALL open anchored to the button

#### Scenario: Drawer opens on mobile avatar click

- **WHEN** the user clicks the profile avatar button on a mobile viewport
- **THEN** a drawer-style profile panel SHALL open

#### Scenario: Identity section shows email

- **WHEN** the profile popover is open
- **THEN** it SHALL display the cached email address and the avatar

#### Scenario: Identity falls back to user id when email is missing

- **WHEN** the profile panel is open and cached email is null
- **THEN** it SHALL display the user id as the identity text

#### Scenario: Online status is shown

- **WHEN** the profile popover is open and the device is online
- **THEN** the status section SHALL indicate an online state

#### Scenario: Offline status is shown

- **WHEN** the profile popover is open and the device is offline
- **THEN** the status section SHALL indicate an offline state

#### Scenario: Dirty state shown

- **WHEN** the profile popover is open and there are unsynced local changes
- **THEN** the status section SHALL indicate that data is not yet synchronized

### Requirement: Profile panel links to account settings

The profile panel SHALL provide an account settings action that navigates to `/settings/account`. The action SHALL be available from both the desktop popover and the mobile drawer variants of the profile panel.

#### Scenario: Desktop profile panel opens account settings

- **WHEN** a signed-in desktop user opens the profile popover
- **AND** activates the account settings action
- **THEN** the application SHALL navigate to `/settings/account`

#### Scenario: Mobile profile panel opens account settings

- **WHEN** a signed-in mobile user opens the profile drawer
- **AND** activates the account settings action
- **THEN** the application SHALL navigate to `/settings/account`

#### Scenario: Account settings action remains available offline

- **WHEN** the profile panel is open and the browser is offline
- **THEN** the account settings action SHALL remain available
- **AND** navigating to `/settings/account` SHALL allow the Account tab to explain the offline limitation

### Requirement: Sign-out is blocked when offline

When the device is offline, the sign-out button in the profile popover SHALL be disabled. An inline warning SHALL explain that sign-out requires a connection and SHALL inform the user they can clear browser site data as an emergency escape.

#### Scenario: Sign-out button disabled when offline

- **WHEN** the profile popover is open and the device is offline
- **THEN** the sign-out button SHALL be disabled

#### Scenario: Offline warning explains the limitation

- **WHEN** the profile popover is open and the device is offline
- **THEN** an inline warning message SHALL be visible above the sign-out button
- **AND** the warning SHALL mention clearing browser site data as an alternative

### Requirement: Sign-out requires confirmation when unsynced changes exist

When the device is online and the sync state is dirty, clicking sign-out SHALL open a confirmation modal before proceeding.

#### Scenario: Confirmation modal shown when dirty

- **WHEN** the device is online and `dirty` is true
- **AND** the user clicks the sign-out button
- **THEN** a confirmation modal SHALL open warning about unsynced changes

#### Scenario: Confirming the modal proceeds with sign-out

- **WHEN** the confirmation modal is open and the user confirms
- **THEN** the sign-out flow SHALL execute

#### Scenario: Cancelling the modal leaves the user signed in

- **WHEN** the confirmation modal is open and the user cancels
- **THEN** the modal SHALL close and the user SHALL remain signed in

### Requirement: Sign-out is immediate when online and data is clean

When the device is online and `dirty` is false, clicking sign-out SHALL execute immediately without a confirmation modal.

#### Scenario: Immediate sign-out when online and clean

- **WHEN** the device is online and `dirty` is false
- **AND** the user clicks the sign-out button
- **THEN** the sign-out flow SHALL execute without showing a confirmation modal
