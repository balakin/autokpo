## MODIFIED Requirements

### Requirement: Remembered local user enables optimistic local boot

The system SHALL NOT persist authenticated session data in `localStorage` for startup bootstrapping. On startup, the session query SHALL fetch the current session asynchronously via `sessionQueryOptions` (which configures `staleTime: 5 min`, `networkMode: 'offlineFirst'`, `retry: false`). While the session query is pending, auth-dependent route gates SHALL render null (loading) and SHALL NOT decide that the user is signed in or signed out.

When the browser is online, the server session response SHALL be authoritative. When the browser is offline and the service worker has a cached successful session response, the cached response MAY identify the last-known local user for offline local mode. The cached offline session SHALL NOT be treated as proof of current server authorization.

#### Scenario: Startup waits for session resolution

- **WHEN** the app starts without a resolved session query
- **THEN** auth route gates SHALL show a loading state
- **AND** the app SHALL NOT redirect as signed in or signed out until the session query resolves

#### Scenario: Online session response is authoritative

- **WHEN** the app starts or refreshes auth state while the network is available
- **THEN** the app SHALL use the server session response as the current auth state

#### Scenario: Offline cached session enables local mode

- **WHEN** the app starts while offline
- **AND** the service worker returns a previously cached successful session response
- **THEN** the app SHALL treat the cached session user as the local offline user
- **AND** the app SHALL continue to verify the server session when network access returns

#### Scenario: No session response resolves signed out

- **WHEN** the session query resolves with no authenticated user from an online server response
- **THEN** the app SHALL transition to the signed-out state
- **AND** the app SHALL clear local auth and encryption residue required by logout cleanup

### Requirement: Auth state propagates across tabs via BroadcastChannel

The auth provider SHALL propagate login and logout/session changes across tabs using BroadcastChannel messages rather than `localStorage` storage events. The `SessionSync` component rendered at the app root SHALL subscribe to session-change messages and update or clear the session query in the receiving tab. A tab that receives a session-change message SHALL update or clear its session query and apply the same auth-boundary cleanup rules as the initiating tab.

#### Scenario: Sign-in in another tab updates auth state

- **WHEN** a different tab completes sign-in and broadcasts a session-change message
- **THEN** the current tab SHALL refresh or update its session query to reflect the signed-in user

#### Scenario: Sign-out in another tab clears auth state

- **WHEN** a different tab completes logout and broadcasts a logout/session-change message
- **THEN** the current tab SHALL clear or refresh its session query
- **AND** the current tab SHALL stop using session state from the previous user

### Requirement: Logout and auth-session loss clear local residue

The system SHALL provide an online logout flow (`useAuth.logout()`) that clears the authenticated session, removes local user-specific residue from the device (encryption session material, protected service-worker runtime caches, and all non-session React Query cache entries), and broadcasts the logout to other tabs. The `cleanupSignedOutSession` helper SHALL perform the service-worker cache clearing and local wrapper deletion; `clearQueryCacheOnSignOut` SHALL reset the session query and remove all other cached queries.

Logout SHALL be restricted while offline for this change; the app SHALL NOT pretend that the remote server session was cleared when it cannot complete the logout request.

#### Scenario: Explicit logout clears local residue

- **WHEN** the signed-in user chooses the logout action while online
- **THEN** `useAuth.logout()` SHALL call `authClient.signOut()`, then `cleanupSignedOutSession(userId)`, then `clearQueryCacheOnSignOut(queryClient)`
- **AND** the app clears the authenticated session
- **AND** clears encryption session material for the previous user
- **AND** clears named protected service-worker runtime caches
- **AND** clears all non-session React Query cache entries
- **AND** broadcasts the logout/session change to other tabs
- **AND** returns to the signed-out flow

#### Scenario: Auth refresh loses session

- **WHEN** auth refresh reports no authenticated user from an online server response
- **THEN** the app SHALL clear the resolved authenticated session
- **AND** the session query SHALL be set to null
- **AND** the session change SHALL be broadcast to other tabs

#### Scenario: Resolved session changes to another user

- **WHEN** the app observes the resolved authenticated session change to a different user id
- **THEN** the app SHALL update the authenticated user state
- **AND** the encryption gate SHALL re-mount with the new user id, fetching the appropriate key-ring profile through the user-scoped query

#### Scenario: Offline logout fails without side effects

- **WHEN** the browser is offline
- **AND** the signed-in user chooses the logout action
- **THEN** the `authClient.signOut()` fetch SHALL fail
- **AND** the error SHALL prevent `cleanupSignedOutSession` and `clearQueryCacheOnSignOut` from running
- **AND** the app SHALL NOT complete local logout cleanup as if the remote session was cleared

### Requirement: Navigation guards protect signed-in and signed-out routes

The route graph SHALL use `SignedInGate` and `SignedOutGate` components to enforce auth state on route groups. The route graph SHALL be defined as the `appRoutes` array in `app-routes.tsx` and composed into the browser router by `createRouter()` from `router.tsx`.

- `SignedInGate` SHALL render a loading state while the session query is unresolved, redirect signed-out users to `/sign-in`, and allow signed-in users to continue.
- `SignedOutGate` SHALL render a loading state while the session query is unresolved, redirect signed-in users to `/dashboard`, and allow signed-out users to continue.
- The signed-out route group (`/sign-in`, `/sign-in/code`, `/goodbye`) SHALL be wrapped in both `SignedOutGate` and `AuthEmailProvider`.
- The signed-in application shell SHALL only be loaded after `SignedInGate` determines that the session user is present and the encryption gate determines that encrypted data is ready for the current auth session.
- The catch-all route (`*`) SHALL use `AuthStateRedirect`, which renders null while the session query is pending and redirects to `/dashboard` for signed-in users or `/sign-in` for signed-out users once resolved.

#### Scenario: Signed-out user is redirected before signed-in app loads

- **WHEN** a signed-out user navigates directly to a signed-in route
- **AND** the session query has resolved with no authenticated user
- **THEN** `SignedInGate` SHALL redirect the user to `/sign-in`
- **AND** the signed-in application shell and signed-in page modules SHALL NOT be rendered to decide or perform the redirect

#### Scenario: Auth gates wait while session is unresolved

- **WHEN** a user navigates to an auth-gated route before the session query resolves
- **THEN** the relevant auth gate SHALL render a loading state
- **AND** it SHALL NOT redirect to `/sign-in` or `/dashboard` until the session query resolves

#### Scenario: Signed-in locked user sees encryption gate before app shell

- **WHEN** a signed-in user navigates to a signed-in route
- **AND** encrypted data is not ready for the current auth session
- **THEN** the encryption gate SHALL render setup or unlock UI
- **AND** the signed-in application shell SHALL NOT load until encryption is ready

#### Scenario: Signed-in unlocked user enters signed-in app

- **WHEN** a signed-in user navigates to a signed-in route
- **AND** encrypted data is ready for the current auth session
- **THEN** `SignedInGate` SHALL allow the route group to render
- **AND** the signed-in application shell SHALL load for that authenticated user

#### Scenario: Resolved session redirects catch-all route

- **WHEN** a user navigates to an unknown route
- **AND** the session query has resolved
- **THEN** the catch-all route SHALL redirect signed-in users to `/dashboard`
- **AND** it SHALL redirect signed-out users to `/sign-in`
