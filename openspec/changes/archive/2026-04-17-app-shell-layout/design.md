## Context

KPO is a client-side PWA for generating the Serbian tax book (Књига прихода и расхода). All data persists to localStorage. The app currently has three pages (BookLibrary, SetupWizard, WorkingLayout) each rendered as isolated `min-h-screen bg-background` wrappers with no shared shell, no persistent navigation, and no app identity. The default HeroUI theme provides no visual personality. Two new features (Dashboard, Settings) need a navigation structure to exist.

Current stack: React 19, HeroUI v3 beta (3.0.2), react-router-dom 7, Tailwind v4, Vite 8. All icons use `react-icons/fa6`. All text uses Inter variable font.

## Goals / Non-Goals

**Goals:**

- Introduce a shared AppShell layout with persistent sidebar navigation and top bar with breadcrumbs
- Establish "Fiscal Modernism" visual identity: warm paper tones, deep ink, constant dark sidebar, teal accent, gold highlights
- Replace Font Awesome 6 with Lucide icons (no pro-version lockout, cleaner aesthetic)
- Replace Inter with Manrope (UI) + JetBrains Mono (financial numbers)
- Replace WorkingLayout's two-column layout with tab-based navigation (Unosi/Profil/Potpis) to eliminate drawer-in-layering
- Add Dashboard and Settings placeholder pages wired into the navigation
- Restructure routes to accommodate new pages while preserving existing functionality

**Non-Goals:**

- Implementing Dashboard logic or real data (markup only with fake numbers)
- Implementing Settings logic (no theme toggle, no export/import, no language switch)
- Dark mode toggle (will live in Settings in a future iteration; dark theme variables are defined but not user-switchable yet)
- PWA or offline changes
- PDF export changes
- Adding new book features or entry types

## Decisions

### D1: Persistent sidebar (not top nav)

**Choice**: Left sidebar, 240px, always visible on desktop; HeroUI Drawer on mobile.

**Why**: A sidebar provides constant wayfinding across 4+ pages. Top nav would feel cramped with sidebar items + breadcrumbs + context actions. The constant dark sidebar anchors the "Fiscal Modernism" aesthetic — it's the frame around the content.

**Alternatives considered**:

- Top navigation bar: wastes horizontal space, competes with breadcrumbs and context actions
- Collapsible sidebar: adds complexity, the app has few enough nav items that collapse is unnecessary
- Tab-based top-level nav: doesn't scale when Dashboard/Settings are added alongside book-scoped routes

### D2: Constant dark sidebar across themes

**Choice**: Sidebar uses the same dark charcoal (`oklch(0.15 0.01 270)`) in both light and dark modes.

**Why**: The dark sidebar acts as a visual anchor. In light mode it creates contrast with the warm cream content area. In dark mode it blends into the deep navy content. The active item uses a subtle teal glow (not fill) so it's identifiable without jarring color shifts.

**Alternatives considered**:

- Theme-responsive sidebar: would need separate design tokens and could feel disconnected in light mode
- Transparent/glass sidebar: requires backdrop-filter, PWA inconsistency, harder to read

### D3: Tabs for book info (not Drawer)

**Choice**: HeroUI Tabs component with three tabs: "Unosi", "Profil", "Potpis". Content swaps below the tab bar. Works identically on mobile and desktop.

**Why**: The previous two-column layout placed profile/signature in a right sidebar. Moving that to a Drawer created 3-layer stacking (base → drawer → modal). Tabs eliminate the drawer entirely — each tab's edit actions open a single modal layer. Tabs also work natively on mobile without a separate responsive pattern.

**Alternatives considered**:

- HeroUI Drawer (right): layering problem with modals; confusing on mobile alongside nav drawer
- Accordion/collapsible sections: no clear visual priority, all visible = cluttered
- Keep two-column layout: profile/signature preview takes too much space from entries table on medium screens

### D4: Lucide icons via react-icons/lu

**Choice**: Replace all `react-icons/fa6` imports with `react-icons/lu` (Lucide).

