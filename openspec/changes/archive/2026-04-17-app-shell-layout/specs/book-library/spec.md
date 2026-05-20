## MODIFIED Requirements

### Requirement: Library route is the application entry point

The system SHALL mount a browser router whose book library route is `/books` (not the root route). The root route (`/`) SHALL redirect to `/dashboard`. On first load with no saved state, the user SHALL land on the Dashboard. Unknown routes SHALL redirect to `/dashboard`.

#### Scenario: Root URL redirects to dashboard

- **WHEN** the user opens the application at the root URL `/`
- **THEN** the application SHALL redirect to `/dashboard` and render the Dashboard

#### Scenario: Unknown routes redirect to dashboard

- **WHEN** the user navigates to a URL that does not match `/dashboard`, `/books`, `/books/:bookId`, or `/settings`
- **THEN** the application SHALL redirect to `/dashboard`

#### Scenario: Book library renders at /books

- **WHEN** the user navigates to `/books`
- **THEN** the library SHALL be rendered inside the AppShell content area

## REMOVED Requirements

### Requirement: Back-to-library action is available from both setup and working layouts

**Reason**: Navigation is now handled by AppShell breadcrumbs. Standalone back buttons are no longer needed.
**Migration**: Users navigate to the library via the "Knjige" sidebar item or breadcrumb links.
