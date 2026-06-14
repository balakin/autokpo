## Context

AutoKPO has two surfaces: a React PWA at `app.autokpo.com` and an Astro marketing site at `autokpo.com`. Both currently default to Serbian Latin (`sr-Latn`) as the fallback locale. The PWA uses Lingui with `sourceLocale: 'sr-Latn'` and detection chain `localStorage → navigator.language → DEFAULT_LOCALE`. The website uses Astro's built-in i18n routing with `defaultLocale: 'sr-Latn'` (unprefixed at `/`).

The change flips the default locale to English on both surfaces. Source strings (`<Trans>` content in the PWA) remain in Serbian Latin — this is a runtime fallback change, not a content migration.

## Goals / Non-Goals

**Goals:**

- English becomes the fallback locale when browser language detection fails
- English marketing landing at `/`, Serbian at `/sr-latn/`
- `x-default` hreflang points to English for SEO
- No changes to source strings or translation catalogs
- Existing users with stored locale preferences are unaffected

**Non-Goals:**

- Changing source locale (remains `sr-Latn`)
- Adding automatic browser-language redirect on the website
- Dynamic server-side locale detection
- Email template localization (already handled)

## Decisions

### Website: flip Astro `defaultLocale` rather than adding redirect logic

**Alternative**: Keep `defaultLocale: 'sr-Latn'` and add middleware to redirect `/` to `/en/` based on Accept-Language.

**Decision**: Flip defaultLocale. This is the Astro-native approach — no custom redirect middleware, no edge runtime, static output preserved. The tradeoff is a file reorganization (moving pages between directories), but this is a one-time cost that keeps the architecture simple.

### App: change `DEFAULT_LOCALE` constant only

**Alternative**: Add `Accept-Language` header parsing in the worker to pre-set locale before JS loads.

**Decision**: Keep it client-side only. The app is a PWA that already works offline — adding server-side locale detection would create a dependency on network for first paint. The `navigator.language` API covers the vast majority of cases: Serbian browsers return `sr`, English browsers return `en`, Russian browsers return `ru`. The fallback changes from `sr-Latn` to `en` only when none match.

### Source locale stays `sr-Latn`

The `<Trans>` strings in the PWA codebase are Serbian Latin. Changing them to English would require rewriting every translatable string and retranslating the Serbian catalog. The current arrangement — Serbian source code, English as a `.po` translation — works correctly. No change needed.

### x-default hreflang: `en`

Per Google's i18n guidelines, `x-default` should point to the page that serves as the language- or locale-selector page. With English as the new landing, English is the correct `x-default`.

## Risks / Trade-offs

| Risk                                                                                                         | Mitigation                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serbian users with unsupported browser language (e.g., browser in German) now see English instead of Serbian | These users can use the language switcher on the website or the locale selector in the app. The CRDT locale sync means they only need to set it once.                                                                                                                                          |
| Website file reorganization could miss a reference                                                           | All hardcoded `sr-Latn` references are tracked via grep. Only 2 x-default hreflang lines and the 404 page are hardcoded — everything else uses `astro:i18n` helpers or the `DEFAULT_LOCALE`-adaptive `getLegalLinks()`.                                                                        |
| Stale sitemap after paths change                                                                             | Sitemap regenerates on build. The `@astrojs/sitemap` config mirrors the `i18n` config, so flipping `defaultLocale` there regenerates correct URLs.                                                                                                                                             |
| SEO ranking dip during URL migration                                                                         | Canonical tags and hreflang alternates are correct from the first deploy. Search engines follow these to update their indexes. Old URLs (`/en/` for English, `/` for Serbian) will 404 temporarily — this is expected and search engines handle it through the new hreflang+canonical signals. |

## Open Questions

None. All decisions are resolved.