**Why**: Lucide is single-variant (no Line/Fill choice paralysis), 100% coverage of needed icons, smallest footprint (~1.5K icons), shadcn/ui's default, ISC license, no pro-version paywall. Name mapping is intuitive and 1:1.

**Alternatives considered**:

- Remix Icon (`ri`): requires Line/Fill suffix choice per icon, lacks `ChevronDown` (uses `ArrowDownSLine`)
- Tabler Icons (`tb`): good but ~6K icons = large type definitions, filled variants risk inconsistency
- Phosphor (`pi`): 6 weight variants per icon = huge bundle, non-obvious names (`PiTray` for inbox)

### D5: Manrope + JetBrains Mono

**Choice**: Manrope for all UI text. JetBrains Mono for tabular/financial numbers (entry amounts, totals, year labels).

**Why**: Manrope is a geometric sans-serif with excellent Cyrillic support and a modern feel that complements the "Fiscal Modernism" aesthetic. JetBrains Mono provides monospaced alignment critical for financial data readability.

**Alternatives considered**:

- Keep Inter: functional but generic, no personality
- DM Sans: good Latin but weaker Cyrillic
- IBM Plex Sans: good but heavier, less geometric

### D6: Full labeled "Preuzmi PDF" button in top bar

**Choice**: DownloadPdfButton renders as a full HeroUI Button with label in the top bar, always visible on book routes.

**Why**: PDF download is a primary action, not a secondary tool. An icon-only button would hide its purpose behind a tooltip. A floating action button would obscure content. The top bar is always visible regardless of active tab.

### D7: Draft alert above tabs, always visible

**Choice**: The "Preuzeti dokument je nacrt" Alert renders above the Tabs component, visible on all three tabs.

**Why**: The warning relates to the PDF output which includes all book data, not just the current tab's content. Hiding it behind a tab would lose critical context.

### D8: Route restructure with redirect

**Choice**: `/` redirects to `/dashboard`. Routes: `/dashboard`, `/books`, `/books/:id`, `/settings`.

**Why**: Dashboard is the natural landing page (overview, quick access). Explicit `/dashboard` path makes the URL clear and bookmarkable. Redirect from `/` preserves backward compatibility.

### D9: SetupWizard keeps its Stepper inside AppShell

**Choice**: SetupWizard renders inside the AppShell content area (not full-screen overlay) and retains its custom WizardStepper component.

**Why**: The wizard is a guided sequential flow (Welcome → Profile → Signature). Tabs are for free navigation. Different UX patterns serve different purposes. The Stepper's visual progression (active/complete/upcoming) is appropriate for the wizard's constrained navigation.

### D10: Breadcrumbs replace back buttons

**Choice**: Top bar shows breadcrumbs (e.g., "Knjige › 2024"). No standalone back buttons.

**Why**: Breadcrumbs provide both wayfinding AND navigation — they show where you are and let you go back to any level. A back button only goes one level. Breadcrumbs are a standard web pattern that works without custom code.

## Risks / Trade-offs

- **Sidebar on small desktops**: A 240px sidebar + content may feel tight below 1024px. → Mitigation: Use responsive breakpoint (`lg:`) — sidebar becomes Drawer below 1024px.

- **Tabs hide profile/signature behind a click**: Users can't see profile and signature simultaneously with entries. → Mitigation: Tabs are clearly labeled. Most users spend 90%+ time on entries tab. Profile/signature are "set once, review rarely" content.

- **Constant dark sidebar may feel heavy**: Dark sidebar in light mode is a strong aesthetic choice. → Mitigation: It's an intentional design decision. The contrast creates the "frame" metaphor central to Fiscal Modernism.

- **Font migration**: Switching from Inter to Manrope may subtly affect text layout (different x-height, metrics). → Mitigation: Manrope and Inter have similar x-heights. Test all pages visually after migration.

- **Large change surface**: This change touches every page, the router, theme, icons, and fonts. → Mitigation: Task ordering ensures AppShell is built first, then pages are migrated one at a time. Icon/font swaps can be done as separate commits.
