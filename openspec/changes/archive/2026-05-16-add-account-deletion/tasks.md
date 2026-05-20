## 1. Data Model and Auth Configuration

- [x] 1.1 Update the `updates` Drizzle schema so `userId` references the Better Auth `user.id` column with `ON DELETE CASCADE`.
- [x] 1.2 Generate the D1 migration for the updated schema and reset/recreate development database state as needed for the unpublished project.
- [x] 1.3 Enable Better Auth direct user deletion without `sendDeleteAccountVerification`.
- [x] 1.4 Add a `user.deleteUser.afterDelete(user, request)` hook that reads `X-Preferred-Locale` from `request.headers` and sends the account-deleted email to `user.email`.

## 2. Email Template and Localization

- [x] 2.1 Add a React Email account-deleted template styled consistently with `OtpEmail` and driven by localized `i18n` props.
- [x] 2.2 Add a worker sender for account-deleted emails using Resend, `createI18n`, and fallback locale validation.
- [x] 2.3 Add source strings and fill Lingui translations for `sr-Latn`, `en`, and `ru` worker/email catalogs.
- [x] 2.4 Add or update email/worker tests for localized account-deleted email sending and Resend error handling.

## 3. Client Deletion Flow

- [x] 3.1 Add an account deletion API/helper that calls Better Auth delete-user with `callbackURL: '/goodbye'` and `X-Preferred-Locale` from `getStoredLocale()`.
- [x] 3.2 Replace the Account settings delete placeholder with a confirmation modal showing the current email and requiring exact typed email match.
- [x] 3.3 Disable deletion while offline or while the confirmation text does not match, and surface request failures without signing the user out.
- [x] 3.4 Ensure successful deletion clears stored session/auth state and transitions into the signed-out flow.

## 4. Goodbye Page and Routing

- [x] 4.1 Add a signed-out `/goodbye` route under the existing `SignedOutGate` group.
- [x] 4.2 Build a concise goodbye page using existing auth shell/page styling and localized strings.
- [x] 4.3 Verify signed-in users are redirected away from `/goodbye` by the existing signed-out guard.

## 5. Tests and Validation

- [x] 5.1 Add Account settings UI tests for opening the modal, typed-email enablement, offline disabled behavior, and successful delete submission.
- [x] 5.2 Add router/auth tests for `/goodbye` signed-out visibility and signed-in redirect behavior.
- [x] 5.3 Add worker/database tests proving deleting a Better Auth user cascade-deletes that user's `updates` rows.
- [x] 5.4 Run i18n extraction and fill all new translations.
- [x] 5.5 Run targeted tests, then app test/build validation for the completed change.
