## 1. Website Package Setup

- [x] 1.1 Use the existing `apps/website` Astro package and replace the starter landing files.
- [x] 1.2 Ensure the website package can be built independently without changing `apps/app` behavior.
- [x] 1.3 Add local Manrope and JetBrains Mono font assets and retain their license files.
- [x] 1.4 Add landing favicon assets and theme-aware GitHub SVG assets.
- [x] 1.5 Add `@lucide/astro` for page icons and `@astrojs/check` for the website build.

## 2. Design System and Theme

- [x] 2.1 Create inline global plain CSS with app-aligned OKLCH light/dark tokens for background, surfaces, foreground, muted text, borders, accent colors, shadows, and typography.
- [x] 2.2 Implement a small set of custom CSS primitives for layout sections, buttons, cards, FAQ items, and footer links.
- [x] 2.3 Implement system-preference theme initialization with an early inline script to prevent wrong-theme flash.
- [x] 2.4 Implement an accessible visible theme toggle that persists `light` or `dark` preference and updates `data-theme`, the `.dark` class, `aria-pressed`, and the accessible label.

## 3. Landing Page Content and Components

- [x] 3.1 Build the page layout in `src/pages/index.astro` with a sticky header, hero, features, trust/security, FAQ accordion, final CTA, and footer sections.
- [x] 3.2 Add Serbian Latin hero copy positioning AutoKPO for preduzetnici and paušalci as free, open source, and useful for KPO records and income tracking.
- [x] 3.3 Add primary `Otvori aplikaciju` links targeting `https://app.autokpo.com` and secondary GitHub links targeting `https://github.com/balakin/autokpo`.
- [x] 3.4 Add a decorative hero ledger mockup with Serbian KPO sample rows and totals.
- [x] 3.5 Add feature cards for KPO books, income entries, income overview with paušal limit, PDF/export, encrypted synchronization, and open source.
- [x] 3.6 Add trust/security copy for email/OAuth login, multi-device synchronization, end-to-end encryption, and open-source verification.
- [x] 3.7 Add FAQ entries for free/open-source status, non-official/legal boundary, data storage, server-readable KPO data, required account, and offline/local availability.
- [x] 3.8 Add footer content with project author note, GitHub, and AGPL-3.0 license.

## 4. Accessibility, Responsiveness, and Polish

- [x] 4.1 Ensure semantic landmarks, headings, links, buttons, focus states, and accessible names are present throughout the page.
- [x] 4.2 Ensure the layout is responsive across mobile, tablet, and desktop widths without horizontal overflow.
- [x] 4.3 Add restrained visual details such as a ledger mockup, precise card spacing, and financial-style mono details while avoiding generic SaaS aesthetics.
- [x] 4.4 Respect reduced-motion preferences for any entrance or hover animations.

## 5. Verification

- [x] 5.1 Run the website build command from `apps/website`; build runs `astro check --tsconfig tsconfig.app.json && astro build`.
- [x] 5.2 Update repository ESLint handling for Astro-generated `.astro` output and keep the Astro ESLint recommended config enabled.
- [x] 5.3 Manually inspect or review the rendered page in light and dark modes to confirm CTA links, FAQ copy, and responsive layout meet the implementation intent.
