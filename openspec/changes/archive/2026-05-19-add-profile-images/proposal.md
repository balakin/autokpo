## Why

AutoKPO currently renders OAuth provider profile-image URLs directly, which leaks browser request metadata to third-party providers, can hit provider rate limits, and does not let users manage their own profile image. Profile images should be app-owned assets that work with the existing PWA/offline experience.

## What Changes

- Add app-owned profile images stored in Cloudflare R2 under extensionless random UUID object keys.
- Add an authenticated profile-image change flow that lets users crop/resize images in the browser and upload normalized WebP avatars.
- Import OAuth provider images server-side only as a one-time account initialization source; provider image URLs are never rendered by the browser.
- Add Better Auth user metadata for avatar import state and a hidden pending provider-avatar URL.
- Serve avatars from same-origin `/avatars/{randomUUID}` Worker routes and cache them for offline PWA use.
- Remove the account-settings placeholder that says avatar changes are unavailable.

## Capabilities

### New Capabilities

- `profile-images`: User-managed, app-owned profile image upload, OAuth provider image import, R2 storage, avatar serving, and cleanup behavior.

### Modified Capabilities

- `user-profile`: Avatar display must use app-owned image URLs or fallback initials rather than directly rendering provider URLs.
- `account-settings`: The Account tab must provide profile image change controls instead of an unavailable placeholder.
- `user-auth`: OAuth user creation must initialize profile-image import state without exposing provider avatar URLs to the client.
- `pwa-offline`: Avatar routes must bypass SPA navigation fallback and same-origin avatars must be runtime cached for offline display.

## Impact

- Cloudflare Worker/Hono routes for authenticated avatar upload and public avatar serving.
- Cloudflare R2 binding named `AVATARS` and Wrangler `run_worker_first` routing for `/avatars/*`.
- Better Auth configuration and generated auth/Drizzle/D1 schema for `imageStatus` and hidden `pendingAvatarUrl` fields.
- Account settings UI, profile avatar rendering, auth/session refresh behavior, and service worker runtime caching configuration.
- New React cropper dependency (`react-easy-crop`) and browser canvas WebP compression helper.
