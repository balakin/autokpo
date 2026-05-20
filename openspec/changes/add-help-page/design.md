## Context

The sidebar currently has a version badge footer and an AGPL notice block as separate sections. There is no help route, no place for users to find legal references or contact/bug-reporting info, and no authorship attribution. This change adds a `/help` route and reorganizes the sidebar footer.

## Goals / Non-Goals

**Goals:**

- Introduce a `/help` route inside the signed-in app with structured content
- Consolidate the AGPL notice from the sidebar into the help page
- Add a "?" icon button in the sidebar version footer that navigates to `/help`

**Non-Goals:**

- Dynamic content, backend, or CMS — all content is static and hardcoded in source
- Unauthenticated access to `/help` — the page is signed-in only
- The `AuthShell` AGPL footer is unchanged

## Decisions

### Help page as a route, not a modal/drawer

The help page contains legal links and authorship info that benefit from being bookmarkable and linkable (e.g., from error messages or emails). A full route avoids z-index and focus-trap complexity and matches the patterns for settings pages. The "?" button navigates using React Router's `<Link>` or `useNavigate`.

### Sidebar footer: space-between layout with "?" button

The version badge row becomes `flex justify-between items-center`. The "?" button is a HeroUI icon-only `Button` with `variant="ghost"` and `size="sm"`, navigating to `/help` on press. The AGPL notice block is removed from the sidebar entirely.

### Lazy-loaded page component

`HelpPage` follows the existing lazy-loading pattern in `route-lazy-components.tsx`. No new dependency or chunk strategy is needed.

### Static content, fully i18n

All strings use `<Trans>` / `t` macros. Source locale is `sr-Latn`; `en` and `ru` translations must be filled in after `i18n:extract`.

## Risks / Trade-offs

- Removing the AGPL sidebar notice reduces its visibility → Mitigated: the notice remains in `AuthShell` (visible to all unauthenticated visitors) and is prominent on the help page. The spec for `agpl-notice` is updated to remove the sidebar requirement.
- Hardcoded GitHub URLs (contributor graph, issues) → Acceptable for now; if the repo moves, these need a code update. Could be env vars later, but adds complexity for minimal gain.

## Open Questions

None — all decisions made during exploration.
