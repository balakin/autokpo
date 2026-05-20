## Why

The app currently relies on default/generated PWA manifest behavior that does not clearly express AutoKPO's installed-app identity. Improving the manifest will make browser install surfaces and installed launch behavior align with the product while avoiding unnecessary static fields that conflict with runtime theme and language behavior.

## What Changes

- Add an explicit web app manifest configuration for AutoKPO.
- Include stable install metadata: `name`, `short_name`, `description`, `id`, `start_url`, `scope`, `display`, `categories`, and `icons`.
- Use the existing 192x192 and 512x512 PNG icon assets for manifest icons.
- Keep theme color, background color, and language out of the manifest because theme is handled dynamically in HTML/runtime and language is handled by in-app i18n.
- Do not add manifest shortcuts.
- Remove redundant PWA asset/cache configuration for public assets that are already covered by the build precache glob, including local font license text files.
- Remove the separate font runtime cache because the app uses local build/public font assets that are already included in the generated precache.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pwa-offline`: Update the web manifest metadata requirement to define AutoKPO-specific installed-app metadata, intentionally omit static theme/background/language/shortcut metadata, and simplify PWA caching by relying on build precache output instead of redundant asset/runtime cache configuration while preserving offline access to local license text files.

## Impact

- Affects `apps/app/vite.config.ts` PWA manifest and Workbox configuration.
- Uses existing files in `apps/app/public/` for manifest icons.
- No new dependencies, routes, APIs, or database changes.
