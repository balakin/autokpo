## 1. Book Library Card Cleanup

- [x] 1.1 Remove the visible entry-count label from `BookRow` cards in `apps/app/src/books/book-library.tsx` while preserving income, status tags, favorite, open, and delete actions.
- [x] 1.2 Keep the delete confirmation entry-count copy intact so destructive action context still communicates how many entries will be affected.
- [x] 1.3 Update book library tests to assert row cards no longer show entry-count labels and delete confirmations still show entry counts.

## 2. Safe-Area Foundation

- [x] 2.1 Update `apps/app/index.html` viewport metadata to opt into safe-area painting with `viewport-fit=cover`.
- [x] 2.2 Add reusable safe-area overlay CSS utilities or classes in `apps/app/src/index.css` for full-screen mobile overlay surfaces and safe content padding.
- [x] 2.3 Ensure the safe-area utilities support different drawer background colors (all drawers now use `bg-background`; sidebar-specific tokens were removed in task group 4).

## 3. Mobile Drawer Integration

- [x] 3.1 Apply the safe-area surface/content pattern to the signed-in mobile sidebar drawer in `apps/app/src/app-shell/mobile-drawer.tsx`.
- [x] 3.2 Apply the same pattern to the signed-in profile mobile drawer in `apps/app/src/auth/profile-popover.tsx`.
- [x] 3.3 Apply the same pattern to the signed-out auth preferences mobile drawer in `apps/app/src/auth/auth-preferences-popover.tsx`.
- [x] 3.4 Apply the same pattern to encryption profile/preferences mobile drawers in `apps/app/src/e2ee/encryption-profile-popover.tsx`.

## 4. Sidebar Color Token Removal

- [x] 4.1 Remove the `--sidebar-*` CSS custom properties and their `@theme inline` registrations from `apps/app/src/index.css`.
- [x] 4.2 Update `apps/app/src/app-shell/sidebar.tsx` to use main design tokens (`bg-background`, `text-foreground`, `text-muted`, `border-border`, `bg-accent`, `text-accent-foreground`, `bg-default`).
- [x] 4.3 Update `apps/app/src/app-shell/mobile-drawer.tsx` to use `bg-background` instead of `bg-sidebar-bg`.
- [x] 4.4 Update `apps/app/src/router/route-lazy-components.tsx` skeleton to remove `bg-sidebar-bg`, `text-sidebar-fg`, and related token references.

## 5. App-Shell Mobile Layout

- [x] 5.1 Update `apps/app/src/app-shell/app-shell.tsx`: scope `h-dvh overflow-hidden` to `lg:`, change `main` to `pt-14 pb-4 lg:flex-1 lg:overflow-auto lg:py-0`.
- [x] 5.2 Update `apps/app/src/app-shell/top-bar.tsx`: make top bar `fixed inset-x-0 top-0 z-10 lg:static lg:inset-auto`.
- [x] 5.3 Update `apps/app/src/router/route-lazy-components.tsx` fallback to match the new app-shell layout structure (fixed header, no `overflow-hidden`).

## 6. CSS Drawer Slide Animations

- [x] 6.1 Add `@keyframes _drawer-exit-gate`, `_drawer-slide-in-*`, and `_drawer-slide-out-*` for all four placement directions in `apps/app/src/index.css`.
- [x] 6.2 Add `@layer components` rules overriding HeroUI's default transitions and applying the enter/exit keyframes based on `data-placement` and `data-exiting` attributes.
- [x] 6.3 Add `@media (prefers-reduced-motion: reduce)` block disabling all drawer animations.
- [x] 6.4 Switch all mobile `Drawer.Backdrop` instances to `variant="transparent"`.

## 7. Dashboard and Skeleton Grid

- [x] 7.1 Update `apps/app/src/dashboard/dashboard-page.tsx`: change stat-card grid from `lg:grid-cols-4` to cap at `sm:grid-cols-2`.
- [x] 7.2 Update `apps/app/src/app-shell/page-loading-skeleton.tsx` to match the same two-column cap.

## 8. Settings Page HeroUI Tabs

- [x] 8.1 Replace the custom `<Link>`-based pill tab navigation in `apps/app/src/settings/settings-page.tsx` with `<Tabs>` / `<Tabs.ListContainer>` / `<Tabs.List>` / `<Tabs.Tab>` using `href` props.

## 9. Working Layout Cleanup

- [x] 9.1 Remove the draft warning `<Alert>` block from `apps/app/src/working-layout/working-layout.tsx`.
- [x] 9.2 Add `className="w-fit"` to the `<Tabs.List>` in `working-layout.tsx`.

## 10. AuthShell / EncryptionShell Refactor

- [x] 10.1 Add `@utility grid-background` CSS utility in `apps/app/src/index.css` for the reusable grid-pattern background.
- [x] 10.2 Update `apps/app/src/auth/auth-shell.tsx` to use `grid-background` and reposition decorative gradient blobs to flank the form card.
- [x] 10.3 Update `apps/app/src/e2ee/encryption-shell.tsx` with the same refactor.

## 11. Responsive Preview Grids

- [x] 11.1 Update `apps/app/src/entity-profiles/entity-profile-preview.tsx` detail grid to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- [x] 11.2 Update `apps/app/src/signatures/signature-preview.tsx` detail grid to `grid-cols-1 sm:grid-cols-2`.

## 12. Verification

- [x] 12.1 Update existing AppShell/profile/preferences tests where practical to assert the mobile drawer safe-area structure or reusable class names.
- [x] 12.2 Run targeted Vitest coverage for book library and affected drawer/popover components with the verbose reporter.
- [x] 12.3 Run the app package build to catch TypeScript and bundling regressions.
- [x] 12.4 Manually review the mobile layout at a narrow viewport; if iOS Safari or simulator is available, verify drawer unsafe/dead-zone regions match the open drawer surface.
