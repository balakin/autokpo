## Context

The app currently supports two auth methods: Google OAuth (social) and email OTP. Both are handled by better-auth. The Google callback lands on `/sign-in/social/callback`, handled by a single `SocialAuthCallback` React component that calls `refreshSession()` and redirects to `/dashboard`.

The social auth session is initiated from `auth-session.ts` via `authClient.signIn.social({ provider, callbackURL, errorCallbackURL })`. The `callbackURL` is what better-auth appends to the OAuth redirect URI registered with the provider.

## Goals / Non-Goals

**Goals:**

- Add GitHub as a social provider via better-auth's built-in GitHub plugin.
- Replace the shared `/sign-in/social/callback` with provider-scoped paths so each provider's registered redirect URI is distinct and auditable.
- Simplify the callback error UI to a single display shape: provider name in heading, code below.
- Keep the `SocialAuthCallback` component provider-agnostic — it reads the provider from the URL param, not from auth logic.

**Non-Goals:**

- Linking multiple social accounts to one user (not supported by current better-auth config).
- Changing the session model (still HttpOnly cookie, same `refreshSession` flow).
- Adding a GitHub-specific UI beyond the sign-in button.

## Decisions

### Parameterized callback route: `/sign-in/oauth/:provider/callback`

A single route with a `:provider` param covers both providers and any future additions without duplicating the callback component. The component reads `useParams().provider` to resolve the display name.

Alternative considered: two static routes (`/sign-in/oauth/google/callback`, `/sign-in/oauth/github/callback`) each pointing to the same component. Rejected — a param is strictly simpler and the component has no provider-specific logic.

### Unified error state: `{ status: 'error'; code: string }`

Both OAuth-returned errors (`?error=access_denied`) and missing-session failures are collapsed into one state shape. The missing-session case uses the synthetic code `missing_session`. This removes the `missing-session` branch from the state union and unifies the render path.

Alternative considered: keeping `missing-session` as a distinct state with a different message. Rejected — the user's mental model is the same ("something went wrong, here's a code"), and separate state adds complexity without UX benefit.

### Provider display name via a static map in the component

```ts
const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};
```

The heading reads: `"{providerName} prijava nije bila uspešna."` If the provider param is missing or unrecognized, the heading falls back to the generic `"Prijava nije uspela."`.

Alternative considered: deriving the display name from the URL path directly (capitalizing the param). Rejected — inconsistent for multi-word or differently-cased provider names in the future.

### `signIn(provider)` added to `AuthContext`

The current `signIn()` takes no arguments and hardcodes `'google'`. Changing to `signIn(provider: 'google' | 'github')` keeps the context API consistent — one sign-in action, parameterized. The `auth-provider.tsx` forwards the param to `signInSession(provider)`.

Alternative considered: separate `signInWithGoogle()` / `signInWithGithub()` methods on context. Rejected — adds surface area to the context type without benefit; a union param is sufficient.

### GitHub env bindings follow the Google pattern

Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `wrangler.jsonc` alongside their Google equivalents. `auth-options.ts` gains a `github` field in its input type, mirroring `google`. After adding bindings, run `generate:worker-types` to update `worker-configuration.d.ts`.

### `auth.config.ts` (CLI-only) updated with empty GitHub strings

The CLI config used by `pnpm auth:generate` passes empty strings for all credentials. GitHub must be added there too so the better-auth CLI can reflect the full schema.

## Risks / Trade-offs

- **OAuth app registration**: GitHub OAuth app must be registered and redirect URIs configured to `/sign-in/oauth/github/callback` before the feature is live. This is an out-of-band step not covered by code changes.
- **Breaking URL change for Google**: existing bookmarks or OAuth apps pointing to `/sign-in/social/callback` will break. Mitigation: update the Google OAuth app's authorized redirect URIs to `/sign-in/oauth/google/callback` atomically with the deploy. No redirect shim needed — the old path will simply 404, which is acceptable since it was never a user-visible bookmark.
- **`missing_session` code visibility**: users will see `missing_session` as a literal string if the session fetch fails. This is intentional — it aids debugging — but is technical language. Accepted trade-off given it appears only on failure.

## Migration Plan

1. Register GitHub OAuth app; note `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
2. Update Google OAuth app authorized redirect URI to `/sign-in/oauth/google/callback`.
3. Deploy worker with new env bindings and updated better-auth config.
4. Deploy frontend with updated routes and UI.
5. No DB migration required.

Rollback: revert frontend deploy (restores old callback path); revert Google redirect URI. GitHub OAuth app can be left registered but unused.
