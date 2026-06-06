## Context

The app already supports `sr-Latn`, `en`, and `ru` through `LocaleProvider`, and the website already exposes static localized legal document routes for Terms, Privacy, and Cookies. The app currently shows AGPL/source links in unauthenticated shells and the signed-in sidebar, while the Help page contains project, license, law, contribution, author, and encryption information. The sign-in page has no Terms/Privacy notice and the app has no in-app links to the public legal documents.

This change is pre-release legal navigation plumbing: the legal documents may still be finalized later, but app surfaces should already point users to the canonical public website routes.

## Goals / Non-Goals

**Goals:**

- Provide a reusable locale-to-legal-URL mapping for app code.
- Show a concise Terms/Privacy notice on the `/sign-in` page near the sign-in actions.
- Add compact Terms, Privacy, and Cookies links to unauthenticated shell footers (`AuthShell` and `EncryptionShell`).
- Add a Help page legal/privacy section with Terms, Privacy, and Cookies links.
- Ensure all user-visible labels are localized through Lingui and links use the active app locale.

**Non-Goals:**

- No cookie consent banner; current scope assumes only necessary cookies.
- No persisted Terms acceptance, version tracking, or database changes.
- No change to auth/session behavior, OAuth provider configuration, or email OTP flows.
- No finalization of website legal document body text.
- No legal links added to the authenticated sidebar footer; Help remains the signed-in discovery surface.

## Decisions

### Use a shared app helper for legal URLs

Create a small app-side helper that maps the active app locale to canonical `https://autokpo.com` legal document URLs:

- `sr-Latn` → `/terms/`, `/privacy/`, `/cookies/`
- `en` → `/en/terms/`, `/en/privacy/`, `/en/cookies/`
- `ru` → `/ru/terms/`, `/ru/privacy/`, `/ru/cookies/`

Rationale: the app and website are separate packages, so the app should not import website internals. A small local helper keeps URL generation consistent across auth, encryption, and help surfaces without coupling builds.

Alternative considered: hardcode URLs at each call site. This is simpler initially but risks drift and makes tests repetitive.

### Keep acceptance wording limited to Terms and Privacy

The sign-in notice SHALL mention Terms of Service and Privacy Policy only. Cookie Policy remains available from footer/help legal navigation.

Rationale: Terms acceptance and Privacy acknowledgement are directly tied to account entry. Cookie Policy is disclosure/navigation for necessary cookies and should not clutter the sign-in acceptance sentence.

Alternative considered: include Cookie Policy in the sign-in sentence. This would be more exhaustive but reads like cookie consent despite no optional-cookie banner being introduced.

### Use footer links as navigation, not acceptance

Footer legal links in `AuthShell` and `EncryptionShell` are compact navigation links alongside the AGPL/source notice. They do not carry acceptance language.

Rationale: the sign-in card contains the explicit “continuing to sign in” notice, while footers provide persistent discovery on pre-auth/locked screens.

### Help page gets all legal documents

The Help page SHALL include Terms, Privacy, and Cookies, because signed-in users should be able to find legal documents after entering the app.

Alternative considered: rely on the public website footer only. That leaves app users without an obvious in-app path.

## Risks / Trade-offs

- Placeholder legal documents may be visible before release → Acceptable for this iteration because the app is unreleased; final document content must be completed before deploy/release.
- Duplicate Terms/Privacy links on sign-in and footer → Acceptable because one is acceptance/acknowledgement copy and the other is persistent legal navigation.
- Locale URL mapping can drift from website routing → Mitigate with a single helper and tests covering all supported locales.
- Additional footer links can wrap on small screens → Use compact muted text; wrapping is acceptable and preferable to hiding legal navigation.
