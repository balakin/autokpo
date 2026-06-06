## Why

AutoKPO already exposes public legal document routes on the website, but the app does not surface those documents at the account entry points or from in-app help. Before release, users should be able to see the Terms, Privacy Policy, and Cookie Policy from the relevant app surfaces, and the sign-in flow should clearly communicate Terms acceptance and Privacy Policy acknowledgement.

## What Changes

- Add a localized legal notice to the `/sign-in` card stating that continuing to sign in accepts the Terms of Service and acknowledges the Privacy Policy.
- Link the sign-in notice to the localized public website legal document URLs on `https://autokpo.com`.
- Expand unauthenticated shell footers (`AuthShell` and the E2EE/encryption shell) with small localized legal navigation links for Terms, Privacy, and Cookies alongside the existing AGPL/source link.
- Add a legal/privacy section to the signed-in Help page containing localized links to Terms, Privacy, and Cookies.
- Resolve legal URLs from the active app locale: Serbian Latin/default routes for `sr-Latn`, `/en/...` for English, and `/ru/...` for Russian.
- Do not add a cookie banner or terms-acceptance persistence in this iteration.

## Capabilities

### New Capabilities

- `app-legal-links`: Defines shared locale-aware legal document links used by app surfaces.

### Modified Capabilities

- `user-auth`: The auth entry screen gains a localized Terms/Privacy notice tied to sign-in actions.
- `help-page`: The help page gains a legal/privacy section linking to public legal documents.
- `agpl-notice`: Unauthenticated shell footers keep the AGPL/source notice and add compact legal navigation links.

## Impact

- Affected app code: `apps/app/src/auth/auth-entry.tsx`, `apps/app/src/auth/auth-shell.tsx`, `apps/app/src/e2ee/encryption-shell.tsx`, `apps/app/src/help/help-page.tsx`, related tests, and locale catalogs.
- Potential shared app helper/module for locale-aware legal URLs.
- No backend, database, auth provider, or website route changes are required.
