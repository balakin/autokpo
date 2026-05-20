## ADDED Requirements

### Requirement: Preferred locale is forwarded for account deletion email

When requesting account deletion, the client SHALL include an `X-Preferred-Locale` header carrying the value of `getStoredLocale()` from `localStorage`. The worker SHALL read this header from Better Auth's `user.deleteUser.afterDelete(user, request)` request parameter. Values not in `WORKER_LOCALES` SHALL fall back to `'sr-Latn'`.

#### Scenario: Client sends preferred locale header with deletion request

- **WHEN** a signed-in user submits confirmed account deletion
- **THEN** the HTTP request to Better Auth's delete-user endpoint SHALL include `X-Preferred-Locale: <stored-locale>`

#### Scenario: Worker reads locale from delete request header

- **WHEN** Better Auth invokes `user.deleteUser.afterDelete(user, request)` after account deletion
- **THEN** the worker SHALL read `request.headers.get('X-Preferred-Locale')` to choose the account-deleted email locale

#### Scenario: Missing or unrecognised locale header falls back to sr-Latn

- **WHEN** `X-Preferred-Locale` is absent or contains a value not in `['sr-Latn', 'en', 'ru']`
- **THEN** the account-deleted email SHALL be sent in `sr-Latn`
