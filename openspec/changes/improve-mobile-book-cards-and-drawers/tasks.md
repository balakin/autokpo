## 1. Book Library Card Cleanup

- [ ] 1.1 Remove the visible entry-count label from `BookRow` cards in `apps/app/src/books/book-library.tsx` while preserving income, status tags, favorite, open, and delete actions.
- [ ] 1.2 Keep the delete confirmation entry-count copy intact so destructive action context still communicates how many entries will be affected.
- [ ] 1.3 Update book library tests to assert row cards no longer show entry-count labels and delete confirmations still show entry counts.

## 2. Safe-Area Foundation

- [ ] 2.1 Update `apps/app/index.html` viewport metadata to opt into safe-area painting with `viewport-fit=cover`.
- [ ] 2.2 Add reusable safe-area overlay CSS utilities or classes in `apps/app/src/index.css` for full-screen mobile overlay surfaces and safe content padding.
- [ ] 2.3 Ensure the safe-area utilities support different drawer background colors, including `bg-sidebar-bg` and `bg-background` surfaces.

## 3. Mobile Drawer Integration

- [ ] 3.1 Apply the safe-area surface/content pattern to the signed-in mobile sidebar drawer in `apps/app/src/app-shell/mobile-drawer.tsx`.
- [ ] 3.2 Apply the same pattern to the signed-in profile mobile drawer in `apps/app/src/auth/profile-popover.tsx`.
- [ ] 3.3 Apply the same pattern to the signed-out auth preferences mobile drawer in `apps/app/src/auth/auth-preferences-popover.tsx`.
- [ ] 3.4 Apply the same pattern to encryption profile/preferences mobile drawers in `apps/app/src/e2ee/encryption-profile-popover.tsx`.

## 4. Verification

- [ ] 4.1 Update existing AppShell/profile/preferences tests where practical to assert the mobile drawer safe-area structure or reusable class names.
- [ ] 4.2 Run targeted Vitest coverage for book library and affected drawer/popover components with the verbose reporter.
- [ ] 4.3 Run the app package build to catch TypeScript and bundling regressions.
- [ ] 4.4 Manually review the mobile layout at a narrow viewport; if iOS Safari or simulator is available, verify drawer unsafe/dead-zone regions match the open drawer surface.
