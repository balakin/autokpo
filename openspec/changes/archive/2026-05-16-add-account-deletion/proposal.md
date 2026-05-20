## Why

Users can sign in and sync personal AutoKPO data, but they currently cannot permanently remove their account from the app. Adding account deletion gives users a clear self-service privacy control before the product is published.

## What Changes

- Replace the Account settings delete-account placeholder with a permanent deletion flow.
- Require a confirmation modal where the signed-in user types their current account email exactly before deletion can be submitted.
- Delete the signed-in Better Auth user directly without a separate verification email.
- Cascade deletion of synced CRDT update data when the auth user is deleted.
- Redirect the deleted user to a signed-out goodbye page.
- Send a small localized “account deleted” email after deletion, styled consistently with the existing OTP email.

## Capabilities

### New Capabilities

- `account-deletion`: Permanent account deletion flow, confirmation behavior, post-delete navigation, data deletion, and email notification.

### Modified Capabilities

- `account-settings`: The Account settings delete action changes from an unavailable placeholder to the entry point for account deletion.
- `user-auth`: Auth configuration gains direct Better Auth user deletion and signed-out goodbye routing behavior.
- `cloudflare-worker`: The sync `updates` table becomes tied to auth users with cascading deletion.
- `email-templates`: Adds a branded account-deleted email template and sender.
- `email-i18n`: The account deletion request forwards preferred locale so the post-delete email can be localized.

## Impact

- Account settings UI and tests under `apps/app/src/settings/`.
- Auth client/session helpers and router under `apps/app/src/auth/` and `apps/app/src/router.tsx`.
- Better Auth worker options in `apps/app/worker/auth-options.ts` and `apps/app/worker/auth.ts`.
- D1/Drizzle schema and generated migration for `updates.user_id` cascade behavior.
- React Email template and Resend sender under `apps/app/emails/` and `apps/app/worker/`.
- Lingui catalogs for source, worker, and email strings.
