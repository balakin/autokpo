## Why

AutoKPO is licensed under AGPL-3.0, which requires that users of a network-deployed service be offered access to the source code. The frontend currently has no mention of the license or a link to the source, which is both a compliance gap and a transparency omission.

## What Changes

- Add a small AGPL-3.0 + source link to the `AuthShell` footer (unauthenticated state)
- Add a small AGPL-3.0 + source link near the version badge in the `Sidebar` (authenticated state)

## Capabilities

### New Capabilities

- `agpl-notice`: A minimal license notice component (link + label) displayed in two persistent locations — the auth shell footer and the sidebar bottom — pointing to the source repository.

### Modified Capabilities

<!-- none -->

## Impact

- `apps/app/src/auth/auth-shell.tsx` — add footer with notice
- `apps/app/src/app-shell/sidebar.tsx` — add notice near version badge
- i18n: notice text needs translation strings (Serbian, English, Russian)
