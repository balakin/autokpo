## Why

The OAuth callback page currently shows raw machine error codes (e.g. `access_denied`, `unable_to_create_session`) directly to users for all cases except `account_not_linked`. This is confusing UX and alarming for non-technical users, while still being suboptimal for support — users don't know what to do, and the code is prominent rather than copy-paste-friendly.

## What Changes

- Add localized, actionable messages for the most common/meaningful OAuth error codes (`access_denied`, `email_not_found`, `state_mismatch`, `please_restart_the_process`, `missing_session`)
- Replace the generic raw-code display with a generic translated message + small muted error code (for all unrecognized errors)
- `access_denied` shows no error code (user cancelled intentionally — no debugging needed)
- `account_not_linked` is unchanged (already has a localized message and no raw code)

## Capabilities

### New Capabilities

- `oauth-error-messages`: Tiered error handling in `OAuthCallback` — specific actionable messages for known codes, generic fallback with small muted code for unknown ones.

### Modified Capabilities

- `social-auth-collision`: The "unknown error codes still render the generic error fallback" scenario changes — the generic fallback now shows a translated message alongside the raw code in small muted text, rather than just the raw code.

## Impact

- `apps/app/src/auth/oauth-callback.tsx` — error rendering logic and UI
- `apps/app/src/auth/__tests__/oauth-callback.spec.tsx` — test coverage for new error tiers
- i18n `.po` files — new translatable strings for each tier-2 message and the generic fallback
