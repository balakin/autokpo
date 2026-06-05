## Why

AutoKPO needs a public landing page at `autokpo.com` that explains the product before users enter the authenticated app at `app.autokpo.com`. The current app contains the product experience, but there is no dedicated Serbian marketing/trust page for preduzetnici and paušalci who need to understand what AutoKPO does, how data is handled, and why the project is trustworthy.

## What Changes

- Replace the default Astro starter in `apps/website` with a custom single-page Astro landing site implemented directly in `src/pages/index.astro`.
- Present AutoKPO in Serbian Latin as a free, open-source KPO tool for preduzetnici and paušalci.
- Provide primary navigation and calls to action with `Otvori aplikaciju` linking to `https://app.autokpo.com`.
- Provide a secondary GitHub link to `https://github.com/balakin/autokpo`.
- Use a serious visual style aligned with the app's current light/dark color system, bundled Manrope/JetBrains Mono typography, calm financial-dashboard cards, and a ledger-style hero mockup.
- Implement light and dark modes with system preference support and a visible theme toggle.
- Include sticky header navigation, hero, feature grid, trust/security, FAQ accordion, final CTA, and footer sections.
- Clearly state that AutoKPO is free and open source without adding a pricing section.
- Include careful non-official wording: AutoKPO is a helper tool, not legal, tax, bookkeeping, or official advice.
- Explain account-based login, device synchronization, end-to-end encryption, and the distinction between account/auth data and encrypted KPO document data in the security/FAQ copy.
- Add landing-specific favicon assets and theme-aware GitHub icons.
- Add Astro checking to the website build through `@astrojs/check`, and use `@lucide/astro` for inline icons without adding a client UI framework.

## Capabilities

### New Capabilities

- `website-landing-page`: Public Astro landing page for AutoKPO, including content, structure, theme behavior, CTA links, FAQ, and footer.

### Modified Capabilities

None.

## Impact

- Affected package: `apps/website`.
- Uses a single Astro page, inline global plain CSS, native HTML elements, and minimal vanilla JavaScript; no React, UI kit, or component framework is introduced for page sections.
- Uses local Manrope and JetBrains Mono font files, OKLCH light/dark CSS variables, local favicon assets, and local GitHub SVG assets.
- External links: `https://app.autokpo.com` and `https://github.com/balakin/autokpo`.
