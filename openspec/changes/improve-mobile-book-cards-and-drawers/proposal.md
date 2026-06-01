## Why

Mobile users can hit two visual problems in the current interface: book library cards become crowded when entry counts sit beside income and status tags, and full-screen mobile drawers can expose mismatched iOS safe-area/dead-zone colors around Safari or standalone PWA chrome. This change improves small-screen readability and makes mobile overlays feel native on modern iPhones.

## What Changes

- Remove the visible entry-count label from book cards in the `/books` library list so status tags and income no longer collide on narrow screens.
- Preserve entry-count communication where it is action-critical, such as destructive delete confirmation copy.
- Make mobile full-screen drawers safe-area aware so their own surface background extends into iOS unsafe/dead-zone regions.
- Apply the safe-area treatment consistently to the signed-in sidebar drawer and account/preferences mobile drawers.
- Add viewport and CSS support required for safe-area ownership without changing desktop popover behavior.

## Capabilities

### New Capabilities

- `mobile-safe-area-overlays`: Defines safe-area behavior for mobile full-screen drawers and overlay surfaces.

### Modified Capabilities

- `book-library`: Book library cards no longer display the visible entry-count label in list rows.
- `app-shell`: The mobile sidebar drawer gains safe-area-aware full-screen surface behavior.
- `auth-preferences-popover`: Mobile preference drawers gain safe-area-aware full-screen surface behavior.

## Impact

- Affected UI code: `apps/app/src/books/book-library.tsx`, `apps/app/src/app-shell/mobile-drawer.tsx`, `apps/app/src/auth/profile-popover.tsx`, `apps/app/src/auth/auth-preferences-popover.tsx`, `apps/app/src/e2ee/encryption-profile-popover.tsx`.
- Affected global shell styling/metadata: `apps/app/index.html`, `apps/app/src/index.css`.
- Affected tests: book library rendering tests and mobile drawer/popover tests may need updated assertions for removed entry-count text and safe-area classes/structure.
- No data model, API, sync, worker, or dependency changes are expected.
