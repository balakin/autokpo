## Why

When a visitor browses the Russian or Serbian website and clicks "Open App," the app opens in English — ignoring the visitor's explicit language choice on the website. The app has no awareness of which website locale the user came from, so it falls back to `navigator.language` or the `'en'` default.

## What Changes

- Website "Open App" links gain a `?lang=<locale>` query parameter reflecting the current page locale
- The app's `readLocale()` function checks this query parameter as a **hint** (only when no prior in-app locale preference exists in localStorage), persisting the hinted locale to localStorage and cleaning the URL

No breaking changes. The `?lang=` param acts as a first-visit hint — once a user has explicitly chosen a language in the app, that preference takes priority.

## Capabilities

### New Capabilities

- `website-app-locale-bridge`: Website communicates the user's chosen locale to the app via a `?lang=` query parameter on "Open App" links

### Modified Capabilities

- `i18n`: Locale resolution algorithm gains a `?lang=` query parameter step between the localStorage check and the `navigator.language` fallback

## Impact

- **Website**: 3 `<a>` href attributes in `site-header.astro` and `landing-page.astro` gain a `?lang=` query parameter
- **App**: `src/i18n/locale-storage.ts` — `readLocale()` gains query-param checking logic; `src/i18n/locale-provider.tsx` — URL cleanup effect after hint is consumed
- No API changes, no new dependencies, no worker changes
