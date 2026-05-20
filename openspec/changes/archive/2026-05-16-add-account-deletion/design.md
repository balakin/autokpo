## Context

AutoKPO uses Better Auth for server-backed user accounts and cookie sessions. Account settings already display the signed-in account identity and contain a delete-account button, but that action is currently an unavailable placeholder.

Application data is local-first in a per-user Yjs document persisted to IndexedDB and synced through the worker `updates` table. Auth-owned tables already cascade from `user` to `session` and `account`, while `updates.user_id` is currently only a text key. The app also has `SignedOutCleaner`, which removes local sync metadata and Yjs IndexedDB databases after the browser becomes signed out.

Worker email delivery already uses Resend plus React Email templates. OTP emails are localized by forwarding `X-Preferred-Locale` from the client and translating strings in a worker-side Lingui `I18n` instance.

## Goals / Non-Goals

**Goals:**

- Let a signed-in online user permanently delete their own account from Account settings.
- Prevent accidental deletion by requiring the user to type their account email in the confirmation modal.
- Use Better Auth direct deletion without a separate delete-verification email.
- Delete server-side synced CRDT data together with the auth user.
- Send a localized minimal account-deleted email after deletion.
- Redirect the user to a signed-out goodbye page and rely on existing signed-out cleanup for local device data.

**Non-Goals:**

- Account recovery after deletion.
- Delayed deletion, soft deletion, tombstones, or retention/audit ledgers.
- A delete-verification email flow.
- Export-before-delete or backup download.
- Special migration handling for existing published data; the project is not published yet, so recreating local/remote databases is acceptable.

## Decisions

### Use Better Auth direct user deletion

Enable Better Auth `user.deleteUser.enabled` and call the client delete-user endpoint from Account settings after in-app confirmation. Do not configure `sendDeleteAccountVerification`; Better Auth therefore performs direct deletion for the signed-in user.

Alternatives considered:

- **Email verification before deletion**: safer for compromised sessions, but adds friction and is not required for this product stage.
- **Custom worker deletion route**: gives full control, but duplicates Better Auth session/auth deletion behavior.

### Confirm by typing the current account email

The modal will show the current account email and require an exact typed match before enabling the destructive submit button. This replaces the previous idea of warning about unsynced data; because deletion intentionally removes remote and local data, dirty-sync state is not meaningful in this modal.

Alternatives considered:

- **Simple confirm button**: too easy to press accidentally.
- **Warn about dirty data**: misleading because all account data is being deleted intentionally.

### Cascade `updates` from auth user deletion

Make `updates.user_id` reference `user.id` with `ON DELETE CASCADE`. This aligns sync data lifecycle with account lifecycle and avoids relying on a separate cleanup hook to delete synced data.

Alternatives considered:

- **Delete `updates` manually in `afterDelete`**: possible, but more fragile if hooks fail after the user row has already been deleted.
- **Leave orphaned encrypted updates**: simpler, but violates expected account deletion semantics.

### Send deletion email from Better Auth `afterDelete`

Use `user.deleteUser.afterDelete(user, request)` to send the post-delete email. Better Auth passes the deleted session user and the original request object; the worker can read `request.headers.get('X-Preferred-Locale')` and send to `user.email`.

The email template should follow the visual style of the existing OTP email while keeping the copy minimal:

> Vaš AutoKPO nalog je obrisan. Nalog i sinhronizovani podaci povezani sa ovom email adresom su trajno uklonjeni.

Alternatives considered:

- **Database hook**: receives the user but not the request, so it cannot read the preferred locale header.
- **Client-side email trigger**: unreliable because the user is being signed out and should not own server-side email delivery.

### Signed-out goodbye route

Add `/goodbye` to the signed-out route group, alongside sign-in pages. Signed-in users who visit it should be redirected by `SignedOutGate`, while deleted/signed-out users can see the goodbye page after the delete call completes.

## Risks / Trade-offs

- **Better Auth direct deletion requires a fresh session and may reject stale sessions** → Disabled the freshAge check (`session.freshAge: 0`) since the app uses email OTP only (no password re-entry); users cannot re-authenticate in a way that produces a fresh session.
- **Email delivery failure occurs after account deletion** → Log/throw through the hook according to existing Better Auth behavior; deletion itself is still the source of truth. Tests should define expected behavior for send failures.
- **D1 foreign key enforcement must be active for cascade behavior** → Verify schema/migration and worker tests delete a user and assert `updates` rows are removed.
- **Local cleanup is asynchronous and leader-gated** → Keep the goodbye page signed-out and rely on existing `SignedOutCleaner`; do not introduce a parallel cleanup mechanism unless tests show a gap.
- **Unpublished database reset assumption** → The migration can be generated for the desired final schema without preserving old `updates` data, but deployment notes should mention recreating local/remote D1 during development if needed.

## Migration Plan

- Update Drizzle schema so `updates.userId` references `user.id` with cascade deletion.
- Generate a new migration for the final schema. Because the product is not published, existing local/remote D1 data does not need compatibility migration handling.
- Recreate or reset development D1 databases as needed, then apply migrations locally and remotely before deployment.

## Open Questions

- None. The flow uses direct Better Auth deletion, email confirmation by typed account email, cascade deletion for sync data, and localized post-delete email from `afterDelete`.
