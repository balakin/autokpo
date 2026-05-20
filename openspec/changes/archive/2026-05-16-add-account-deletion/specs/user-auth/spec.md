## MODIFIED Requirements

### Requirement: Navigation guards protect signed-in and signed-out routes

The router SHALL use `SignedInGate` and `SignedOutGate` components to enforce auth state on route groups, replacing the previous `SessionGate` component.

- `SignedInGate` SHALL redirect unsigned-in users to `/sign-in`
- `SignedOutGate` SHALL redirect signed-in users to `/dashboard`
- The signed-out route group (`/sign-in`, `/sign-in/code`, `/goodbye`) SHALL be wrapped in both `SignedOutGate` and `AuthEmailProvider`

### Requirement: Catch-all route redirects based on remembered user

- **WHEN** a user navigates to an unknown route
- **AND** a remembered local user id is stored in `localStorage`
- **THEN** the router SHALL redirect to `/dashboard`
- **WHEN** no remembered user id exists
- **THEN** the router SHALL redirect to `/sign-in`

The catch-all route loader SHALL read `readStoredUserId()` synchronously to determine the redirect target.

## ADDED Requirements

### Requirement: Better Auth direct account deletion is enabled

The worker SHALL enable Better Auth direct user deletion without configuring delete-account verification email. Account deletion SHALL use Better Auth's delete-user flow for the currently signed-in user.

The worker SHALL set `session.freshAge` to `0` to disable the session freshness check on the delete-user endpoint. The app uses email OTP only — there is no password re-entry path that would produce a fresh session, so the built-in freshness guard is not applicable.

#### Scenario: Signed-in deletion uses Better Auth delete user

- **WHEN** the client submits a confirmed account deletion request
- **THEN** the request SHALL use Better Auth's delete-user endpoint for the current session
- **AND** the worker SHALL NOT send a delete-account verification email before deleting the user

#### Scenario: Deleted session becomes signed out

- **WHEN** Better Auth completes direct user deletion
- **THEN** the deleted user's auth session SHALL be cleared
- **AND** the app SHALL observe signed-out state on the next auth refresh or route transition
