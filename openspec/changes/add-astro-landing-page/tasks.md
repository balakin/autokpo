## 1. Website Package Setup

- [x] 1.1 Verify whether `apps/website` exists; if missing, create an Astro package at `apps/website` with package metadata, build/dev scripts, and static output configuration.
- [x] 1.2 Ensure the website package is included in the pnpm workspace and can be built independently without changing `apps/app` behavior.
- [x] 1.3 Add or confirm local font assets needed by the website, preferring the same Manrope and JetBrains Mono files used by the app when practical.

## 2. Design System and Theme

- [x] 2.1 Create global plain CSS with app-aligned light/dark tokens for background, surfaces, foreground, muted text, borders, accent colors, shadows, and typography.
- [x] 2.2 Implement a small set of custom CSS primitives for layout sections, buttons, cards, FAQ items, and footer links.
- [x] 2.3 Implement system-preference theme initialization with an early inline script to prevent wrong-theme flash.
- [x] 2.4 Implement an accessible visible theme toggle that persists `light` or `dark` preference and updates the document theme attribute.

## 3. Landing Page Content and Components

- [x] 3.1 Build the page layout from Astro components only, with header, hero, features, trust/security, FAQ, final CTA, and footer sections.
- [x] 3.2 Add Serbian Latin hero copy positioning AutoKPO for preduzetnici and paušalci as free, open source, and useful for KPO records and income tracking.
- [x] 3.3 Add primary `Otvori aplikaciju` links targeting `https://app.autokpo.com` and secondary GitHub links targeting `https://github.com/balakin/autokpo`.
- [x] 3.4 Add feature cards for KPO books, income entries, income overview, PDF export, encrypted synchronization, and open source.
- [x] 3.5 Add trust/security copy that distinguishes account/auth data from encrypted KPO document data.
- [x] 3.6 Add FAQ entries for free/open-source status, non-official/legal boundary, data storage, server-readable KPO content, required account, offline/local availability, and export capabilities.
- [x] 3.7 Add footer content with GitHub, AGPL-3.0, and open-source project notes.

## 4. Accessibility, Responsiveness, and Polish

- [x] 4.1 Ensure semantic landmarks, headings, links, buttons, focus states, and accessible names are present throughout the page.
- [x] 4.2 Ensure the layout is responsive across mobile, tablet, and desktop widths without horizontal overflow.
- [x] 4.3 Add restrained visual details such as ledger/grid texture, precise card spacing, and financial-style mono details while avoiding generic SaaS aesthetics.
- [x] 4.4 Respect reduced-motion preferences for any entrance or hover animations.

## 5. Verification

- [x] 5.1 Run the website build command from `apps/website` and fix any Astro, TypeScript, or CSS errors.
- [x] 5.2 Run repository-scoped ESLint and Prettier checks on `apps/website` using the repo's direct linting guidance.
- [x] 5.3 Manually inspect the rendered page in light and dark modes to confirm CTA links, FAQ copy, and responsive layout meet the spec.
