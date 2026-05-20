## Why

The app has no central place for users to learn about the project, find relevant legal references, or know how to report problems. This information is scattered (the AGPL notice lives in the sidebar, law links are inline in cards) or missing entirely (no bug-reporting guidance, no authorship info).

## What Changes

- Add a `/help` route (signed-in only) with a full help page
- Add a "?" icon button to the sidebar version footer, aligned with `justify-between`, that navigates to `/help`
- Remove the AGPL notice block from the sidebar (it moves to the help page)
- Help page sections:
  - **O projektu** — brief description of AutoKPO and what it does
  - **Kako prijaviti problem** — link to GitHub Issues with guidance
  - **Zakonski propisi** — links to ZPDGa (čl. 42) and ZPDV (čl. 33)
  - **Doprinesite projektu** — open invitation to submit PRs, link to source repo
  - **Autori** — "Prvobitno kreirao Dmitrii Balakin" + link to GitHub contributors graph
  - **Licenca** — AGPL-3.0 notice with source link (relocated from sidebar)

## Capabilities

### New Capabilities

- `help-page`: The `/help` route, its page component, content, and i18n strings

### Modified Capabilities

- `app-shell`: Sidebar version footer gains a "?" button and loses the AGPL notice block; `/help` is added to the signed-in route tree
- `agpl-notice`: The sidebar AGPL notice requirement is removed; the notice moves to the help page (the `AuthShell` notice is unchanged)

## Impact

- `src/app-shell/sidebar.tsx` — version footer layout change, remove license block, add "?" button
- `src/app-routes.tsx` — add `/help` route
- `src/route-lazy-components.tsx` — add lazy import for `HelpPage`
- New file: `src/help/help-page.tsx`
- i18n `.po` files updated for all new strings (sr-Latn source; en + ru translations required)
- `openspec/specs/agpl-notice/spec.md` — delta to remove sidebar requirement
- `openspec/specs/app-shell/spec.md` — delta for sidebar footer and route changes
