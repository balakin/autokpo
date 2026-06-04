## Why

AutoKPO needs a public landing page at `autokpo.com` that explains the product before users enter the authenticated app at `app.autokpo.com`. The current app contains the product experience, but there is no dedicated Serbian marketing/trust page for preduzetnici and paušalci who need to understand what AutoKPO does, how data is handled, and why the project is trustworthy.

## What Changes

- Add a single-page Astro landing site in the existing `apps/website` package.
- Present AutoKPO in Serbian Latin as a free, open-source KPO tool for preduzetnici and paušalci.
- Provide primary navigation and calls to action with `Otvori aplikaciju` linking to `https://app.autokpo.com`.
- Provide a secondary GitHub link to `https://github.com/balakin/autokpo`.
- Use a serious visual style aligned with the app's current Nordic Winter color system, Manrope/JetBrains Mono typography, and calm financial-dashboard tone.
- Implement light and dark modes with system preference support and a visible theme toggle.
- Include dashboard and book-page screenshot placeholders for later replacement.
- Include feature, trust/security, FAQ, final CTA, and footer sections.
- Clearly state that AutoKPO is free and open source without adding a pricing section.
- Include careful non-official wording: AutoKPO is a helper tool, not legal, tax, bookkeeping, or official advice.
- Clearly distinguish account/auth data from encrypted KPO document data in FAQ/security copy.

## Capabilities

### New Capabilities

- `website-landing-page`: Public Astro landing page for AutoKPO, including content, structure, theme behavior, screenshot placeholders, CTA links, FAQ, and footer.

### Modified Capabilities

None.

## Impact

- Affected package: `apps/website`.
- Uses Astro components and plain CSS; no React, UI kit, or component framework should be introduced for this landing page.
- Reuses app-derived design tokens conceptually, including light/dark color variables, Manrope, and JetBrains Mono where available.
- External links: `https://app.autokpo.com` and `https://github.com/balakin/autokpo`.
- Screenshot placeholder paths should be prepared for dashboard and book page assets, including light/dark variants.
