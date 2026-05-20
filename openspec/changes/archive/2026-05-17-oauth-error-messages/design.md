## Context

`OAuthCallback` (`src/auth/oauth-callback.tsx`) handles the redirect after a social sign-in attempt. It reads an `?error=<code>` query param and currently renders either a specific message for `account_not_linked` or the raw code string for everything else. The error codes come from three sources: better-auth's callback route, the OAuth provider itself (e.g. `access_denied`), and the app's own session refresh logic (`missing_session`).

## Goals / Non-Goals

**Goals:**

- Show a localized, actionable message for each meaningful error code
- Show a generic translated message + small muted code for unrecognized errors (useful for support)
- Omit the raw code for `access_denied` (user-initiated, nothing to debug)
- Keep `account_not_linked` behavior unchanged

**Non-Goals:**

- Changing how errors are generated or redirected by the worker
- Adding retry logic or auto-redirect behavior
- Translating or handling errors from the email OTP flow

## Decisions

### Tiered error classification in component

Three tiers, encoded as a helper or inline condition in `OAuthCallback`:

| Tier               | Codes                                                                                                      | Rendering                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1 — user-cancelled | `access_denied`                                                                                            | Friendly message, no code          |
| 2 — actionable     | `account_not_linked`, `email_not_found`, `state_mismatch`, `please_restart_the_process`, `missing_session` | Specific message, no code          |
| 3 — generic        | everything else                                                                                            | Generic message + small muted code |

**Why not a lookup table of all possible codes?** better-auth can pass through arbitrary provider error strings, so exhaustive mapping is impossible. Tier 3 is the safe fallback.

**Why omit code for `access_denied`?** The user clicked Cancel — there's nothing to debug and showing a code implies something went wrong on our side.

### Small muted code rendering

For Tier 3, render the error code below the message in a small, muted style (e.g. `text-xs text-foreground-400`). This lets users copy it for support without it dominating the error card.

### i18n

All user-facing strings are new `<Trans>` blocks in Serbian (`sr-Latn`) as source, with translations added to `en` and `ru` `.po` files. Provider name interpolation (`{providerName}`) uses existing pattern.

## Risks / Trade-offs

- [New better-auth error codes] Future better-auth upgrades may introduce codes that fall into Tier 3 when a specific Tier-2 message would be better → Acceptable; Tier 3 is safe and informative.
- [`email_not_found` message mentions email OTP] If GitHub private email causes this, directing users to email OTP is still the right action → Fine for this app's auth model.
