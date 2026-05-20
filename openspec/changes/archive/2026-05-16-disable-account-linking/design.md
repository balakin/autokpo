## Context

The app uses `better-auth` with three sign-in methods: Google OAuth, GitHub OAuth, and email OTP. Without explicit configuration, better-auth's implicit account linking behavior is undefined — when a social sign-in arrives for an email that already exists (created via OTP), better-auth may attempt to auto-link the accounts.

The goal is to block that auto-linking with a predictable error and surface a clear message to the user instead.

## Goals / Non-Goals

**Goals:**

- Prevent duplicate account creation for the same email across providers
- Prevent silent auto-merging of accounts
- Show a clear, actionable error when a social sign-in collides with an existing account
- Preserve a clean extension point for future explicit linking UI

**Non-Goals:**

- Building a UI to link providers to an existing account (future change)
- Handling the reverse case (social account exists, user tries email OTP with same address) — better-auth handles email OTP separately and does not auto-link in that direction

## Decisions

### 1. Use `accountLinking: { enabled: false }`

Setting `account.accountLinking.enabled = false` in `getAuthOptions()` makes better-auth return `{ error: "account not linked" }` from `link-account.mjs` whenever an implicit link would otherwise be attempted. The callback route then redirects to `errorCallbackURL` with `?error=account_not_linked`.

This is a one-line config change. Alternative considered: `disableImplicitLinking: true` — but that flag only disables implicit linking while still allowing explicit API linking calls. We want a hard block for now.

### 2. Handle `account_not_linked` in `OAuthCallback` with specific copy

The `OAuthCallback` component already handles arbitrary error codes via the `error` query param. The current fallback renders a raw code string. We add a recognized-code map that replaces `account_not_linked` with:

> "Nalog sa ovom email adresom već postoji. Prijavite se putem jednokratnog koda na email."

And adds a direct link/button to `/sign-in` (the email OTP entry point) in addition to the existing back-to-sign-in action.

No new state shape is needed — the existing `{ status: 'error'; code: string }` union covers this.

### 3. No backend changes beyond config

The `errorCallbackURL` is already wired to the OAuth callback route in `auth-session.ts`. The redirect with `?error=account_not_linked` lands on the existing `OAuthCallback` component. Only the copy rendered for that specific code is new.

## Risks / Trade-offs

- [Risk] better-auth upgrades may rename the error string → Mitigation: the unknown-code fallback still shows something sensible; a test pins the exact code so a rename surfaces as a test failure.
- [Risk] Users with existing social accounts who expect auto-linking will be blocked → Mitigation: the error message makes the next step explicit; no data is lost.

## Migration Plan

1. Deploy config change — no migration needed, no existing linked accounts are affected
2. The error UI change is purely additive — unknown error codes still render the generic fallback
