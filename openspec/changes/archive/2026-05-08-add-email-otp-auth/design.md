## Context

The app already uses `better-auth` with Google social login, HttpOnly cookie sessions, and a remembered local user id that lets the local-first app reopen quickly before the server session is revalidated. The signed-out experience is intentionally small today: a single Google sign-in action plus theme and locale controls.

This change adds a second sign-in method without changing the core session model. The new method should stay passwordless, keep Better Auth as the owner of OTP issuance and verification, and avoid creating custom auth endpoints or a parallel identity system.

Constraints:

- The app runs as a Cloudflare Worker plus SPA on the same domain, so cookie sessions remain the preferred auth boundary.
- This is a proof of concept; the design should stay simple and avoid account-recovery, password, or profile-management work.
- The existing local-first startup and logout/wipe semantics must remain unchanged regardless of auth method.
- The current codebase already uses Better Auth and has standard auth tables, including `verification`, so the new flow should layer onto the existing auth foundation rather than replace it.

## Goals / Non-Goals

**Goals:**

- Add email OTP as a passwordless auth method alongside Google sign-in.
- Let the email OTP flow cover both first-time account creation and returning-user sign-in.
- Keep Better Auth responsible for OTP generation, verification, and session creation.
- Deliver OTP messages from the Worker using Resend without exposing API credentials to the browser.
- Reuse the existing `refreshSession()` and remembered-local-user flow after successful email OTP sign-in.

**Non-Goals:**

- Password-based auth, password reset, or account-management UI.
- Replacing or removing Google sign-in.
- Building custom auth routes when Better Auth already provides the required email OTP endpoints.
- Advanced anti-abuse controls beyond a minimal Better Auth OTP configuration suitable for a POC.

## Decisions

### Use Better Auth email OTP endpoints instead of custom worker routes

The implementation will extend the existing Better Auth server/client configuration with the email OTP plugin and use Better Auth's built-in endpoints mounted under `/api/auth/*`.

Resulting flow:

- Browser requests a code via `POST /api/auth/email-otp/send-verification-otp`
- Browser submits `email + otp` via `POST /api/auth/sign-in/email-otp`
- Better Auth creates the same HttpOnly cookie session used by Google sign-in
- Browser calls `refreshSession()` and proceeds with the normal local-first startup logic

Rationale:

- Better Auth already owns auth/session semantics in this app.
- The built-in endpoints match the required two-step flow directly.
- Avoiding custom routes reduces duplicated validation and session logic.

Alternatives considered:

- Custom `/api/login/send-code` and `/api/login/verify-code` routes: rejected because they would duplicate Better Auth behavior and create another auth surface to maintain.

### Keep default Better Auth email OTP sign-up behavior for the POC

The email OTP sign-in endpoint will allow unknown emails to create new accounts implicitly during successful verification, matching Better Auth's default behavior.

Rationale:

- The product goal is passwordless sign-in and sign-up with the same email flow.
- It removes the need for a separate registration path or pre-provisioning logic.
- It keeps the UI and mental model small for the proof of concept.

Alternatives considered:

- Disable sign-up for unknown emails: rejected for the POC because it adds account-lifecycle constraints without a matching admin or invite flow.

### Send OTP emails from the Worker using direct Resend HTTP requests

The Better Auth `sendVerificationOTP` callback will run on the Worker and send email through Resend's `POST https://api.resend.com/emails` API using `fetch`.

Configuration split:

- `RESEND_API_KEY` as a Wrangler secret and local `.dev.vars` secret
- A non-secret sender identity value such as `RESEND_FROM_EMAIL` or `RESEND_FROM` in Worker config

Rationale:

- The secret stays server-side and never enters the SPA bundle.
- The Worker already uses plain `fetch` for external services, so this is consistent with the existing codebase shape.
- The email body for a POC OTP is simple enough that a direct HTTP call is sufficient.

Alternatives considered:

- Resend SDK: rejected initially because it adds another dependency without meaningfully simplifying a single plain email send path.
- Browser-side email sends: rejected because the API key must remain private.

### Split the email OTP flow across two routes: `/sign-in` and `/sign-in/code`

The signed-out entry experience is split into two dedicated routes rather than a single-screen state machine:

- `/sign-in` — `AuthEntry`: Google sign-in action plus an email form (`EmailForm`) that validates the address, sends the OTP, and navigates to `/sign-in/code` on success.
- `/sign-in/code` — `EmailAuthPage`: displays the `EmailOtpSignIn` component where the user enters the 6-digit code. Redirects back to `/sign-in` if no email is in context.

The email address is passed between routes via `AuthEmailProvider`, a React context provider that wraps the entire signed-out route group. `AuthEntry` writes the address with `authEmail.setEmail()` before navigating; `EmailAuthPage` reads it from the same context.

The Google callback route is `/sign-in/social/callback`, replacing the previous `/auth/callback`.

Rationale:

- Each screen has a single focused task, which simplifies component state.
- Navigating away from `/sign-in/code` (e.g., back button) naturally discards in-progress OTP state without explicit reset logic.
- Context-based email passing is lighter than query params or URL state and avoids exposing the email address in the URL.

Alternatives considered:

- Single-page local state machine: rejected because mixing request and verify UI state in one component creates more conditional rendering and a harder-to-test surface.
- Passing email via URL query param: rejected because it exposes the address in browser history and referrer headers.

