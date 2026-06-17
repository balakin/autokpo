## Why

AutoKPO currently describes itself differently across the public website, app HTML shell, PWA manifest, and in-app help text. This creates a fragmented English product message and leaves some literal translations, such as "Book of Achieved Turnover", that are awkward for users.

## What Changes

- Establish one English product positioning phrase for external copy: KPO record-keeping for flat-rate entrepreneurs in Serbia.
- Align public website landing copy, app static metadata, PWA install metadata, and in-app help/about copy with that positioning.
- Preserve compact, task-oriented in-app labels where longer wording would risk layout shifts.
- Keep official/form labels such as taxpayer, TIN, and taxpayer code where they describe regulated data fields rather than product positioning.
- Align Serbian Latin and Russian equivalents with the same terminology while keeping labels close to their current visual length.

## Capabilities

### New Capabilities

- `product-copy-consistency`: Defines consistent product positioning and localized copy constraints across website, app metadata, and app-visible explanatory text.

### Modified Capabilities

- `website-landing-page`: Align landing page title, metadata, hero, feature, trust, FAQ, and CTA copy with the unified positioning.
- `app-og-social-tags`: Align app HTML shell social/meta descriptions with the unified positioning.
- `pwa-offline`: Align PWA manifest description with the unified positioning while preserving existing install behavior.
- `help-page`: Align in-app project description copy with the unified positioning and avoid awkward literal KPO translations.

## Impact

- Affects localized website copy in `apps/website/src/i18n/landing.ts`.
- Affects app static metadata in `apps/app/index.html` and `apps/app/vite.config.ts`.
- Affects app and worker translation catalogs where extracted messages change.
- Affects in-app help/about source copy in `apps/app/src/help/help-page.tsx`.
- Does not introduce API, data model, dependency, routing, or authentication changes.
