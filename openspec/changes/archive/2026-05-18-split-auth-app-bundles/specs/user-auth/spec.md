## MODIFIED Requirements

### Requirement: Navigation guards protect signed-in and signed-out routes

The route graph SHALL use `SignedInGate` and `SignedOutGate` components to enforce auth state on route groups. The route graph SHALL be created by `createAppRoutes()` and composed into the browser router from `router.tsx`.

- `SignedInGate` SHALL redirect signed-out users to `/sign-in`
- `SignedOutGate` SHALL redirect signed-in users to `/dashboard`
- The signed-out route group (`/sign-in`, `/sign-in/code`, `/goodbye`) SHALL be wrapped in both `SignedOutGate` and `AuthEmailProvider`
- The signed-in application shell SHALL only be loaded after `SignedInGate` determines that `AuthContext.user` is present
- The catch-all route SHALL redirect from stored session state to `/dashboard` when a remembered session exists, or `/sign-in` otherwise

#### Scenario: Signed-out user is redirected before signed-in app loads

- **WHEN** a signed-out user navigates directly to a signed-in route
- **THEN** `SignedInGate` SHALL redirect the user to `/sign-in`
- **AND** the signed-in application shell and signed-in page modules SHALL NOT be rendered to decide or perform the redirect

#### Scenario: Signed-in user enters signed-in app

- **WHEN** a signed-in user navigates to a signed-in route
- **THEN** `SignedInGate` SHALL allow the route group to render
- **AND** the signed-in application shell SHALL load for that authenticated user

#### Scenario: Stored session redirects catch-all route

- **WHEN** a user navigates to an unknown route
- **THEN** the catch-all route SHALL inspect stored session state
- **AND** it SHALL redirect remembered signed-in users to `/dashboard`
- **AND** it SHALL redirect users without a stored session to `/sign-in`
