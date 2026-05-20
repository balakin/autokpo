## 1. Theme & Fonts

- [x] 1.1 Download Manrope variable font (woff2) and license to `public/fonts/manrope/`
- [x] 1.2 Download JetBrains Mono variable font (woff2) and license to `public/fonts/jetbrains-mono/`
- [x] 1.3 Remove Inter font files from `public/fonts/inter/` (deleted directory)
- [x] 1.4 Update `src/index.css`: replace Inter `@font-face` with Manrope and JetBrains Mono `@font-face` declarations; update `@theme` `--font-sans` to Manrope and add `--font-mono` for JetBrains Mono
- [x] 1.5 Add "Fiscal Modernism" theme overrides in `src/index.css` `@layer base`: override `:root` (light) and `[data-theme="dark"]` (dark) CSS variables for background, surface, accent, foreground, muted, separator, border, gold; add sidebar-specific custom properties
- [x] 1.6 Apply `font-mono` class to financial numbers (entry amounts, totals, year labels) in EntriesTable and BookRow components

## 2. Icon Migration

- [x] 2.1 Replace all `react-icons/fa6` imports with `react-icons/lu` equivalents across all source files (FaPlus→LuPlus, FaArrowLeft→LuArrowLeft, FaTrash→LuTrash, FaBook→LuBook, FaInbox→LuInbox, FaPencil→LuPencil, FaCircleInfo→LuInfo, FaXmark→LuX, FaCheck→LuCheck, FaArrowRight→LuArrowRight, FaBarsStaggered→LuMenu, FaArrowUpRightFromSquare→LuExternalLink, FaDownload→LuDownload, FaChevronDown→LuChevronDown, FaChevronUp→LuChevronUp)
- [x] 2.2 Update `icon-system` spec in `openspec/specs/icon-system/spec.md` to reflect Lucide

## 3. AppShell Layout

- [x] 3.1 Create `src/app-shell/sidebar.tsx`: dark sidebar with КПО logo, navigation items (Panel/Knjige/Podešavanja with Lucide icons), active state indicator (teal glow), version badge (gold accent); constant dark background using sidebar CSS variables
- [x] 3.2 Create `src/app-shell/mobile-drawer.tsx`: HeroUI Drawer (placement="left") wrapping sidebar content, triggered by hamburger button
- [x] 3.3 Create `src/app-shell/top-bar.tsx`: breadcrumbs (react-router-dom + HeroUI Breadcrumbs), context actions area, mobile hamburger button
- [x] 3.4 Create `src/app-shell/app-shell.tsx`: composes Sidebar (desktop), MobileDrawer (mobile), TopBar, content area (`<Outlet />`); responsive breakpoint at `lg`
- [x] 3.5 Write tests for AppShell: sidebar renders, active nav item highlighted, mobile drawer opens/closes, breadcrumbs display correctly

## 4. Router Restructure

- [x] 4.1 Update `src/main.tsx`: restructure routes using AppShell as layout route; add `/dashboard`, `/books`, `/books/:bookId`, `/settings` routes; add `/` redirect to `/dashboard`; move `BooksProvider` to wrap `RouterProvider`

## 5. BookLibrary Migration

- [x] 5.1 Remove self-contained page wrapper (`min-h-screen bg-background` outer div) from `src/books/book-library.tsx`; render content directly for AppShell Outlet
- [x] 5.2 Remove back button from BookLibrary (if any); navigation handled by sidebar/breadcrumbs

## 6. WorkingLayout Redesign

- [x] 6.1 Replace two-column layout in `src/working-layout/working-layout.tsx` with HeroUI Tabs (Unosi/Profil/Potpis); "Unosi" tab renders EntriesTable; "Profil" tab renders EntityProfilePreview; "Potpis" tab renders SignaturePreview
- [x] 6.2 Move DownloadPdfButton out of WorkingLayout into AppShell top bar (render conditionally on `/books/:bookId` routes)
- [x] 6.3 Move draft-warning Alert above Tabs (visible regardless of active tab)
- [x] 6.4 Remove back button from WorkingLayout; navigation handled by breadcrumbs
- [x] 6.5 Update WorkingLayout tests for tab-based layout

## 7. SetupWizard Migration

- [x] 7.1 Remove self-contained page wrapper and full-screen overlay from `src/setup-wizard/setup-wizard.tsx`; render inside AppShell content area
- [x] 7.2 Remove back button from SetupWizard steps; navigation handled by breadcrumbs
- [x] 7.3 Update WelcomeStep to render as a card inside content area (not full-screen centered overlay)
- [x] 7.4 Update SetupWizard tests for in-shell rendering

## 8. Dashboard Placeholder

- [x] 8.1 Create `src/dashboard/dashboard-page.tsx`: stats cards (fake book count, fake entry count), chart placeholder, latest book card with "Otvori" link
- [x] 8.2 Write basic test for Dashboard page rendering

## 9. Settings Placeholder

- [x] 9.1 Create `src/settings/settings-page.tsx`: sections for Theme (light/dark/system toggle placeholder), Font, Language, Data (export/import/clear placeholders)
- [x] 9.2 Write basic test for Settings page rendering

## 10. Spec Updates

- [x] 10.1 Update `openspec/specs/book-library/spec.md`: change root route from `/` to `/books`, update redirect target
- [x] 10.2 Update `openspec/specs/working-layout/spec.md`: replace two-column layout requirement with tabs, remove back button requirement
- [x] 10.3 Update `openspec/specs/setup-wizard/spec.md`: remove full-screen wrapper, add in-shell rendering
- [x] 10.4 Update `openspec/specs/setup-layout/spec.md`: mark as fully superseded by AppShell breadcrumbs
- [x] 10.5 Update `openspec/specs/local-fonts/spec.md`: replace Inter with Manrope + JetBrains Mono

## 11. Integration & Cleanup

- [x] 11.1 Run `pnpm build` and fix all type errors
- [x] 11.2 Run `pnpm lint:fix` and resolve remaining lint errors
- [x] 11.3 Run `pnpm test` and fix all failing tests
- [ ] 11.4 Visual QA: verify sidebar, top bar, breadcrumbs, tabs, theme colors in light and dark modes
