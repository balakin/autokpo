## Why

The app's pages are isolated islands — each renders its own `min-h-screen bg-background` wrapper with no shared shell, no persistent navigation, and no app identity. Users navigate via scattered back buttons. The visual design uses HeroUI's default theme with no personality. Two planned features (Dashboard, Settings) need a proper navigation structure to exist.

## What Changes

- **BREAKING**: Introduce `AppShell` — a shared layout shell with persistent dark sidebar (desktop) / drawer (mobile), top bar with breadcrumbs, and content area via `<Outlet />`
- **BREAKING**: Restructure routes: `/` redirects to `/dashboard`, `/books` for book library, `/books/:id` stays, `/settings` added
- **BREAKING**: Replace Font Awesome 6 icons with Lucide (`react-icons/lu`) across the entire codebase
- **BREAKING**: Replace Inter font with Manrope (UI) + JetBrains Mono (tabular/financial numbers)
- Add "Fiscal Modernism" theme overrides: warm cream (light) / deep navy (dark) content areas, constant dark sidebar, teal accent, gold highlights
- Add Dashboard placeholder page (markup only, fake data)
- Add Settings placeholder page (markup only, no logic)
- **BREAKING**: Replace WorkingLayout's right sidebar with HeroUI Tabs (Unosi / Profil / Potpis), eliminating the drawer-in-layering problem
- **BREAKING**: Remove standalone back buttons from WorkingLayout and SetupWizard — breadcrumbs handle navigation
- Move DownloadPdfButton to top bar as full labeled button, always visible on book routes
- Place draft-warning Alert above tabs, always visible regardless of active tab
- Sidebar items: Panel (`/dashboard`), Knjige (`/books`), Podešavanja (`/settings`)
- Logo: "КПО" text only in sidebar header
- Version badge (gold accent) in sidebar footer

## Capabilities

### New Capabilities

- `app-shell`: Shared layout shell with sidebar, top bar, breadcrumbs, and content outlet
- `dashboard`: Dashboard page with stats cards, chart placeholder, and latest book card (markup only)
- `settings`: Settings page with Theme, Font, Language, Data sections (markup only)

### Modified Capabilities

- `book-library`: Remove self-contained page wrapper; render inside AppShell content area
- `working-layout`: Replace right sidebar with Tabs (Unosi/Profil/Potpis); move DownloadPdfButton to top bar; remove back button; add draft alert above tabs
- `setup-wizard`: Remove self-contained page wrapper; render inside AppShell; remove back button (breadcrumbs handle navigation)
- `setup-layout`: Remove standalone back button pattern (superseded by AppShell breadcrumbs)
- `icon-system`: Replace Font Awesome 6 with Lucide icon set from react-icons
- `local-fonts`: Replace Inter with Manrope + JetBrains Mono

## Impact

- **All page components**: Must strip self-contained wrappers and render inside AppShell
- **Router (`main.tsx`)**: Restructure to use layout route with `<Outlet />`; add redirect from `/` to `/dashboard`
- **Theme (`index.css`)**: Full theme override with color system, sidebar variables, font-face declarations
- **Every icon import**: `react-icons/fa6` → `react-icons/lu` (15+ files)
- **Font files**: Add Manrope + JetBrains Mono woff2; remove Inter
- **Dependencies**: No new npm packages needed (Lucide is in react-icons already)
- **Tests**: All page component tests need updating for new layout structure
