## 1. Schema and configuration

- [x] 1.1 Add Better Auth `user.additionalFields` for `imageStatus` and hidden `pendingAvatarUrl`.
- [x] 1.2 Generate updated Better Auth schema artifacts with `auth:generate`.
- [x] 1.3 Generate a D1 migration for the new user fields with `db:generate`.
- [x] 1.4 Add the `AVATARS` R2 binding and `/avatars/*` `run_worker_first` route to `wrangler.jsonc`.
- [x] 1.5 Regenerate Cloudflare Worker types after Wrangler configuration changes.
- [x] 1.6 Add `react-easy-crop` as the avatar cropper dependency.

## 2. Worker avatar storage routes

- [x] 2.1 Implement a public `GET /avatars/:id` route that serves R2 objects from `AVATARS` with stored content type and immutable cache headers.
- [x] 2.2 Implement an authenticated profile image upload endpoint that accepts only WebP payloads up to 256 KB and validates WebP magic bytes.
- [x] 2.3 Store uploaded avatars at `avatars/{crypto.randomUUID()}` and update the authenticated user's `image` and `imageStatus`.
- [x] 2.4 Implement profile image removal that clears `image`, sets `imageStatus` to `ready`, and schedules old R2 object deletion with `waitUntil`.
- [x] 2.5 Schedule best-effort deletion of replaced R2 avatar objects without blocking upload/remove responses.
- [x] 2.6 On account deletion, schedule best-effort deletion of the user's R2 avatar object via `waitUntil` in the `afterDelete` hook.

## 3. OAuth provider avatar import

- [x] 3.1 Update provider profile mapping so new OAuth users set `image` to null, set `imageStatus` based on provider image availability, and store provider URLs only in hidden `pendingAvatarUrl`.
- [x] 3.2 Add a Better Auth user-create hook/background path that imports pending provider avatars after user creation.
- [x] 3.3 Fetch pending provider avatar URLs exactly as provided, enforce allowed content types (`image/jpeg`, `image/png`, `image/webp`) and 1 MB maximum response size, and store accepted bytes in R2.
- [x] 3.4 On import success, update `image` to `/avatars/{randomUUID}`, set `imageStatus` to `ready`, and clear `pendingAvatarUrl`.
- [x] 3.5 On import failure, leave `image` null, set `imageStatus` to `ready`, and clear `pendingAvatarUrl`.
- [x] 3.6 Ensure later OAuth sign-ins do not overwrite local profile images from provider profile data.

## 4. Account settings UI

- [x] 4.1 Reuse the existing Account settings avatar change button as the profile image entry point instead of adding a separate change control.
- [x] 4.2 Wire the existing avatar button to a hidden/native file input that accepts JPEG, PNG, and WebP source images.
- [x] 4.3 Open a modal with `react-easy-crop` after file selection and allow the user to save the crop or cancel without uploading.
- [x] 4.4 Add a Canvas export helper that outputs a 512×512 WebP blob and validates the 256 KB upload limit before submission.
- [x] 4.5 Wire the Account settings page to upload the normalized avatar and refresh account/session data on success.
- [x] 4.6 Add a remove-avatar action that calls the removal endpoint and refreshes account/session data on success.
- [x] 4.7 Add localized validation and error messages for unsupported files, WebP encoding failure, oversized output, upload failure, remove failure, and crop cancellation-safe cleanup.

## 5. Client auth and PWA behavior

- [x] 5.1 Extend client auth/session types to include `imageStatus`.
- [x] 5.2 Add bounded session/profile refresh while `imageStatus` is `importing`.
- [x] 5.3 Ensure avatar rendering continues to pass `user.image` through the existing avatar fallback component.
- [x] 5.4 Add `/avatars/` to the VitePWA navigation fallback denylist.
- [x] 5.5 Add Workbox runtime `CacheFirst` caching for successful `/avatars/*` image responses.

## 6. Tests and verification

- [x] 6.1 Add worker tests for avatar serving, upload validation, DB update behavior, and best-effort cleanup scheduling.
- [x] 6.2 Add tests for provider import success and failure paths, including content-type and max-size rejection.
- [x] 6.3 Add Account settings UI tests for the existing avatar button opening the file picker, selected file opening the crop modal, cancel preserving the current image, upload success, validation errors, and remove-avatar behavior.
- [x] 6.4 Add auth/session refresh tests for `imageStatus: importing` polling behavior.
- [x] 6.5 Verify PWA configuration changes for avatar fallback denial and runtime caching configuration.
- [x] 6.6 Run scoped tests, worker type generation/checks, and the app build.
