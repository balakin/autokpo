## Context

AutoKPO already uses `vite-plugin-pwa` for service worker registration, precaching, and static asset inclusion. The current configuration includes icon assets and Workbox behavior but does not define an explicit app manifest identity, leaving installed-app metadata effectively default or incomplete.

The current PWA config also lists public icon assets through `includeAssets` and defines a separate CacheFirst runtime cache for `/fonts/*`. The production Workbox glob already covers build-output `ico`, `png`, `svg`, `woff2`, `ttf`, and `webmanifest` files, and should also cover local `txt` license files shipped with public font assets. Because the app uses local build/public assets, the explicit public-asset list and separate font runtime cache duplicate the generated precache behavior.

The app supports multiple themes and locales at runtime. Theme color is already controlled dynamically through HTML/runtime behavior, and UI language is handled by the app's i18n system. Static manifest fields for theme, background, and language would either duplicate runtime behavior or encode a single value that does not represent all users.

## Goals / Non-Goals

**Goals:**

- Define a concise AutoKPO-specific web app manifest through the existing PWA plugin configuration.
- Provide stable install identity and launch behavior with `name`, `short_name`, `description`, `id`, `start_url`, `scope`, and `display`.
- Reuse existing public icon assets for 192x192 and 512x512 manifest icon entries.
- Include categories that describe the app as business/finance/productivity software.
- Keep the manifest intentionally minimal where runtime systems provide a better source of truth.
- Simplify PWA caching by relying on the build precache glob for emitted app assets, icons, manifest, local fonts, and local font license text files.

**Non-Goals:**

- Do not add PWA shortcuts.
- Do not add manifest `theme_color`, `background_color`, or `lang` fields.
- Do not generate localized manifests or separate theme-specific manifests.
- Do not create or redesign icon/image assets as part of this change.
- Do not add new runtime caching strategies.

## Decisions

- **Use one stable manifest instead of variants.** AutoKPO's installed identity should remain stable across themes and languages. Runtime theme and language preferences belong to the app shell, not to separate manifest files.
- **Omit manifest theme/background fields.** Runtime `<meta name="theme-color">` behavior can reflect the active theme more accurately than a static manifest value. Splash/background polish is intentionally deprioritized in favor of a smaller manifest contract.
- **Omit manifest language.** AutoKPO supports multiple languages, while manifest localization support is uneven. Because the app name is language-neutral and the UI handles i18n, a single static `lang` field is not necessary.
- **Set `display` to `standalone`.** Installed AutoKPO should launch as an app-like window rather than a normal browser tab.
- **Set `id`, `start_url`, and `scope` to root paths.** AutoKPO owns the frontend app surface, so `/` provides stable app identity, launch, and navigation scope without embedding user, locale, or theme state.
- **Use existing icon files.** The existing 192x192 and 512x512 PNG assets are sufficient for baseline manifest icon coverage. The 512x512 entry can advertise maskable use only if the current artwork is visually safe for adaptive icon cropping.
- **Remove `includeAssets`.** Public icons and manifest-related files are already included in the generated precache through Workbox `globPatterns`, so maintaining a second explicit list adds stale-entry risk without improving offline behavior.
- **Include `txt` in the precache glob.** Local font license files are public text assets that should remain available alongside the fonts they document when relying on the generated precache.
- **Remove font runtime caching.** Local fonts and their license text files are build/public assets and are already matched by the precache glob. A separate `/fonts/*` CacheFirst runtime cache is unnecessary unless the app later introduces remote or non-build font requests.

## Risks / Trade-offs

- **Install splash may use browser defaults without `background_color`.** → Accept this trade-off; runtime UI polish is more important than static splash metadata for now.
- **Some install surfaces may have less metadata without localized descriptions.** → Use a concise English description and avoid relying on manifest localization until there is a concrete need.
- **Maskable icon metadata could be misleading if artwork lacks safe padding.** → Verify the icon visually during implementation; if unsafe, use `purpose: "any"` only or add a follow-up asset task.
- **Changing manifest identity later can affect installed app continuity.** → Keep `id: "/"` stable once introduced.
- **Removing runtime font caching reduces fallback coverage for future remote fonts.** → Accept because current fonts are local build/public assets; reintroduce targeted runtime caching only if a future change adds remote font URLs.
- **Precache size increases slightly for license text.** → Accept because these files are small and keep local font licensing available offline.