### Reuse the existing post-login session refresh and remembered-user contract

After successful email OTP verification, `EmailAuthPage` calls `auth.refresh()` and navigates to `/dashboard` on success. This reuses the same session-refresh path used after Google auth so the remembered local user id stays the only persisted browser-side auth hint.

Rationale:

- The existing local-first startup model is already correct and method-agnostic.
- Keeping one post-auth path reduces drift between Google and email login behavior.

Alternatives considered:

- Special-case email OTP to write user identity directly from the verify response: rejected because session fetch is already the established source of truth in the client.

### Auto-verify OTP on 6-digit completion with a resend cooldown

`EmailOtpSignIn` triggers verification automatically via a `useEffect` when `otp.length === 6`, without requiring an explicit submit button. A separate "Resend" button allows re-sending the code and is disabled for 30 seconds (`RESEND_COOLDOWN_SECONDS`) after each send to limit request frequency. A successful resend resets the countdown and clears the OTP input.

Rationale:

- Auto-submit removes a redundant tap for a fixed-length numeric code.
- The cooldown prevents trivial OTP flooding while keeping the resend path self-service.

Alternatives considered:

- Explicit verify button: rejected because the code length is always known, making an extra confirm step unnecessary friction.

### `sendVerificationOTP` only delivers OTP emails for `type: sign-in`

The Better Auth `sendVerificationOTP` callback returns early for any `type` other than `'sign-in'`. Only sign-in OTP emails are dispatched; other types (e.g., email-change verification) are silently dropped.

Rationale:

- The POC only implements the sign-in flow; other OTP types are not expected.
- Dropping unknown types defensively avoids accidental email delivery if Better Auth extends OTP types in future.

### Replace `SessionGate` with `SignedInGate` and `SignedOutGate`

The previous single `SessionGate` component is replaced with two focused guard components: `SignedInGate` (redirects to `/sign-in` if no user) and `SignedOutGate` (redirects to `/dashboard` if signed in). The router groups signed-in routes under `SignedInGate` and signed-out routes under `SignedOutGate + AuthEmailProvider`.

Rationale:

- Explicit per-group guards are easier to reason about than a single component handling both directions.
- `AuthEmailProvider` can be scoped only to the signed-out group where it is needed.

### Catch-all route redirects based on `localStorage` remembered user

The `*` catch-all route uses a `loader` that reads `readStoredUserId()` synchronously: if a remembered user exists the loader redirects to `/dashboard`; otherwise to `/sign-in`. This avoids a flash of the wrong gate before the async session loads.

Rationale:

- `readStoredUserId()` is synchronous, so the redirect can happen at loader time with no render cycle.
- Matches the existing local-first startup assumption that a stored id means "probably signed in."

## Risks / Trade-offs

- [Email delivery can fail independently of OTP generation] -> Surface request-code failures clearly in the auth UI and treat the send step as incomplete unless the Worker send succeeds.
- [Open sign-up by email can allow any reachable email address to create an account] -> Accept for the POC and revisit with allowlists or invite constraints if the product direction tightens later.
- [Email OTP adds a second auth path to test and maintain] -> Keep the flow narrow, reuse existing session/refresh/logout behavior, and avoid introducing separate auth architecture.
- [Resend config introduces more Worker environment surface] -> Keep it minimal: one secret for the API key and one sender identity config value.

## Migration Plan

1. Extend Better Auth server config (`worker/auth-options.ts`) with the email OTP plugin and Resend-backed `sendVerificationOTP` callback (sign-in type only).
2. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `wrangler.jsonc` env and `example.dev.vars`; regenerate `worker-configuration.d.ts`.
3. Extend the Better Auth client config (`auth-client.ts`) with the email OTP client plugin; add `requestEmailOtpSession` and `verifyEmailOtpSession` helpers to `auth-session.ts` with `ensureNoAuthError` normalization.
4. Add `AuthEmailContext`, `AuthEmailProvider`, and `useAuthEmail` for passing the email address between sign-in routes.
5. Replace `SessionGate` with `SignedInGate` and `SignedOutGate`; restructure the router with `/sign-in`, `/sign-in/code`, `/sign-in/social/callback` routes and a loader-based catch-all.
6. Build `EmailForm` (react-hook-form + zod validation), `EmailOtpSignIn` (auto-verify + resend cooldown), and `EmailAuthPage` components.
7. Update `AuthEntry` to embed `EmailForm` alongside Google sign-in.
8. Add worker tests (`email-otp-auth.spec.ts`) and app tests for all new components and session helpers.

Rollback strategy:

- Remove the email OTP plugin/config, remove the Resend env usage, and return the auth page to Google-only sign-in.
- Because Google auth remains intact, rollback is low risk as long as the Worker config no longer requires the Resend values.

## Open Questions

_All questions resolved during implementation._

- **Sender identity**: configured via `RESEND_FROM_EMAIL` Worker env var (non-secret). Local dev uses `.dev.vars`; production uses a Wrangler secret binding.
- **Resend code UX**: implemented as a dedicated "Resend" button on `/sign-in/code` with a 30-second cooldown, not by re-using the email submit form.
- **New-user sign-up verification**: relies entirely on Better Auth's default behavior — no extra app-side marking; successful OTP verification implicitly creates and activates the account.
