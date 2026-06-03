## Why

Mobile users can hit two visual problems in the current interface: book library cards become crowded when entry counts sit beside income and status tags, and full-screen mobile drawers can expose mismatched iOS safe-area/dead-zone colors around Safari or standalone PWA chrome. This change improves small-screen readability and makes mobile overlays feel native on modern iPhones.

## What Changes

- Remove the visible entry-count label from book cards in the `/books` library list so status tags and income no longer collide on narrow screens.
- Preserve entry-count communication where it is action-critical, such as destructive delete confirmation copy.
- Make mobile full-screen drawers safe-area aware so their own surface background extends into iOS unsafe/dead-zone regions.
- Apply the safe-area treatment consistently to the signed-in sidebar drawer and account/preferences mobile drawers.
- Add viewport and CSS support required for safe-area ownership without changing desktop popover behavior.
- Replace dedicated sidebar color tokens (`bg-sidebar-bg`, `text-sidebar-fg`, etc.) with standard design tokens so the sidebar shares the main surface palette.
- Fix the app-shell layout for mobile: pin the top bar with `fixed` positioning, add compensating `padding-top` on the main content area, and scope `h-dvh`/`overflow-hidden` to the `lg` breakpoint.
- Add CSS keyframe slide animations for all four drawer placement directions, replacing HeroUI's default opacity transitions. Reduced-motion is respected.
- Cap dashboard stat cards at two columns (`sm:grid-cols-2`) to avoid cramped 4-column grids on small tablets and improve mobile readability.
- Replace the custom `Link`-based pill tab navigation in the Settings page with the HeroUI `Tabs` component.
- Remove the draft warning `Alert` from the working layout (book page) and set the tabs list to `w-fit`.
- Refactor `AuthShell` and `EncryptionShell` to use the new reusable `grid-background` CSS utility and reposition the decorative radial gradient blobs to flank the centered form card.
- Make the entity profile preview and signature preview detail grids responsive (single column on mobile, expanding to 2–3 columns at wider breakpoints).

## Capabilities

### New Capabilities

- `mobile-safe-area-overlays`: Defines safe-area behavior for mobile full-screen drawers and overlay surfaces.

### Modified Capabilities

- `book-library`: Book library cards no longer display the visible entry-count label in list rows.
- `app-shell`: The mobile sidebar drawer gains safe-area-aware full-screen surface behavior; top bar is fixed on mobile; dedicated sidebar color tokens are replaced with main design tokens; CSS drawer slide animations added.
- `auth-preferences-popover`: Mobile preference drawers gain safe-area-aware full-screen surface behavior.
- `dashboard`: Stat card grid capped at two columns for improved mobile readability.
- `settings-page`: Tab navigation replaced with HeroUI `Tabs` component.
- `working-layout`: Draft warning Alert removed; tabs list width set to `w-fit`.
- `auth-shell` / `encryption-shell`: Background refactored to use `grid-background` utility; decorative blobs repositioned around the form card.
- `entity-profile-preview` / `signature-preview`: Detail grids are now responsive.

## Impact

- Affected UI code: `apps/app/src/books/book-library.tsx`, `apps/app/src/app-shell/mobile-drawer.tsx`, `apps/app/src/app-shell/app-shell.tsx`, `apps/app/src/app-shell/top-bar.tsx`, `apps/app/src/app-shell/sidebar.tsx`, `apps/app/src/app-shell/page-loading-skeleton.tsx`, `apps/app/src/auth/profile-popover.tsx`, `apps/app/src/auth/auth-preferences-popover.tsx`, `apps/app/src/auth/auth-shell.tsx`, `apps/app/src/e2ee/encryption-profile-popover.tsx`, `apps/app/src/e2ee/encryption-shell.tsx`, `apps/app/src/dashboard/dashboard-page.tsx`, `apps/app/src/settings/settings-page.tsx`, `apps/app/src/working-layout/working-layout.tsx`, `apps/app/src/entity-profiles/entity-profile-preview.tsx`, `apps/app/src/signatures/signature-preview.tsx`, `apps/app/src/router/route-lazy-components.tsx`.
- Affected global shell styling/metadata: `apps/app/index.html`, `apps/app/src/index.css`.
- Affected tests: book library rendering tests, mobile drawer/popover tests, and working-layout tests may need updated assertions.
- No data model, API, sync, worker, or dependency changes are expected.
