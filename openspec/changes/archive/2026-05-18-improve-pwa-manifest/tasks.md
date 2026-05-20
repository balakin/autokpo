## 1. Manifest Configuration

- [x] 1.1 Add an explicit `manifest` object to the existing `VitePWA` configuration in `apps/app/vite.config.ts`.
- [x] 1.2 Set manifest identity and launch fields: `name`, `short_name`, `description`, `id`, `start_url`, `scope`, and `display`.
- [x] 1.3 Add `categories` values for business, finance, and productivity.
- [x] 1.4 Configure manifest `icons` using the existing 192x192 and 512x512 PNG assets.
- [x] 1.5 Ensure manifest configuration does not include `theme_color`, `background_color`, `lang`, or `shortcuts`.

## 2. Verification

- [x] 2.1 Build the app and confirm the generated web manifest contains the expected fields and icon entries.
- [x] 2.2 Confirm the generated manifest omits static theme, background, language, and shortcut fields.
- [x] 2.3 Run the relevant app checks for the PWA configuration change.

## 3. Cache Configuration Simplification

- [x] 3.1 Remove the redundant `includeAssets` option from the `VitePWA` configuration.
- [x] 3.2 Remove the `/fonts/*` CacheFirst `runtimeCaching` rule from the Workbox configuration.
- [x] 3.3 Build the app and confirm icons, local fonts, and the web manifest remain present in the generated precache output through `globPatterns`.
- [x] 3.4 Run the relevant app checks for the simplified PWA cache configuration.
- [x] 3.5 Add `txt` to the Workbox precache `globPatterns` so local license files remain cached with public assets.
- [x] 3.6 Build the app and confirm local license text files are present in the generated precache output.
