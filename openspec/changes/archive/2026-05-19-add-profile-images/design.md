## Context

AutoKPO uses Better Auth for Google, GitHub, and email OTP authentication. The current user session includes `image`, and UI components render that value directly when present. For OAuth users this value comes from the provider, which means profile avatar rendering can make browser requests to Google or GitHub. That leaks request metadata to the provider, can hit provider-side rate limits, and does not allow users to manage an AutoKPO-specific profile image.

The app is a Cloudflare Worker/PWA. Persistent auth data lives in D1 through Better Auth/Drizzle, static app assets are served by Cloudflare Assets, and the PWA service worker already precaches the app shell. No R2 binding exists yet.

## Goals / Non-Goals

**Goals:**

- Store all rendered profile images as app-owned objects in Cloudflare R2.
- Never render Google/GitHub profile-image URLs in the browser.
- Allow users to change their profile image from Account settings.
- Import provider images once, server-side, as account initialization only.
- Make same-origin avatar URLs cacheable by the PWA for offline display.
- Keep avatar processing lightweight enough for Cloudflare Workers free-tier constraints.

**Non-Goals:**

- Server-side image resizing/conversion with Sharp or WASM codecs.
- Keeping app profile images synchronized with provider profile changes after account creation.
- Auth-protecting individual avatar image reads.
- Strong deletion guarantees for already-cached CDN/browser copies.
- Retrying failed provider avatar imports in v1.

## Decisions

### Store avatars in R2 behind same-origin extensionless routes

Use an R2 binding named `AVATARS`. Store objects under keys shaped as `avatars/{crypto.randomUUID()}` and expose them through same-origin public routes shaped as `/avatars/{randomUUID}`. Do not include file extensions in URLs; use R2 HTTP metadata for `Content-Type`.

Rationale: random immutable URLs avoid user-id enumeration, make URL changes act as cache invalidation, and allow aggressive caching without needing explicit image versions.

Alternative considered: user-id-based paths such as `/avatars/{userId}.webp`. Rejected because they are enumerable and require cache invalidation on overwrite.

### Use client-side crop/resize/compression for user uploads

The browser accepts JPEG, PNG, and WebP source files, then uses `react-easy-crop` plus Canvas APIs to produce a 512×512 WebP blob. The upload endpoint accepts only WebP, validates content type and WebP magic bytes, and enforces a 256 KB maximum body size.

The existing avatar change button in `AccountSettingsPage` remains the entry point. Activating it opens a native file picker. After the user selects a file, the app opens a modal containing the cropper. The user can save the cropped image, which triggers Canvas WebP export and upload, or cancel, which closes the modal without uploading or changing the account image.

Rationale: Sharp cannot run in Cloudflare Workers, and Worker CPU limits make image transcoding a poor fit. Client-side processing also strips original metadata by re-encoding pixels.

Alternative considered: Worker-side conversion. Rejected due to native dependency and CPU/memory constraints.

### Import provider avatars server-side as best-effort initialization

On new OAuth user creation, map provider avatar data into server-only state: `image = null`, `imageStatus = "importing"`, and hidden `pendingAvatarUrl = provider URL`. A Better Auth user-create hook schedules background import. The import fetches the provider URL exactly as received, validates response type and size, stores accepted bytes in R2, then updates the user record to `image = /avatars/{uuid}`, `imageStatus = "ready"`, and `pendingAvatarUrl = null`.

Accepted provider response content types are `image/jpeg`, `image/png`, and `image/webp`; maximum downloaded bytes are 1 MB. GIF, SVG, missing content type, oversized responses, and fetch failures are treated as import failure. Failure clears `pendingAvatarUrl`, sets `imageStatus = "ready"`, and leaves `image = null`.

Rationale: this prevents browser requests to providers while preserving a convenient initial avatar when possible. Provider URL mutation is avoided because provider URL formats are fragile.

Alternative considered: import inside `mapProfileToUser`. Rejected because provider fetch/R2 upload would block the critical auth path.

### Extend Better Auth user fields

Add Better Auth user additional fields:

- `imageStatus`: enum-like field `"importing" | "ready"`, `defaultValue: "ready"`, `input: false`.
- `pendingAvatarUrl`: string field, `required: false`, `input: false`, `returned: false`.

Run the existing generated-schema workflow (`auth:generate`, then `db:generate`) so Drizzle/D1 schema and migrations match Better Auth configuration.

Rationale: `imageStatus` gives the client a deterministic refresh signal, while `pendingAvatarUrl` keeps provider URLs available to server-side import code without exposing them to session/API responses.

### Treat `user.image` as the only render input

UI components continue to pass `user.image` into the avatar component, and the avatar component handles null or failed image loads with the existing initials fallback. `imageStatus` is not a rendering flag; it only controls short-lived session/profile refresh while import is pending.

Rationale: rendering remains simple and fallback logic stays centralized in the avatar component.

### Route and cache avatars explicitly

Add `/avatars/*` to Cloudflare `assets.run_worker_first` so avatar reads reach the Worker instead of SPA asset fallback. Add `/avatars/` to Workbox `navigateFallbackDenylist`, and add a Workbox runtime `CacheFirst` strategy for `/avatars/*` responses.

Rationale: avatars are immutable same-origin assets, so they are safe and useful to cache for offline display. They must not be accidentally served as `index.html` by Cloudflare Assets or service-worker navigation fallback.

### Cleanup old R2 objects asynchronously

On profile image replacement, upload the new object first, update `user.image`, then schedule deletion of the old R2 key with `waitUntil`. On deletion, clear `user.image` first, then schedule deletion of the old R2 key. Cleanup is best-effort in v1.

Rationale: R2 operations and D1 updates cannot be made one cross-service transaction. Prioritizing the DB pointer keeps the visible profile state correct; failed cleanup only leaves an orphan object.

## Risks / Trade-offs

- Provider import stores original JPEG/PNG/WebP bytes without normalization → provider avatars may have inconsistent dimensions. Mitigation: render with existing avatar cover/circle styling and keep provider import best-effort.
- Cleanup deletion can fail after DB update → old R2 objects may become orphaned. Mitigation: log failures and keep deletion non-blocking; add a durable cleanup outbox later only if storage leakage becomes material.
- Provider avatar import can fail or exceed size/type limits → user sees initials fallback. Mitigation: treat import as optional initialization and expose manual upload.
- Browser WebP encoding may be unavailable or output may exceed 256 KB → user cannot upload on that browser/file combination. Mitigation: detect output type/size client-side and show a localized validation error.
- Public random avatar URLs can still be accessed by anyone who has the URL. Mitigation: use high-entropy UUID paths and do not embed user identifiers in object keys.
