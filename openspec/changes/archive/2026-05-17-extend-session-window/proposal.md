## Why

Sessions currently expire after 7 days of inactivity. This app is used seasonally — daily by active businesses, monthly or quarterly by others. A device that wasn't opened for 8 days loses its session, triggering a local data wipe via `SignedOutCleaner`, which destroys unsynced offline changes. With E2E encryption planned, aggressive local data wiping on session loss is no longer necessary.

## What Changes

- **Remove `SignedOutCleaner`**: the component that periodically wipes IndexedDB and sync metadata when no session is present. With a longer session window, accidental expiry becomes rare; with E2E encryption coming, the security argument for wiping plaintext data will be replaced by encryption.
- **Increase session lifetime to 60 days**: set `session.expiresIn` and `session.updateAge` in `auth-options.ts`. Any use within 60 days resets the clock (sliding window), matching Proton's approach.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

_(none — session lifetime is not currently specified in any spec)_

## Impact

- `apps/app/worker/auth-options.ts` — session config
- `apps/app/src/auth/signed-out-cleaner.tsx` — deleted
- `apps/app/src/auth/__tests__/signed-out-cleaner.spec.tsx` — deleted
- `apps/app/src/router.tsx` — remove `SignedOutCleaner` mount
